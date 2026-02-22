import { Module } from '@nestjs/common';
import { SideDishesController } from './side-dishes.controller';
import { SideDishesService } from './side-dishes.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [SideDishesController],
  providers: [SideDishesService, PrismaService],
  exports: [SideDishesService],
})
export class SideDishesModule {}
