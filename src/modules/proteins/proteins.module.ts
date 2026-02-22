import { Module } from '@nestjs/common';
import { ProteinsController } from './proteins.controller';
import { ProteinsService } from './proteins.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [ProteinsController],
  providers: [ProteinsService, PrismaService],
  exports: [ProteinsService],
})
export class ProteinsModule {}
