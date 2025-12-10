import { Body, Controller, Logger, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
    private readonly logger = new Logger(TelegramController.name);

    constructor(private readonly telegramService: TelegramService) {}

    @Post('webhook')
    async handleWebhook(@Body() update: any) {
        console.log('Webhook received:', JSON.stringify(update, null, 2));

        if (update?.callback_query) {
            this.telegramService.processCallbackQuery(update.callback_query).catch((err) => {
                this.logger.error(`Callback handling failed: ${err.message}`);
            });
        }

        // Respond immediately so Telegram stops waiting (button spinner stops once answerCallbackQuery is called)
        return { ok: true };
    }
}
