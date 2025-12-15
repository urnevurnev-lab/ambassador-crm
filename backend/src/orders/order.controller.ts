import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
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

    @Post()
    create(@Body() createOrderDto: CreateOrderDto, @Req() req: Request) {
        const telegramUser = parseTelegramUserFromAuthHeader(req.headers.authorization as string | undefined);
        return this.orderService.create(createOrderDto, telegramUser || undefined);
    }
}
