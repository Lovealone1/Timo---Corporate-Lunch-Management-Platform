import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    UseGuards,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiTags,
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import {
    AuthTokenRequestDto,
    AuthTokenResponseDto,
    MeResponseDto,
} from './dto/auth-token.dto';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly http: HttpService,
    ) { }


    @Post('token')
    @ApiOperation({
        summary: 'Login con email/password (Supabase password grant)',
    })
    @ApiBody({ type: AuthTokenRequestDto })
    @ApiOkResponse({
        description: 'Bearer token generado por Supabase',
        type: AuthTokenResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Credenciales inválidas o error de Supabase',
    })
    async getToken(@Body() body: AuthTokenRequestDto) {
        const email = body.email?.trim();
        const password = body.password;

        if (!email || !password) {
            throw new BadRequestException('email and password are required');
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const anonKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !anonKey) {
            throw new UnauthorizedException('Supabase env vars missing');
        }

        const url = `${supabaseUrl}/auth/v1/token?grant_type=password`;

        try {
            const { data } = await firstValueFrom(
                this.http.post(
                    url,
                    { email, password },
                    {
                        headers: {
                            apikey: anonKey,
                            'Content-Type': 'application/json',
                        },
                        timeout: 15000,
                    },
                ),
            );

            return {
                access_token: data?.access_token,
                refresh_token: data?.refresh_token,
                expires_in: data?.expires_in,
                token_type: data?.token_type,
                user: data?.user,
            };
        } catch (err: any) {
            const message =
                err?.response?.data?.error_description ||
                err?.response?.data?.error ||
                'Invalid credentials';

            throw new UnauthorizedException(message);
        }
    }


    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Obtiene el perfil del usuario autenticado',
    })
    @ApiOkResponse({
        description: 'Perfil del usuario autenticado',
        type: MeResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Token inválido o expirado',
    })
    async me(@Req() req: any) {
        const sub = req.user?.sub as string;
        if (!sub) throw new UnauthorizedException();

        const profile = await this.prisma.profile.findUnique({
            where: { id: sub },
            select: { id: true, email: true, role: true },
        });

        if (!profile) {
            throw new UnauthorizedException('Profile not found');
        }

        return {
            userId: sub,
            role: profile.role,
            email: profile.email,
        };
    }
}