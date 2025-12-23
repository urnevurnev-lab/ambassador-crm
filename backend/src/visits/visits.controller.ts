import { Controller, Get, Post, Body, Patch, Param, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TelegramService } from '../telegram/telegram.service';

@Controller('visits')
export class VisitsController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly telegramService: TelegramService
    ) { }

    @Get()
    async getVisits() {
        return this.prisma.visit.findMany({
            include: { facility: true, user: true },
            orderBy: { date: 'desc' }
        });
    }

    @Post()
    async createVisit(@Body() data: {
        facilityId: number;
        type: string;
        userId: number | string;
        userLat?: number;
        userLng?: number;
        status?: string;
        scenarioData?: any;
    }) {
        let user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { telegramId: String(data.userId) },
                    { id: Number(data.userId) }
                ]
            }
        });

        if (!user) {
            user = await this.prisma.user.findUnique({ where: { id: 1 } });
        }

        if (!user) {
            throw new HttpException('User not found in DB', HttpStatus.BAD_REQUEST);
        }

        const facility = await this.prisma.facility.findUnique({
            where: { id: Number(data.facilityId) }
        });

        const visit = await this.prisma.visit.create({
            data: {
                userId: user.id,
                facilityId: Number(data.facilityId),
                type: data.type,
                date: new Date(),
                status: data.status || 'COMPLETED',
                comment: data.scenarioData?.comment,
                data: data.scenarioData || {},
            },
            include: { user: true, facility: true }
        });

        // Синхронизация остатков с объектом (если это проезд/инвентаризация)
        if (data.type === 'transit' && data.scenarioData?.inventory) {
            const inventoryMap = data.scenarioData.inventory as Record<string, any>;
            const selectedIds = Object.entries(inventoryMap)
                .filter(([, v]) => Boolean(v))
                .map(([k]) => Number(k))
                .filter((id) => !Number.isNaN(id));

            if (selectedIds.length > 0) {
                await this.prisma.visit.update({
                    where: { id: visit.id },
                    data: {
                        productsAvailable: {
                            set: [],
                            connect: selectedIds.map((id) => ({ id })),
                        },
                    },
                });
            }

            await this.prisma.facility.update({
                where: { id: Number(data.facilityId) },
                data: {
                    mustList: inventoryMap,
                }
            });
        }

        // Отправка уведомления в Telegram (Manager или Admin чат)
        const managerChatId = process.env.TELEGRAM_MANAGER_CHAT_ID;
        if (managerChatId) {
            try {
                const typeMap: any = {
                    transit: '🚗 ПРОЕЗД/ЧЕК-ИН',
                    tasting: '🍷 ДЕГУСТАЦИЯ',
                    b2b: '💼 B2B ВСТРЕЧА',
                    checkup: '⏱ СМЕНА/КОНТРОЛЬ'
                };

                let extraInfo = '';
                const sData = data.scenarioData;
                if (data.type === 'checkup') extraInfo = `\n📊 Продажи: ${sData?.shift?.cups} шт`;
                if (data.type === 'tasting') extraInfo = `\n👥 Гостей: ${sData?.guests?.length || 0}`;

                const message = `
<b>📍 Новый отчет: ${typeMap[data.type] || data.type}</b>
👤 Амбассадор: ${user.fullName}
🏢 Объект: ${facility?.name || 'Неизвестно'}
💬 Коммент: ${data.scenarioData?.comment || '—'}
${extraInfo}
                `.trim();

                await this.telegramService.sendMessage(managerChatId, message);
            } catch (e) {
                console.error('Failed to send visit notification', e);
            }
        }

        return visit;
    }

    @Patch(':id')
    async updateVisit(@Param('id') id: string, @Body() data: any) {
        return this.prisma.visit.update({
            where: { id: Number(id) },
            data,
        });
    }
}
