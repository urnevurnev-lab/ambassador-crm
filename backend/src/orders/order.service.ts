import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { TelegramAuthUser } from '../telegram/telegram.utils';

// ---------- Helpers для форматирования сообщения ----------
function escapeHtml(value: string | null | undefined) {
    if (!value) return '';
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function cleanAddress(address: string) {
    const parts = address
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

    const filtered: string[] = [];
    const seen = new Set<string>();

    for (const rawPart of parts) {
        // Пропускаем регионы/округа
        if (/(область|округ)/i.test(rawPart)) {
            continue;
        }
        // Убираем служебные префиксы вроде "город", "поселок городского типа"
        const part = rawPart.replace(/^(пос[её]лок( городского типа)?|город|г\.|городской округ)\s+/i, '').trim();
        const key = part.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        filtered.push(part);
    }

    const core = filtered.length > 3 ? filtered.slice(-3) : filtered;
    return core.join(', ');
}

function toLineTitle(rawLine: string | null | undefined) {
    if (!rawLine) return 'Другое';
    const key = rawLine.toLowerCase().replace(/[_-]+/g, ' ').trim();
    if (key === 'bliss') return 'Bliss';
    if (key === 'white line' || key === 'whiteline' || key === 'white line.') return 'White Line';
    if (key === 'cigar line' || key === 'cigarline') return 'Cigar Line';
    // Дефолт: первая буква заглавная
    return rawLine.charAt(0).toUpperCase() + rawLine.slice(1);
}

function formatOrderMessage(params: {
    orderId: number;
    facilityName: string;
    address: string;
    contactName?: string | null;
    contactPhone?: string | null;
    items: { quantity: number; product?: { line?: string | null; flavor?: string | null; sku?: string | null } | null }[];
    ambassadorName?: string | null;
}) {
    const cleanedAddress = cleanAddress(params.address);
    const grouped: Record<string, { name: string; qty: number }[]> = {};

    for (const item of params.items) {
        const line = toLineTitle(item.product?.line ?? 'Другое');
        const flavor = item.product?.flavor || item.product?.sku || 'Товар';
        if (!grouped[line]) grouped[line] = [];
        grouped[line].push({
            name: flavor,
            qty: item.quantity ?? 1,
        });
    }

    const preferredOrder = ['Bliss', 'White Line', 'Cigar Line'];
    const lineKeys = [
        ...preferredOrder.filter((l) => grouped[l]),
        ...Object.keys(grouped).filter((l) => !preferredOrder.includes(l)),
    ];

    const parts: string[] = [
        `<b>⚡️ Заказ #${escapeHtml(String(params.orderId))}</b>`,
        '',
        '<b>Куда:</b>',
        `▫️ ${escapeHtml(params.facilityName)}`,
        `▫️ ${escapeHtml(cleanedAddress || params.address)}`,
        '',
        '<b>Контакты:</b>',
        `▫️ ${escapeHtml(params.contactName || 'Не указано')}`,
        `▫️ <code>${escapeHtml(params.contactPhone || '—')}</code>`,
        '',
        '<b>Состав заказа:</b>',
    ];

    for (const line of lineKeys) {
        parts.push(`<b>${escapeHtml(line)}:</b>`);
        for (const entry of grouped[line]) {
            parts.push(`▫️ ${escapeHtml(entry.name)} (${entry.qty} шт)`);
        }
    }

    parts.push('', `Амбассадор: ${escapeHtml(params.ambassadorName || 'Система')}`);
    return parts.join('\n');
}

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
                items: { include: { product: true } },
            },
        });

        // --- Формирование красивого сообщения ---
        const orderDetails = formatOrderMessage({
            orderId: newOrder.id,
            facilityName: facility.name,
            address: facility.address,
            contactName,
            contactPhone,
            items: newOrder.items ?? [],
            ambassadorName: ambassadorUser ? ambassadorUser.fullName : 'Система',
        });

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
