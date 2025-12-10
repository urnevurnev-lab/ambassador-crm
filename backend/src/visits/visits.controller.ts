import { Controller, Post, Body, Get } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('visits')
export class VisitsController {
    constructor(private readonly prisma: PrismaService) { }

    @Post()
    async createVisit(@Body() body: {
        userId: number; // Берется из токена/авторизации (или передается с фронта временно)
        facilityId: number;
        type: string;
        productsAvailable?: number[]; // Массив ID продуктов
        lat?: number;
        lng?: number;
    }) {
        // 1. Создаем визит
        const visit = await this.prisma.visit.create({
            data: {
                userId: body.userId,
                facilityId: body.facilityId,
                type: body.type || 'VISIT',
                isValidGeo: true, // Мы проверили это на фронте (Geo-Lock)
                productsAvailable: {
                    connect: body.productsAvailable?.map(id => ({ id })) || []
                }
            },
        });

        // 2. Геймификация: Начисляем XP пользователю
        const XP_PER_VISIT = 50;
        const user = await this.prisma.user.findUnique({ where: { id: body.userId } });
        
        if (user) {
            const newXp = user.xp + XP_PER_VISIT;
            // Простая формула уровня: Каждые 1000 XP = 1 уровень
            const newLevel = Math.floor(newXp / 1000) + 1;

            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    xp: newXp,
                    level: newLevel
                }
            });
        }

        return visit;
    }

    @Get()
    async getHistory() {
        return this.prisma.visit.findMany({
            include: { facility: true, user: true, productsAvailable: true },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    }
}
