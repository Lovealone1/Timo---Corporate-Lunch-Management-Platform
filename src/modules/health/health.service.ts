import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

interface PackageJson {
  version?: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async checkDb(): Promise<{
    status: string;
    timestamp: string;
    error?: string;
  }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getVersion() {
    let version = 'unknown';
    try {
      const pkgPath = path.resolve(process.cwd(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as PackageJson;
      version = pkg.version ?? 'unknown';
    } catch {
      this.logger.warn('Could not read package.json version');
    }

    return {
      version,
      commitHash: process.env.COMMIT_HASH ?? 'unknown',
    };
  }
}
