import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWhitelistDto } from './dto/create-whitelist.dto';
import { UpdateWhitelistDto } from './dto/update-whitelist.dto';
import * as XLSX from 'xlsx';
import { colombiaTimestamps, colombiaUpdatedAt } from '../../common/date.util';

const SELECT_FIELDS = {
  id: true,
  cc: true,
  name: true,
  enabled: true,
  publicToken: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class WhitelistService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWhitelistDto) {
    const cc = dto.cc?.trim();
    const name = dto.name?.trim();

    try {
      return await this.prisma.whitelistEntry.create({
        data: { cc: cc, name: name, ...colombiaTimestamps() },
        select: SELECT_FIELDS,
      });
    } catch (e: unknown) {
      const error = e as { code?: string };
      if (error.code === 'P2002')
        throw new ConflictException(
          'A whitelist entry with this cc already exists',
        );
      throw e;
    }
  }

  async findAll(params: {
    q?: string;
    enabled?: boolean;
    skip?: number;
    take?: number;
  }) {
    const { q, enabled, skip = 0, take = 50 } = params;

    if (take > 200) throw new BadRequestException('take max is 200');

    return this.prisma.whitelistEntry.findMany({
      where: {
        ...(typeof enabled === 'boolean' ? { enabled } : {}),
        ...(q?.trim()
          ? {
              OR: [
                { name: { contains: q.trim(), mode: 'insensitive' } },
                { cc: { contains: q.trim(), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      skip,
      take,
      select: SELECT_FIELDS,
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.whitelistEntry.findUnique({
      where: { id },
      select: SELECT_FIELDS,
    });

    if (!item) throw new NotFoundException('Whitelist entry not found');
    return item;
  }

  async update(id: string, dto: UpdateWhitelistDto) {
    const data: Record<string, string> = {};
    if (dto.cc !== undefined) data.cc = dto.cc.trim();
    if (dto.name !== undefined) data.name = dto.name.trim();

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'At least one field (cc or name) must be provided',
      );
    }

    const exists = await this.prisma.whitelistEntry.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Whitelist entry not found');

    try {
      return await this.prisma.whitelistEntry.update({
        where: { id },
        data: { ...data, ...colombiaUpdatedAt() },
        select: SELECT_FIELDS,
      });
    } catch (e: unknown) {
      const error = e as { code?: string };
      if (error.code === 'P2002')
        throw new ConflictException(
          'A whitelist entry with this cc already exists',
        );
      throw e;
    }
  }

  async deactivate(id: string) {
    const entry = await this.prisma.whitelistEntry.findUnique({
      where: { id },
      select: { id: true, enabled: true },
    });
    if (!entry) throw new NotFoundException('Whitelist entry not found');

    return this.prisma.whitelistEntry.update({
      where: { id },
      data: { enabled: !entry.enabled, ...colombiaUpdatedAt() },
      select: SELECT_FIELDS,
    });
  }

  async delete(id: string) {
    const exists = await this.prisma.whitelistEntry.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Whitelist entry not found');

    try {
      await this.prisma.whitelistEntry.delete({ where: { id } });
      return { deleted: true, id };
    } catch (e: unknown) {
      const error = e as { code?: string };
      if (error.code === 'P2003') {
        throw new ConflictException(
          'Cannot delete: whitelist entry is referenced by reservations. Deactivate it instead.',
        );
      }
      throw e;
    }
  }

  async bulkCreate(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
    });

    const errors: { row: number; cc: string; reason: string }[] = [];
    const validEntries: { cc: string; name: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cc = String(row['cc'] ?? row['CC'] ?? row['Cc'] ?? '').trim();
      const name = String(
        row['name'] ??
          row['Name'] ??
          row['NAME'] ??
          row['nombre'] ??
          row['Nombre'] ??
          '',
      ).trim();

      if (!cc || cc.length < 2) {
        errors.push({
          row: i + 2,
          cc: cc || '(empty)',
          reason: 'Missing or invalid cc',
        });
        continue;
      }
      if (!name || name.length < 2) {
        errors.push({ row: i + 2, cc, reason: 'Missing or invalid name' });
        continue;
      }

      validEntries.push({ cc, name });
    }

    if (validEntries.length === 0) {
      return { created: 0, skipped: 0, errors };
    }

    const now = colombiaTimestamps();
    const result = await this.prisma.whitelistEntry.createMany({
      data: validEntries.map((e) => ({ ...e, ...now })),
      skipDuplicates: true,
    });

    const skipped = validEntries.length - result.count;

    return {
      created: result.count,
      skipped,
      errors,
    };
  }
}
