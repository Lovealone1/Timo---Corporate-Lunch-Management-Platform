import { Module } from '@nestjs/common';
import { DrinksController } from './drinks.controller';
import { DrinksService } from './drinks.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    controllers: [DrinksController],
    providers: [DrinksService, PrismaService],
    exports: [DrinksService],
})
export class DrinksModule { }
