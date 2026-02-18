import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,

            // 🔥 Clave pública dinámica desde Supabase
            secretOrKeyProvider: jwksRsa.passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 10,
                jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
            }),

            audience: 'authenticated',
            issuer: `${supabaseUrl}/auth/v1`,
            algorithms: ['ES256'],
        });
    }

    async validate(payload: any) {
        return {
            sub: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    }
}
