import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;
    private readonly apiUrl = `https://api.telegram.org/bot${this.botToken}`;

    constructor(private readonly prisma: PrismaService) {
        if (!this.botToken) {
            this.logger.error('TELEGRAM_BOT_TOKEN is not set in .env!');
        }
    }

    /**
     * Отправка уведомления о заказе с кнопками подтверждения/отклонения.
     */
    async sendOrderNotification(chatId: string, orderId: number, orderDetails: string): Promise<number | null> {
        const text = `🛒 **НОВЫЙ ЗАКАЗ №${orderId}**\n\n${orderDetails}`;

        const inlineKeyboard = {
            inline_keyboard: [
                [
                    { text: '✅ Подтвердить', callback_data: `APPROVE_${orderId}` },
                    { text: '❌ Отклонить', callback_data: `REJECT_${orderId}` },
                ],
            ],
        };

        try {
            const response = await axios.post(`${this.apiUrl}/sendMessage`, {
                chat_id: chatId,
                text,
                parse_mode: 'Markdown',
                reply_markup: inlineKeyboard,
            });
            this.logger.log(`Order ${orderId} sent. Telegram Message ID: ${response.data.result.message_id}`);
            return response.data.result.message_id;
        } catch (error: any) {
            this.logger.error(`Failed to send order ${orderId} to Telegram: ${error.response?.data?.description || error.message}`);
            return null;
        }
    }

    async editOrderMessage(chatId: string, messageId: number, newText: string, replyMarkup?: any) {
        try {
            await axios.post(`${this.apiUrl}/editMessageText`, {
                chat_id: chatId,
                message_id: messageId,
                text: newText,
                parse_mode: 'Markdown',
                ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
            });
        } catch (error: any) {
            this.logger.error(`Failed to edit message ${messageId}: ${error.response?.data?.description || error.message}`);
        }
    }

    async answerCallbackQuery(callbackQueryId: string, text: string) {
        try {
            await axios.post(`${this.apiUrl}/answerCallbackQuery`, {
                callback_query_id: callbackQueryId,
                text,
            });
        } catch (error: any) {
            this.logger.error(`Failed to answer callback query: ${error.message}`);
        }
    }

    /**
     * Обработка callback_query от инлайн-кнопок.
     * Ставит статус заказа и убирает "часики" у кнопки.
     */
    async processCallbackQuery(callbackQuery: any) {
        const { data, message, from, id: callbackQueryId } = callbackQuery || {};
        if (!data || !message || !callbackQueryId) {
            this.logger.error(`Invalid callback payload: ${JSON.stringify(callbackQuery)}`);
            return;
        }

        const [action, orderIdStr] = String(data).split('_');
        const orderId = parseInt(orderIdStr, 10);
        if (!orderId || !['APPROVE', 'REJECT'].includes(action)) {
            await this.answerCallbackQuery(callbackQueryId, 'Неверный формат данных.');
            return;
        }

        const chatId = message.chat?.id;
        const messageId = message.message_id;
        const userName = from?.username || from?.first_name || 'Anonymous';
        const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        const orderStatusText = status === 'APPROVED' ? 'подтвержден' : 'отклонен';

        try {
            const updatedOrder = await this.prisma.order.update({
                where: { id: orderId },
                data: {
                    status,
                    processedBy: userName,
                },
                include: { facility: true },
            });

            const baseText = (message.text || '').split('\n\n**СТАТУС:')[0];
            const newStatusLine =
                status === 'APPROVED'
                    ? `✅ ПОДТВЕРЖДЕНО менеджером @${userName} в ${new Date().toLocaleTimeString('ru-RU')}`
                    : `❌ ОТКЛОНЕНО менеджером @${userName} в ${new Date().toLocaleTimeString('ru-RU')}`;
            const facilityLine = updatedOrder.facility?.name ? `\nЗаведение: ${updatedOrder.facility.name}` : '';

            const newText = `${baseText}\n\n**СТАТУС:** ${newStatusLine}${facilityLine}\n_Заказ обработан._`;

            await this.editOrderMessage(String(chatId), messageId, newText, { inline_keyboard: [] });
            await this.answerCallbackQuery(callbackQueryId, `Заказ №${orderId} был ${orderStatusText}.`);
        } catch (error: any) {
            this.logger.error(`Error processing callback for Order ${orderId}: ${error.message}`);
            await this.answerCallbackQuery(callbackQueryId, 'Ошибка обработки заказа.');
        }
    }
}
