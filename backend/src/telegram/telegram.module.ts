import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { PrismaService } from '../prisma.service';
import { TelegramAuthGuard } from './telegram.guard';

@Module({
    imports: [],
    controllers: [TelegramController],
    providers: [TelegramService, PrismaService, TelegramAuthGuard],
    exports: [TelegramService, TelegramAuthGuard],
})
export class TelegramModule {}
