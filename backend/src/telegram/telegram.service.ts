import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private bot: TelegramBot;

    constructor(private readonly prisma: PrismaService) {
        // Убедись, что TELEGRAM_BOT_TOKEN есть в .env
        this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN as string, { polling: true });
        
        // Логика обработки инлайн-кнопок
        this.bot.on('callback_query', async (query) => {
            const data = query?.data || '';
            const approveMatch = data.match(/^approve_(\d+)$/i);
            const rejectMatch = data.match(/^reject_(\d+)$/i);
            const orderId = approveMatch ? Number(approveMatch[1]) : rejectMatch ? Number(rejectMatch[1]) : null;
            const action = approveMatch ? 'APPROVED' : rejectMatch ? 'REJECTED' : null;

            if (!orderId || !action) {
                this.bot.answerCallbackQuery(query.id, { text: 'Некорректные данные кнопки' });
                return;
            }

            try {
                const order = await this.prisma.order.update({
                    where: { id: orderId },
                    data: { status: action },
                    include: { user: true },
                });

                // Отредактировать сообщение в чате дистрибьютора
                const statusText = action === 'APPROVED' ? 'Заказ принят ✅' : 'Заказ отклонен ❌';
                if (query.message?.chat?.id && query.message.message_id) {
                    await this.bot.editMessageText(
                        `${statusText}\n\n${query.message.text || ''}`,
                        {
                            chat_id: query.message.chat.id,
                            message_id: query.message.message_id,
                            reply_markup: { inline_keyboard: [] },
                        },
                    );
                }

                await this.bot.answerCallbackQuery(query.id, { text: statusText });

                // Уведомление амбассадору
                if (order.user?.telegramId) {
                    await this.bot.sendMessage(order.user.telegramId, `Ваш заказ №${orderId} ${action === 'APPROVED' ? 'принят' : 'отклонен'}!`);
                }
            } catch (e: any) {
                this.logger.error(`Failed to process callback for order ${orderId}: ${e.message}`);
                this.bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки заказа' });
            }
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

    // Заглушка для совместимости с webhook-контроллером
    async processCallbackQuery(_query: any) {
        // В этой реализации бот обрабатывает callback'и через polling в конструкторе.
        return;
    }
}
