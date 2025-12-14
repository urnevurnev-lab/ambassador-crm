import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

interface AdminTokenPayload {
    role: 'admin';
    ts: number;
}

@Injectable()
export class AdminAuthService {
    private readonly tokenTtlMs = 1000 * 60 * 60 * 12; // 12 hours

    issueToken(password: string) {
        const secretPassword = process.env.ADMIN_PASSWORD;
        if (!secretPassword) {
            throw new InternalServerErrorException('ADMIN_PASSWORD is not configured');
        }
        if (password !== secretPassword) {
            throw new UnauthorizedException('Неверный пароль');
        }
        return this.signToken({ role: 'admin', ts: Date.now() });
    }

    verifyToken(token: string | undefined): boolean {
        if (!token) return false;
        const secret = this.getSecret();
        const [payloadPart, signature] = token.split('.');
        if (!payloadPart || !signature) return false;

        const payloadBuffer = Buffer.from(payloadPart, 'base64url');
        const expectedSignature = createHmac('sha256', secret).update(payloadBuffer).digest('hex');

        try {
            if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
                return false;
            }
        } catch {
            return false;
        }

        let payload: AdminTokenPayload;
        try {
            payload = JSON.parse(payloadBuffer.toString('utf8'));
        } catch {
            return false;
        }

        if (payload.role !== 'admin' || typeof payload.ts !== 'number') {
            return false;
        }

        const isExpired = Date.now() - payload.ts > this.tokenTtlMs;
        return !isExpired;
    }

    private signToken(payload: AdminTokenPayload) {
        const secret = this.getSecret();
        const payloadBuffer = Buffer.from(JSON.stringify(payload), 'utf8');
        const signature = createHmac('sha256', secret).update(payloadBuffer).digest('hex');
        return `${payloadBuffer.toString('base64url')}.${signature}`;
    }

    private getSecret() {
        return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'default-admin-secret';
    }
}
