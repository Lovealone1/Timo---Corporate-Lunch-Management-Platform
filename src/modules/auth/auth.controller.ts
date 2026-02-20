import {
    Controller,
    Get,
    Req,
    UseGuards,
    UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async me(@Req() req: any) {
        const sub = req.user?.sub as string;
        if (!sub) throw new UnauthorizedException();

        const profile = await this.prisma.profile.findUnique({
            where: { id: sub },
            select: { id: true, email: true, role: true },
        });

        if (!profile) throw new UnauthorizedException('Profile not found');

        return { userId: sub, role: profile.role, email: profile.email };
    }
}
