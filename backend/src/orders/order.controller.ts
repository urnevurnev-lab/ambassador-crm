import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { TelegramAuthGuard } from '../telegram/telegram.guard';
import { parseTelegramUserFromAuthHeader } from '../telegram/telegram.utils';
import { Request } from 'express';

interface CreateOrderDto {
    facilityId: number;
    distributorId: number;
    items: { sku: string; quantity: number }[];
    contactName?: string;
    contactPhone?: string;
}

@Controller('orders')
@UseGuards(TelegramAuthGuard)
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    // История заказов текущего Telegram-пользователя
    @Get('my-history')
    async getMyHistory(@Req() req: Request) {
        const telegramUser = parseTelegramUserFromAuthHeader(req.headers.authorization as string | undefined);
        if (!telegramUser) {
            return [];
        }
        return this.orderService.getMyOrders(telegramUser.telegramId);
    }

    // Получение статистики заказов для текущего Telegram-пользователя
    @Get('my-stats')
    async getStats(@Req() req: Request) {
        const telegramUser = parseTelegramUserFromAuthHeader(req.headers.authorization as string | undefined);
        if (!telegramUser) {
            return { shippedSum: 0, pendingCount: 0, rejectedSum: 0 };
        }
        return this.orderService.getUserStats(telegramUser.telegramId);
    }

    // Общий список заказов (админ, при наличии guard)
    @Get()
    async getAll() {
        return this.orderService.getAll();
    }

    @Post()
    create(@Body() createOrderDto: CreateOrderDto, @Req() req: Request) {
        const telegramUser = parseTelegramUserFromAuthHeader(req.headers.authorization as string | undefined);
        return this.orderService.create(createOrderDto, telegramUser || undefined);
    }
}
