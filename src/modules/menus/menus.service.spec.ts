import { Test, TestingModule } from '@nestjs/testing';
import { MenusService } from './menus.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as dateUtil from '../../common/date.util';

/* ───────── Mock date utilities ───────── */
jest.mock('../../common/date.util', () => ({
    isDateInPastColombia: jest.fn().mockReturnValue(false),
    colombiaTimestamps: jest.fn().mockReturnValue({
        createdAt: new Date('2026-01-01T05:00:00Z'),
        updatedAt: new Date('2026-01-01T05:00:00Z'),
    }),
    colombiaUpdatedAt: jest.fn().mockReturnValue({
        updatedAt: new Date('2026-01-01T05:00:00Z'),
    }),
}));

/* ───────── Prisma mock ───────── */
const mockTx = {
    menu: { update: jest.fn(), findUnique: jest.fn() },
    menuProteinOption: { deleteMany: jest.fn(), createMany: jest.fn() },
    menuSideOption: { deleteMany: jest.fn(), createMany: jest.fn() },
};

const mockPrisma = () => ({
    menu: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
    },
    $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<any>) => cb(mockTx)),
});

type MockPrisma = ReturnType<typeof mockPrisma>;

/* ───────── Helpers ───────── */
const fakeMenu = (overrides: Partial<Record<string, any>> = {}) => ({
    id: 'menu-1',
    date: new Date('2026-03-10T00:00:00Z'),
    dayOfWeek: 'MAR',
    soupId: 'soup-1',
    drinkId: 'drink-1',
    defaultProteinTypeId: 'prot-1',
    soup: { id: 'soup-1', name: 'Ajiaco' },
    drink: { id: 'drink-1', name: 'Limonada' },
    defaultProteinType: { id: 'prot-1', name: 'Pollo' },
    proteinOptions: [],
    sideOptions: [],
    createdAt: new Date('2026-01-01T05:00:00Z'),
    updatedAt: new Date('2026-01-01T05:00:00Z'),
    ...overrides,
});

