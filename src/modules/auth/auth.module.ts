import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    imports: [PassportModule],
    controllers: [AuthController],
    providers: [JwtStrategy, PrismaService],
    exports: [PassportModule],
})
export class AuthModule { }
