import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import {
    colombiaTimestamps,
    colombiaUpdatedAt,
    isDateTomorrowOrLaterColombia,
    nowColombia,
} from '../../common/date.util';

const INCLUDE_RELATIONS = {
    proteinType: { select: { id: true, name: true } },
    menu: { select: { id: true, date: true, dayOfWeek: true } },
    sideDishes: {
        select: {
            id: true,
            sideDishId: true,
            nameSnapshot: true,
        },
    },
} as const;

@Injectable()
export class ReservationsService {
    constructor(private readonly prisma: PrismaService) { }

    /* ───────── helpers ───────── */

    /**
     * Returns the date string (YYYY-MM-DD) for a given menu.
     */
    private menuDateStr(menuDate: Date): string {
        return menuDate.toISOString().slice(0, 10);
    }

    /* ───────── CREATE ───────── */

    async create(dto: CreateReservationDto) {
        const cc = dto.cc.trim();

        // 1. Validate user in whitelist
        const user = await this.prisma.whitelistEntry.findUnique({
            where: { cc },
            select: { id: true, cc: true, name: true, enabled: true },
        });
        if (!user) throw new NotFoundException('CC not found in whitelist');
        if (!user.enabled) throw new ForbiddenException('User is disabled in the whitelist');

        // 2. Validate menu exists
        const menu = await this.prisma.menu.findUnique({
            where: { id: dto.menuId },
            select: {
                id: true,
                date: true,
                defaultProteinTypeId: true,
                proteinOptions: { select: { proteinTypeId: true } },
                sideOptions: {
                    select: {
                        sideDishId: true,
                        sideDish: { select: { id: true, name: true } },
                    },
                },
            },
        });
        if (!menu) throw new NotFoundException('Menu not found');

        const dateStr = this.menuDateStr(menu.date);

        // 3. Determine if reservation is valid (tomorrow or later)
        const canChoose = isDateTomorrowOrLaterColombia(dateStr);

        let proteinTypeId: string;
        if (canChoose) {
            // Validate protein is in menu options
            const validProteins = menu.proteinOptions.map((o) => o.proteinTypeId);
            if (!validProteins.includes(dto.proteinTypeId)) {
                throw new BadRequestException('Selected protein is not available in this menu');
            }
            proteinTypeId = dto.proteinTypeId;
        } else {
            // Same-day or past: auto-assign default protein
            if (!menu.defaultProteinTypeId) {
                throw new BadRequestException('Menu has no default protein and same-day reservations cannot choose');
            }
            proteinTypeId = menu.defaultProteinTypeId;
        }

        // 4. Auto-assign side dishes from menu options
        const sideDishesData = menu.sideOptions
            .filter((o) => o.sideDish != null)
            .map((o) => ({
                sideDishId: o.sideDish!.id,
                nameSnapshot: o.sideDish!.name,
            }));

        // 5. Create reservation
        try {
            return await this.prisma.reservation.create({
                data: {
                    menuId: menu.id,
                    whitelistEntryId: user.id,
                    cc: user.cc,
                    name: user.name,
                    proteinTypeId,
                    status: canChoose ? 'RESERVADA' : 'AUTO_ASIGNADA',
                    sideDishes: sideDishesData.length
                        ? { create: sideDishesData }
                        : undefined,
                    ...colombiaTimestamps(),
                },
                include: INCLUDE_RELATIONS,
            });
        } catch (e: any) {
            if (e?.code === 'P2002') {
                throw new ConflictException('A reservation for this menu and CC already exists');
            }
            throw e;
        }
    }

    /* ───────── UPDATE (change protein) ───────── */

    async update(id: string, dto: UpdateReservationDto) {
        const cc = dto.cc.trim();

        const reservation = await this.prisma.reservation.findUnique({
            where: { id },
            include: { menu: { select: { date: true, proteinOptions: { select: { proteinTypeId: true } }, sideOptions: { select: { sideDishId: true } } } } },
        });
        if (!reservation) throw new NotFoundException('Reservation not found');
        if (reservation.cc !== cc) throw new ForbiddenException('This reservation does not belong to the provided CC');

        const dateStr = this.menuDateStr(reservation.menu.date);
        if (!isDateTomorrowOrLaterColombia(dateStr)) {
            throw new BadRequestException('Cannot modify a reservation for today or a past date. Changes are only allowed for tomorrow onwards.');
        }

        if (reservation.status === 'CANCELADA') {
            throw new BadRequestException('Cannot modify a cancelled reservation');
        }

        // Validate protein is in menu options
        const validProteins = reservation.menu.proteinOptions.map((o) => o.proteinTypeId);
        if (!validProteins.includes(dto.proteinTypeId)) {
            throw new BadRequestException('Selected protein is not available in this menu');
        }

        // Build side dishes update
        return this.prisma.$transaction(async (tx) => {
            // Update protein
            await tx.reservation.update({
                where: { id },
                data: {
                    proteinTypeId: dto.proteinTypeId,
                    ...colombiaUpdatedAt(),
                },
            });

            // Replace side dishes if provided
            if (dto.sideDishIds !== undefined) {
                await tx.reservationSideDish.deleteMany({ where: { reservationId: id } });

                if (dto.sideDishIds.length > 0) {
                    const validSides = reservation.menu.sideOptions.map((o) => o.sideDishId);
                    const sideDishes = await tx.sideDish.findMany({
                        where: { id: { in: dto.sideDishIds } },
                        select: { id: true, name: true },
                    });

                    const createData: { reservationId: string; sideDishId: string; nameSnapshot: string }[] = [];
                    for (const sdId of dto.sideDishIds) {
                        if (!validSides.includes(sdId)) {
                            throw new BadRequestException(`Side dish ${sdId} is not available in this menu`);
                        }
                        const sd = sideDishes.find((s) => s.id === sdId);
                        if (!sd) throw new BadRequestException(`Side dish ${sdId} not found`);
                        createData.push({ reservationId: id, sideDishId: sd.id, nameSnapshot: sd.name });
                    }

                    await tx.reservationSideDish.createMany({ data: createData });
                }
            }

            return tx.reservation.findUnique({
                where: { id },
                include: INCLUDE_RELATIONS,
            });
        });
    }

