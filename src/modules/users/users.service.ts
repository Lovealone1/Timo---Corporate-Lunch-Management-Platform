import {
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseAdminService } from './supabase-admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { nowColombia } from '../../common/date.util';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly supabaseAdmin: SupabaseAdminService,
    ) { }

    /* ───────── LIST (paginated) ───────── */
    async findAll(
        page = 1,
        limit = 20,
        q?: string,
    ): Promise<{ data: UserResponseDto[]; total: number; page: number; limit: number }> {
        const take = Math.min(limit, 100);
        const skip = (page - 1) * take;

        const where = q
            ? {
                email: { contains: q, mode: 'insensitive' as const },
            }
            : {};

        const [data, total] = await Promise.all([
            this.prisma.profile.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
            this.prisma.profile.count({ where }),
        ]);

        return { data, total, page, limit: take };
    }

    /* ───────── GET ONE ───────── */
    async findOne(id: string): Promise<UserResponseDto> {
        const profile = await this.prisma.profile.findUnique({ where: { id } });
        if (!profile) throw new NotFoundException(`Profile ${id} not found`);
        return profile;
    }

    /* ───────── UPDATE ROLE ───────── */
    async updateRole(id: string, role: string): Promise<UserResponseDto> {
        await this.ensureExists(id);
        const now = nowColombia();
        return this.prisma.profile.update({
            where: { id },
            data: { role: role as any, updatedAt: now },
        });
    }

    /* ───────── TOGGLE ENABLED ───────── */
    async toggleEnabled(id: string, enabled: boolean): Promise<UserResponseDto> {
        await this.ensureExists(id);
        const now = nowColombia();
        return this.prisma.profile.update({
            where: { id },
            data: { enabled, updatedAt: now },
        });
    }

    /* ───────── CREATE (Supabase + Prisma) ───────── */
    async create(dto: CreateUserDto): Promise<UserResponseDto> {
        // 1. Check duplicate email in profiles
        const existing = await this.prisma.profile.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new ConflictException(`Email ${dto.email} already exists`);
        }

        // 2. Create user in Supabase Auth
        let supabaseUser: { id: string; email: string };
        try {
            supabaseUser = await this.supabaseAdmin.createAuthUser(
                dto.email,
                dto.password,
            );
        } catch (error: any) {
            this.logger.error('Supabase user creation failed', error?.message);
            if (error?.message?.includes('already been registered')) {
                throw new ConflictException(`Email ${dto.email} already registered in Auth`);
            }
            throw error;
        }

        // 3. Upsert profile in DB
        //    Supabase may have a trigger that auto-creates a profiles row,
        //    so we use upsert: if it already exists, update it; otherwise create it.
        const now = nowColombia();
        try {
            return await this.prisma.profile.upsert({
                where: { id: supabaseUser.id },
                create: {
                    id: supabaseUser.id,
                    email: supabaseUser.email,
                    role: (dto.role as any) ?? 'USER',
                    enabled: dto.enabled ?? true,
                    createdAt: now,
                    updatedAt: now,
                },
                update: {
                    email: supabaseUser.email,
                    role: (dto.role as any) ?? 'USER',
                    enabled: dto.enabled ?? true,
                    updatedAt: now,
                },
            });
        } catch (error: any) {
            // Handle unique constraint violations gracefully
            if (error?.code === 'P2002') {
                throw new ConflictException(
                    `Profile already exists (duplicate on: ${error.meta?.target})`,
                );
            }
            // Rollback: delete the Supabase auth user
            this.logger.warn(`Rolling back Supabase user ${supabaseUser.id}`);
            await this.supabaseAdmin.deleteAuthUser(supabaseUser.id);
            throw error;
        }
    }

    /* ───────── HELPERS ───────── */
    private async ensureExists(id: string): Promise<void> {
        const count = await this.prisma.profile.count({ where: { id } });
        if (count === 0) throw new NotFoundException(`Profile ${id} not found`);
    }
}
