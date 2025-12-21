import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { parseTelegramUserFromAuthHeader } from './telegram.utils';

@Injectable()
export class TelegramAuthGuard implements CanActivate {
    private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('tma ')) {
            throw new UnauthorizedException('Нет данных авторизации Telegram');
        }

        const initData = authHeader.split(' ')[1];
        console.log('[AuthGuard] initData received');

        if (!this.validateInitData(initData)) {
            console.warn('[AuthGuard] Validation failed for initData');
            throw new UnauthorizedException('Подпись Telegram недействительна');
        }

        const telegramUser = parseTelegramUserFromAuthHeader(authHeader);
        console.log('[AuthGuard] Authenticated user:', telegramUser?.telegramId);
        if (telegramUser) {
            request.user = telegramUser;
            request.telegramUser = telegramUser;
        }

        return true;
    }

    private validateInitData(initData: string): boolean {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');

        if (!hash || !this.botToken) {
            return false;
        }

        const dataCheckString = Array.from(urlParams.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, val]) => `${key}=${val}`)
            .join('\n');

        const secretKey = createHmac('sha256', 'WebAppData').update(this.botToken).digest();
        const calculatedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        return calculatedHash === hash;
    }
}