describe('MenusService', () => {
    let service: MenusService;
    let prisma: MockPrisma;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MenusService,
                { provide: PrismaService, useFactory: mockPrisma },
            ],
        }).compile();

        service = module.get<MenusService>(MenusService);
        prisma = module.get(PrismaService) as unknown as MockPrisma;
        jest.clearAllMocks();
        (dateUtil.isDateInPastColombia as jest.Mock).mockReturnValue(false);
    });

    /* ═══════════════════════════════════════════════
     *  CREATE
     * ═══════════════════════════════════════════════ */
    describe('create', () => {
        const dto = { date: '2026-03-10', soupId: 'soup-1', drinkId: 'drink-1' };

        it('should create a menu with derived dayOfWeek', async () => {
            const menu = fakeMenu();
            prisma.menu.create.mockResolvedValue(menu);

            const result = await service.create(dto);

            expect(result).toEqual(menu);
            expect(prisma.menu.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        dayOfWeek: 'MAR', // 2026-03-10 is a Tuesday
                        soupId: 'soup-1',
                        drinkId: 'drink-1',
                    }),
                }),
            );
        });

        it('should use default protein type when not provided', async () => {
            prisma.menu.create.mockResolvedValue(fakeMenu());

            await service.create({ date: '2026-03-10' });

            expect(prisma.menu.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        defaultProteinTypeId: '99dc22df-fdb4-4000-8e5e-30caab647b1d',
                    }),
                }),
            );
        });

        it('should create protein and side options when provided', async () => {
            prisma.menu.create.mockResolvedValue(fakeMenu());

            await service.create({
                date: '2026-03-10',
                proteinOptionIds: ['prot-a', 'prot-b'],
                sideOptionIds: ['sd-a'],
            });

            const call = prisma.menu.create.mock.calls[0][0];
            expect(call.data.proteinOptions).toEqual({
                create: [
                    { proteinTypeId: 'prot-a' },
                    { proteinTypeId: 'prot-b' },
                ],
            });
            expect(call.data.sideOptions).toEqual({
                create: [{ sideDishId: 'sd-a' }],
            });
        });

        it('should throw BadRequestException for past dates', async () => {
            (dateUtil.isDateInPastColombia as jest.Mock).mockReturnValue(true);

            await expect(service.create(dto)).rejects.toThrow(BadRequestException);
            expect(prisma.menu.create).not.toHaveBeenCalled();
        });

        it('should throw ConflictException on duplicate date (P2002)', async () => {
            prisma.menu.create.mockRejectedValue({ code: 'P2002' });

            await expect(service.create(dto)).rejects.toThrow(ConflictException);
        });

        it('should throw BadRequestException on invalid references (P2003)', async () => {
            prisma.menu.create.mockRejectedValue({ code: 'P2003' });

            await expect(service.create(dto)).rejects.toThrow(BadRequestException);
        });

        it('should rethrow unknown errors', async () => {
            prisma.menu.create.mockRejectedValue(new Error('DB crash'));

            await expect(service.create(dto)).rejects.toThrow('DB crash');
        });
    });

    /* ═══════════════════════════════════════════════
     *  FIND ALL
     * ═══════════════════════════════════════════════ */
    describe('findAll', () => {
        it('should return menus with default pagination', async () => {
            const menus = [fakeMenu()];
            prisma.menu.findMany.mockResolvedValue(menus);

            const result = await service.findAll({});

            expect(result).toEqual(menus);
            expect(prisma.menu.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ skip: 0, take: 50 }),
            );
        });

        it('should throw BadRequestException when take > 200', async () => {
            await expect(service.findAll({ take: 201 })).rejects.toThrow(BadRequestException);
        });
    });

    /* ═══════════════════════════════════════════════
     *  FIND ONE
     * ═══════════════════════════════════════════════ */
    describe('findOne', () => {
        it('should return a menu by id', async () => {
            const menu = fakeMenu();
            prisma.menu.findUnique.mockResolvedValue(menu);

            expect(await service.findOne('menu-1')).toEqual(menu);
        });

        it('should throw NotFoundException when not found', async () => {
            prisma.menu.findUnique.mockResolvedValue(null);

            await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
        });
    });

    /* ═══════════════════════════════════════════════
     *  FIND BY DATE
     * ═══════════════════════════════════════════════ */
    describe('findByDate', () => {
        it('should return a menu by date string', async () => {
            const menu = fakeMenu();
            prisma.menu.findUnique.mockResolvedValue(menu);

            const result = await service.findByDate('2026-03-10');

            expect(result).toEqual(menu);
            expect(prisma.menu.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { date: new Date('2026-03-10T00:00:00Z') },
                }),
            );
        });

        it('should throw NotFoundException when no menu for date', async () => {
            prisma.menu.findUnique.mockResolvedValue(null);

            await expect(service.findByDate('2026-12-25')).rejects.toThrow(NotFoundException);
        });
    });

    /* ═══════════════════════════════════════════════
     *  CLONE
     * ═══════════════════════════════════════════════ */
    describe('clone', () => {
        const sourceMenu = {
            id: 'menu-1',
            soupId: 'soup-1',
            drinkId: 'drink-1',
            defaultProteinTypeId: 'prot-1',
            proteinOptions: [{ proteinTypeId: 'prot-a' }],
            sideOptions: [{ sideDishId: 'sd-a' }],
        };

        it('should clone a menu to a new date', async () => {
            prisma.menu.findUnique.mockResolvedValue(sourceMenu);
            const cloned = fakeMenu({ id: 'menu-2', date: new Date('2026-03-11T00:00:00Z') });
            prisma.menu.create.mockResolvedValue(cloned);

            const result = await service.clone('menu-1', '2026-03-11');

            expect(result).toEqual(cloned);
            expect(prisma.menu.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        soupId: 'soup-1',
                        drinkId: 'drink-1',
                        defaultProteinTypeId: 'prot-1',
                        proteinOptions: { create: [{ proteinTypeId: 'prot-a' }] },
                        sideOptions: { create: [{ sideDishId: 'sd-a' }] },
                    }),
                }),
            );
        });

        it('should throw NotFoundException when source does not exist', async () => {
            prisma.menu.findUnique.mockResolvedValue(null);

            await expect(service.clone('nope', '2026-03-11')).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException for past target date', async () => {
            prisma.menu.findUnique.mockResolvedValue(sourceMenu);
            (dateUtil.isDateInPastColombia as jest.Mock).mockReturnValue(true);

            await expect(service.clone('menu-1', '2020-01-01')).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw ConflictException on duplicate target date (P2002)', async () => {
            prisma.menu.findUnique.mockResolvedValue(sourceMenu);
            prisma.menu.create.mockRejectedValue({ code: 'P2002' });

            await expect(service.clone('menu-1', '2026-03-11')).rejects.toThrow(
                ConflictException,
            );
        });
    });

    /* ═══════════════════════════════════════════════
     *  UPDATE (transactional)
     * ═══════════════════════════════════════════════ */
    describe('update', () => {
        it('should update scalar fields within a transaction', async () => {
            prisma.menu.findUnique.mockResolvedValue({ id: 'menu-1' });
            const updated = fakeMenu({ soupId: 'soup-2' });
            mockTx.menu.findUnique.mockResolvedValue(updated);

            const result = await service.update('menu-1', { soupId: 'soup-2' });

            expect(result).toEqual(updated);
            expect(mockTx.menu.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'menu-1' },
                    data: expect.objectContaining({ soupId: 'soup-2' }),
                }),
            );
        });

        it('should replace protein options in a transaction', async () => {
            prisma.menu.findUnique.mockResolvedValue({ id: 'menu-1' });
            mockTx.menu.findUnique.mockResolvedValue(fakeMenu());

            await service.update('menu-1', { proteinOptionIds: ['prot-x', 'prot-y'] });

            expect(mockTx.menuProteinOption.deleteMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { menuId: 'menu-1' } }),
            );
            expect(mockTx.menuProteinOption.createMany).toHaveBeenCalledWith({
                data: [
                    { menuId: 'menu-1', proteinTypeId: 'prot-x' },
                    { menuId: 'menu-1', proteinTypeId: 'prot-y' },
                ],
            });
        });

        it('should replace side options in a transaction', async () => {
            prisma.menu.findUnique.mockResolvedValue({ id: 'menu-1' });
            mockTx.menu.findUnique.mockResolvedValue(fakeMenu());

            await service.update('menu-1', { sideOptionIds: ['sd-x'] });

            expect(mockTx.menuSideOption.deleteMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { menuId: 'menu-1' } }),
            );
            expect(mockTx.menuSideOption.createMany).toHaveBeenCalledWith({
                data: [{ menuId: 'menu-1', sideDishId: 'sd-x' }],
            });
        });

        it('should clear options when empty array provided', async () => {
            prisma.menu.findUnique.mockResolvedValue({ id: 'menu-1' });
            mockTx.menu.findUnique.mockResolvedValue(fakeMenu());

            await service.update('menu-1', { proteinOptionIds: [] });

            expect(mockTx.menuProteinOption.deleteMany).toHaveBeenCalled();
            expect(mockTx.menuProteinOption.createMany).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when not found', async () => {
            prisma.menu.findUnique.mockResolvedValue(null);

            await expect(service.update('nope', { soupId: 'x' })).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ConflictException on P2002', async () => {
            prisma.menu.findUnique.mockResolvedValue({ id: 'menu-1' });
            prisma.$transaction.mockRejectedValue({ code: 'P2002' });

            await expect(
                service.update('menu-1', { proteinOptionIds: ['dup'] }),
            ).rejects.toThrow(ConflictException);
        });

        it('should throw BadRequestException on P2003', async () => {
            prisma.menu.findUnique.mockResolvedValue({ id: 'menu-1' });
            prisma.$transaction.mockRejectedValue({ code: 'P2003' });

            await expect(
                service.update('menu-1', { soupId: 'invalid' }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    /* ═══════════════════════════════════════════════
     *  DELETE
     * ═══════════════════════════════════════════════ */
    describe('delete', () => {
        it('should delete and return { deleted: true, id }', async () => {
            prisma.menu.findUnique.mockResolvedValue({ id: 'menu-1' });
            prisma.menu.delete.mockResolvedValue(undefined);

            expect(await service.delete('menu-1')).toEqual({ deleted: true, id: 'menu-1' });
        });

        it('should throw NotFoundException when not found', async () => {
            prisma.menu.findUnique.mockResolvedValue(null);

            await expect(service.delete('nope')).rejects.toThrow(NotFoundException);
        });
    });
});