    /* ───────── CANCEL ───────── */

    async cancel(id: string, cc: string) {
        cc = cc.trim();

        const reservation = await this.prisma.reservation.findUnique({
            where: { id },
            include: { menu: { select: { date: true } } },
        });
        if (!reservation) throw new NotFoundException('Reservation not found');
        if (reservation.cc !== cc) throw new ForbiddenException('This reservation does not belong to the provided CC');

        const dateStr = this.menuDateStr(reservation.menu.date);
        if (!isDateTomorrowOrLaterColombia(dateStr)) {
            throw new BadRequestException('Cannot cancel a reservation for today or a past date. Cancellations are only allowed for tomorrow onwards.');
        }

        if (reservation.status === 'CANCELADA') {
            throw new BadRequestException('Reservation is already cancelled');
        }

        return this.prisma.reservation.update({
            where: { id },
            data: {
                status: 'CANCELADA',
                ...colombiaUpdatedAt(),
            },
            include: INCLUDE_RELATIONS,
        });
    }

    /* ───────── DELETE (admin) ───────── */

    async delete(id: string) {
        const exists = await this.prisma.reservation.findUnique({ where: { id }, select: { id: true } });
        if (!exists) throw new NotFoundException('Reservation not found');

        await this.prisma.reservation.delete({ where: { id } });
        return { deleted: true, id };
    }

    /* ───────── LIST ALL (admin) ───────── */

    async findAll(params: { skip?: number; take?: number; date?: string }) {
        const { skip = 0, take = 50, date } = params;

        if (take > 200) throw new BadRequestException('take max is 200');

        return this.prisma.reservation.findMany({
            where: date
                ? { menu: { date: new Date(date + 'T00:00:00Z') } }
                : undefined,
            orderBy: { createdAt: 'desc' },
            skip,
            take,
            include: INCLUDE_RELATIONS,
        });
    }

    /* ───────── LIST BY CC (user) ───────── */

    async findByCC(cc: string, date?: string) {
        cc = cc.trim();

        const where: any = { cc };
        if (date) {
            where.menu = { date: new Date(date + 'T00:00:00Z') };
        }

        return this.prisma.reservation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: INCLUDE_RELATIONS,
        });
    }

    /* ───────── SUMMARY BY DATE (restaurant) ───────── */

    async findSummaryByDate(dateStr: string) {
        const menu = await this.prisma.menu.findUnique({
            where: { date: new Date(dateStr + 'T00:00:00Z') },
            select: { id: true },
        });

        if (!menu) throw new NotFoundException('No menu found for this date');

        const reservations = await this.prisma.reservation.findMany({
            where: {
                menuId: menu.id,
                status: { not: 'CANCELADA' },
            },
            select: {
                proteinTypeId: true,
                proteinType: { select: { name: true } },
            },
        });

        // Group by protein type
        const map = new Map<string, { proteinTypeId: string; proteinName: string; count: number }>();

        for (const r of reservations) {
            const key = r.proteinTypeId;
            const existing = map.get(key);
            if (existing) {
                existing.count++;
            } else {
                map.set(key, {
                    proteinTypeId: key,
                    proteinName: r.proteinType.name,
                    count: 1,
                });
            }
        }

        return Array.from(map.values()).sort((a, b) => b.count - a.count);
    }

    /* ───────── BULK MARK SERVED (admin) ───────── */

    async bulkMarkServed(dateStr: string) {
        const menu = await this.prisma.menu.findUnique({
            where: { date: new Date(dateStr + 'T00:00:00Z') },
            select: { id: true },
        });

        if (!menu) throw new NotFoundException('No menu found for this date');

        const now = nowColombia();
        const result = await this.prisma.reservation.updateMany({
            where: {
                menuId: menu.id,
                status: { not: 'CANCELADA' },
            },
            data: {
                status: 'SERVIDA',
                servedAt: now,
                updatedAt: now,
            },
        });

        return { date: dateStr, status: 'SERVIDA', updated: result.count };
    }

    /* ───────── BULK MARK CANCELLED (admin) ───────── */

    async bulkMarkCancelled(dateStr: string) {
        const menu = await this.prisma.menu.findUnique({
            where: { date: new Date(dateStr + 'T00:00:00Z') },
            select: { id: true },
        });

        if (!menu) throw new NotFoundException('No menu found for this date');

        const now = nowColombia();
        const result = await this.prisma.reservation.updateMany({
            where: {
                menuId: menu.id,
                status: { notIn: ['CANCELADA', 'SERVIDA'] },
            },
            data: {
                status: 'CANCELADA',
                updatedAt: now,
            },
        });

        return { date: dateStr, status: 'CANCELADA', updated: result.count };
    }
}
