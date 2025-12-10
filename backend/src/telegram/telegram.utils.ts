export interface TelegramAuthUser {
    telegramId: string;
    fullName: string;
    username?: string;
}

export function parseTelegramUserFromAuthHeader(authHeader?: string): TelegramAuthUser | null {
    if (!authHeader || !authHeader.startsWith('tma ')) return null;

    const initData = authHeader.split(' ')[1];
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');

    if (!userStr) return null;

    try {
        const user = JSON.parse(userStr);
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
            || user.username
            || String(user.id);

        return {
            telegramId: String(user.id),
            fullName,
            username: user.username,
        };
    } catch (err) {
        return null;
    }
}
