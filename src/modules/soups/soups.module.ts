import { Module } from '@nestjs/common';
import { SoupsController } from './soups.controller';
import { SoupsService } from './soups.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    controllers: [SoupsController],
    providers: [SoupsService, PrismaService],
    exports: [SoupsService],
})
export class SoupsModule { }
