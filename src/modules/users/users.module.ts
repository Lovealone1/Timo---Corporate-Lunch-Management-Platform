import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SupabaseAdminService } from './supabase-admin.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, SupabaseAdminService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
