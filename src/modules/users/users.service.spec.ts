import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseAdminService } from './supabase-admin.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

/* ───────── Mock factories ───────── */
const mockPrisma = () => ({
  profile: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
});

const mockSupabaseAdmin = () => ({
  createAuthUser: jest.fn(),
  deleteAuthUser: jest.fn(),
});

type MockPrisma = ReturnType<typeof mockPrisma>;
type MockSupabase = ReturnType<typeof mockSupabaseAdmin>;

/* ───────── Helpers ───────── */
const fakeProfile = (overrides: Record<string, unknown> = {}) => ({
  id: 'sup-uuid-1',
  email: 'user@example.com',
  role: 'USER',
  enabled: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

describe('UsersService', () => {
  let service: UsersService;
  let prisma: MockPrisma;
  let supabase: MockSupabase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useFactory: mockPrisma },
        { provide: SupabaseAdminService, useFactory: mockSupabaseAdmin },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
    supabase = module.get(SupabaseAdminService);
  });

  afterEach(() => jest.clearAllMocks());

  /* ═══════════════════════════════════════════════
   *  FIND ALL (paginated)
   * ═══════════════════════════════════════════════ */
  describe('findAll', () => {
    it('should return paginated profiles with defaults', async () => {
      const profiles = [fakeProfile(), fakeProfile({ id: 'sup-uuid-2' })];
      prisma.profile.findMany.mockResolvedValue(profiles);
      prisma.profile.count.mockResolvedValue(2);

      const result = await service.findAll();

      expect(result).toEqual({ data: profiles, total: 2, page: 1, limit: 20 });
      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('should clamp limit to 100 max', async () => {
      prisma.profile.findMany.mockResolvedValue([]);
      prisma.profile.count.mockResolvedValue(0);

      const result = await service.findAll(1, 500);

      expect(result.limit).toBe(100);
      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('should pass search query to where clause', async () => {
      prisma.profile.findMany.mockResolvedValue([]);
      prisma.profile.count.mockResolvedValue(0);

      await service.findAll(1, 20, 'admin');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const call = prisma.profile.findMany.mock.calls[0][0] as {
        where: Record<string, unknown>;
      };
      expect(call.where).toEqual({
        email: { contains: 'admin', mode: 'insensitive' },
      });
    });

    it('should calculate correct skip for page 3', async () => {
      prisma.profile.findMany.mockResolvedValue([]);
      prisma.profile.count.mockResolvedValue(0);

      await service.findAll(3, 10);

      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  /* ═══════════════════════════════════════════════
   *  FIND ONE
   * ═══════════════════════════════════════════════ */
  describe('findOne', () => {
    it('should return a profile by id', async () => {
      const profile = fakeProfile();
      prisma.profile.findUnique.mockResolvedValue(profile);

      const result = await service.findOne('sup-uuid-1');

      expect(result).toEqual(profile);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /* ═══════════════════════════════════════════════
   *  UPDATE ROLE
   * ═══════════════════════════════════════════════ */
  describe('updateRole', () => {
    it('should update role and return profile', async () => {
      prisma.profile.count.mockResolvedValue(1); // ensureExists
      const updated = fakeProfile({ role: 'ADMIN' });
      prisma.profile.update.mockResolvedValue(updated);

      const result = await service.updateRole('sup-uuid-1', 'ADMIN');

      expect(result).toEqual(updated);
      expect(prisma.profile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sup-uuid-1' },
          data: expect.objectContaining({ role: 'ADMIN' }) as Record<
            string,
            unknown
          >,
        }),
      );
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      prisma.profile.count.mockResolvedValue(0);

      await expect(service.updateRole('nonexistent', 'ADMIN')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /* ═══════════════════════════════════════════════
   *  TOGGLE ENABLED
   * ═══════════════════════════════════════════════ */
  describe('toggleEnabled', () => {
    it('should toggle enabled to false', async () => {
      prisma.profile.count.mockResolvedValue(1);
      const updated = fakeProfile({ enabled: false });
      prisma.profile.update.mockResolvedValue(updated);

      const result = await service.toggleEnabled('sup-uuid-1', false);

      expect(result).toEqual(updated);
      expect(prisma.profile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ enabled: false }) as Record<
            string,
            unknown
          >,
        }),
      );
    });

    it('should toggle enabled to true', async () => {
      prisma.profile.count.mockResolvedValue(1);
      const updated = fakeProfile({ enabled: true });
      prisma.profile.update.mockResolvedValue(updated);

      const result = await service.toggleEnabled('sup-uuid-1', true);

      expect(result.enabled).toBe(true);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.profile.count.mockResolvedValue(0);

      await expect(service.toggleEnabled('nonexistent', false)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /* ═══════════════════════════════════════════════
   *  CREATE (Supabase + Prisma)
   * ═══════════════════════════════════════════════ */
  describe('create', () => {
    const dto = { email: 'new@example.com', password: 'Str0ngP@ss' };
    const supabaseUser = { id: 'sup-new-id', email: 'new@example.com' };

    it('should create user in Supabase and upsert profile', async () => {
      prisma.profile.findUnique.mockResolvedValue(null); // no existing email
      supabase.createAuthUser.mockResolvedValue(supabaseUser);
      const profile = fakeProfile({
        id: 'sup-new-id',
        email: 'new@example.com',
      });
      prisma.profile.upsert.mockResolvedValue(profile);

      const result = await service.create(dto);

      expect(result).toEqual(profile);
      expect(supabase.createAuthUser).toHaveBeenCalledWith(
        'new@example.com',
        'Str0ngP@ss',
      );
      expect(prisma.profile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sup-new-id' },
          create: expect.objectContaining({
            id: 'sup-new-id',
            email: 'new@example.com',
            role: 'USER',
            enabled: true,
          }) as Record<string, unknown>,
          update: expect.objectContaining({
            email: 'new@example.com',
          }) as Record<string, unknown>,
        }),
      );
    });

    it('should use provided role and enabled values', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);
      supabase.createAuthUser.mockResolvedValue(supabaseUser);
      prisma.profile.upsert.mockResolvedValue(
        fakeProfile({ role: 'ADMIN', enabled: false }),
      );

      await service.create({ ...dto, role: 'ADMIN' as Role, enabled: false });

      expect(prisma.profile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            role: 'ADMIN',
            enabled: false,
          }) as Record<string, unknown>,
          update: expect.objectContaining({
            role: 'ADMIN',
            enabled: false,
          }) as Record<string, unknown>,
        }),
      );
    });

    it('should throw ConflictException when email already exists in profiles', async () => {
      prisma.profile.findUnique.mockResolvedValue(fakeProfile());

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(supabase.createAuthUser).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when email already registered in Supabase Auth', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);
      supabase.createAuthUser.mockRejectedValue(
        new Error('User already been registered'),
      );

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should rethrow unknown Supabase errors', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);
      const error = new Error('Supabase network timeout');
      supabase.createAuthUser.mockRejectedValue(error);

      await expect(service.create(dto)).rejects.toThrow(
        'Supabase network timeout',
      );
    });

    it('should throw ConflictException on P2002 during upsert', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);
      supabase.createAuthUser.mockResolvedValue(supabaseUser);
      prisma.profile.upsert.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['email'] },
      });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should rollback Supabase user on non-P2002 DB error', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);
      supabase.createAuthUser.mockResolvedValue(supabaseUser);
      const dbError = new Error('DB connection lost');
      prisma.profile.upsert.mockRejectedValue(dbError);
      supabase.deleteAuthUser.mockResolvedValue(undefined);

      await expect(service.create(dto)).rejects.toThrow('DB connection lost');
      expect(supabase.deleteAuthUser).toHaveBeenCalledWith('sup-new-id');
    });

    it('should NOT rollback on P2002 (conflict is expected)', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);
      supabase.createAuthUser.mockResolvedValue(supabaseUser);
      prisma.profile.upsert.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['email'] },
      });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(supabase.deleteAuthUser).not.toHaveBeenCalled();
    });
  });
});
