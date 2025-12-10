import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private bot: TelegramBot;

    constructor() {
        // Убедись, что TELEGRAM_BOT_TOKEN есть в .env
        this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN as string, { polling: true });
        
        // Временный логгер нажатий (чтобы видеть, что кнопки работают)
        this.bot.on('callback_query', (query) => {
            console.log('Нажата кнопка:', query.data);
            // Тут позже добавим логику смены статуса заказа
            this.bot.answerCallbackQuery(query.id, { text: 'Обрабатываем...' });
        });
    }

    async sendOrderNotification(chatId: string, orderId: number, details: string) {
        try {
            await this.bot.sendMessage(chatId, `🆕 <b>НОВЫЙ ЗАКАЗ #${orderId}</b>\n\n${details}`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '✅ Принять', callback_data: `approve_${orderId}` },
                            { text: '❌ Отклонить', callback_data: `reject_${orderId}` }
                        ]
                    ]
                }
            });
            this.logger.log(`Notification sent to ${chatId}`);
        } catch (e: any) {
            this.logger.error(`Failed to send telegram message: ${e.message}`);
        }
    }

    // Заглушка, чтобы совместить с текущим webhook-контроллером (если понадобится)
    async processCallbackQuery(_query: any) {
        // В этой реализации бот обрабатывает callback'и через polling в конструкторе.
        return;
    }
}
