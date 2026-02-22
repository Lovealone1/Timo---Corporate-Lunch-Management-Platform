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
import { AxiosError } from 'axios';

import {
  AuthTokenRequestDto,
  AuthTokenResponseDto,
  MeResponseDto,
} from './dto/auth-token.dto';

interface SupabaseTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user?: { id: string; email?: string };
}

interface SupabaseErrorBody {
  error_description?: string;
  error?: string;
}

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
  ) {}

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
        this.http.post<SupabaseTokenResponse>(
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
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        user: data.user,
      };
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<SupabaseErrorBody>;
      const message =
        axiosErr.response?.data?.error_description ??
        axiosErr.response?.data?.error ??
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
  async me(@Req() req: { user?: { sub?: string } }) {
    const sub = req.user?.sub;
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
