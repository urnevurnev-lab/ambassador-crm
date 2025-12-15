import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { TelegramAuthUser } from '../telegram/telegram.utils';

interface CreateOrderDto {
    facilityId: number;
    distributorId: number;
    items: { sku: string; quantity: number }[];
    contactName?: string;
    contactPhone?: string;
}



@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly telegramService: TelegramService,
    ) { }

    async create(createOrderDto: CreateOrderDto, telegramUser?: TelegramAuthUser) {
        const { facilityId, distributorId, items, contactName, contactPhone } = createOrderDto;

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

        let ambassadorUser = null;
        if (telegramUser) {
            ambassadorUser = await this.prisma.user.upsert({
                where: { telegramId: telegramUser.telegramId },
                update: { fullName: telegramUser.fullName },
                create: { telegramId: telegramUser.telegramId, fullName: telegramUser.fullName },
            });
        }

        const newOrder = await this.prisma.order.create({
            data: {
                facilityId,
                distributorId,
                userId: ambassadorUser?.id,
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
                user: true,
            },
        });

        // --- Группировка items по линейкам (если бы у нас была инфа о линейках тут, пока просто список) ---
        // Для MVP просто список
        const details = items.map((i) => `• ${i.sku} — ${i.quantity} шт.`).join('\n');

        const distributorName = (distributor as any).fullName ?? distributor.name ?? 'Неизвестно';

        // --- Формирование красивого сообщения ---
        const orderDetails =
            `📦 **НОВЫЙ ЗАКАЗ #${newOrder.id}**\n\n` +
            `🏢 **Заведение:** ${facility.name}\n` +
            `📍 **Адрес:** ${facility.address}\n\n` +
            `👤 **Контактное лицо:** ${contactName || 'Не указано'}\n` +
            `📞 **Телефон:** ${contactPhone || 'Не указано'}\n\n` +
            `🛒 **Состав заказа:**\n${details}\n\n` +
            `👨‍💻 **Амбассадор:** ${ambassadorUser ? ambassadorUser.fullName : 'Система'}`;

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

    async getAll() {
        return this.prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: { facility: true, distributor: true, user: true }
        });
    }

    async updateStatus(id: number, status: string) {
        return this.prisma.order.update({
            where: { id },
            data: { status }
        });
    }
}
