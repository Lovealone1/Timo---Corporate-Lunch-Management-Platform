import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';

import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), HttpModule],
  controllers: [AuthController],
  providers: [JwtStrategy, PrismaService],
  exports: [PassportModule],
})
export class AuthModule {}
