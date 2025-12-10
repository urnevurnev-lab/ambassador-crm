import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { TelegramAuthGuard } from '../telegram/telegram.guard';

interface CreateOrderDto {
    facilityId: number;
    distributorId: number;
    items: { sku: string; quantity: number }[];
}

@Controller('orders')
@UseGuards(TelegramAuthGuard)
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Post()
    create(@Body() createOrderDto: CreateOrderDto) {
        return this.orderService.create(createOrderDto);
    }
}
