import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles =
            this.reflector.getAllAndOverride<Array<'ADMIN' | 'USER'>>(ROLES_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);

        if (!requiredRoles || requiredRoles.length === 0) return true;

        const req = context.switchToHttp().getRequest();
        const user = req.user as { sub?: string };

        if (!user?.sub) throw new ForbiddenException('Missing user subject');

        const profile = await this.prisma.profile.findUnique({
            where: { id: user.sub },
            select: { role: true },
        });

        if (!profile) throw new ForbiddenException('Profile not found');

        if (!requiredRoles.includes(profile.role as any)) {
            throw new ForbiddenException('Insufficient permission');
        }

        return true;
    }
}
