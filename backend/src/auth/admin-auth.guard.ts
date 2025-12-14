import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AdminAuthService } from './admin-auth.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
    constructor(private readonly adminAuthService: AdminAuthService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractToken(request);

        if (!this.adminAuthService.verifyToken(token)) {
            throw new UnauthorizedException('Недостаточно прав для админки');
        }

        return true;
    }

    private extractToken(request: Request): string | undefined {
        const authHeader = request.headers.authorization;
        if (authHeader?.toLowerCase().startsWith('bearer ')) {
            return authHeader.substring(7);
        }
        const rawHeader = request.headers['x-admin-token'];
        if (typeof rawHeader === 'string') return rawHeader;
        if (Array.isArray(rawHeader)) return rawHeader[0];
        return undefined;
    }
}
