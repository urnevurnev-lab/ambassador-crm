import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TelegramService } from '../telegram/telegram.service';

interface CreateOrderDto {
    facilityId: number;
    distributorId: number;
    items: { sku: string; quantity: number }[];
}

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly telegramService: TelegramService,
    ) {}

    async create(createOrderDto: CreateOrderDto) {
        const { facilityId, distributorId, items } = createOrderDto;

        if (!items || items.length === 0) {
            throw new BadRequestException('Order items are required');
        }
        if (!facilityId) {
            throw new BadRequestException('facilityId is required');
        }
        if (!distributorId) {
            throw new BadRequestException('distributorId is required');
        }

        const facility = await this.prisma.facility.findUnique({ where: { id: facilityId } });
        if (!facility) {
            throw new NotFoundException(`Facility ${facilityId} not found`);
        }

        const distributor = await this.prisma.distributor.findUnique({ where: { id: distributorId } });
        if (!distributor) {
            throw new NotFoundException(`Distributor ${distributorId} not found`);
        }

        const skuList = items.map((i) => i.sku);
        const products = await this.prisma.product.findMany({ where: { sku: { in: skuList } } });
        const productMap = new Map(products.map((p) => [p.sku, p.id]));

        const missingSkus = items.filter((i) => !productMap.has(i.sku)).map((i) => i.sku);
        if (missingSkus.length) {
            throw new BadRequestException(`Unknown SKUs: ${missingSkus.join(', ')}`);
        }

        const newOrder = await this.prisma.order.create({
            data: {
                facilityId,
                distributorId,
                status: 'PENDING',
                items: {
                    create: items.map((item) => ({
                        productId: productMap.get(item.sku)!,
                        quantity: item.quantity,
                    })),
                },
            },
            include: {
                facility: true,
                distributor: true,
            },
        });

        const details = items.map((i) => `• ${i.quantity} шт. ${i.sku}`).join('\n');
        const distributorName = (distributor as any).fullName ?? distributor.name ?? 'Неизвестно';

        const orderDetails =
            `**Заведение:** ${facility.name} (${facility.address})\n` +
            `**Дистрибьютор:** ${distributorName}\n\n` +
            `**Товары:**\n${details}`;

        if (distributor.telegramChatId) {
            await this.telegramService.sendOrderNotification(
                distributor.telegramChatId,
                newOrder.id,
                orderDetails,
            );
            this.logger.log(`Order ${newOrder.id} created and notification sent.`);
        } else {
            this.logger.warn(`Distributor ${distributorId} has no Telegram chatId, skipping notification.`);
        }

        return newOrder;
    }
}
