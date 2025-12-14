import { BadRequestException, ForbiddenException, Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Request } from 'express';
import { TelegramAuthGuard } from '../telegram/telegram.guard';

@Controller('visits')
export class VisitsController {
    private readonly MAX_DISTANCE_METERS = 200;
    constructor(private readonly prisma: PrismaService) { }

    private calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371e3; // meters
        const toRad = (deg: number) => deg * (Math.PI / 180);
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Post()
    @UseGuards(TelegramAuthGuard)
    async createVisit(@Body() body: {
        facilityId: number;
        type?: string;
        activityId?: number;
        productsAvailable?: number[]; // Массив ID продуктов
        lat?: number; // координаты пользователя
        lng?: number; // координаты пользователя
        data?: any;
        comment?: string;
    }, @Req() req: Request) {
        const facility = await this.prisma.facility.findUnique({
            where: { id: body.facilityId },
            select: { lat: true, lng: true, requiredProducts: true },
        });

        if (!facility) {
            throw new BadRequestException('Заведение не найдено');
        }

        const employeeLat = body.lat;
        const employeeLng = body.lng;
        let isValidGeo = false;

        if (facility.lat !== null && facility.lat !== undefined && facility.lng !== null && facility.lng !== undefined) {
            if (employeeLat === null || employeeLat === undefined || employeeLng === null || employeeLng === undefined) {
                throw new ForbiddenException('Не переданы координаты сотрудника');
            }
            const employeeLatNum = Number(employeeLat);
            const employeeLngNum = Number(employeeLng);
            if (!Number.isFinite(employeeLatNum) || !Number.isFinite(employeeLngNum)) {
                throw new BadRequestException('Некорректные координаты сотрудника');
            }
            const distance = this.calculateDistanceInMeters(
                facility.lat,
                facility.lng,
                employeeLatNum,
                employeeLngNum,
            );
            if (distance > this.MAX_DISTANCE_METERS) {
                throw new ForbiddenException('Слишком далеко от точки');
            }
            isValidGeo = true;
        }

        const telegramUser = (req as any).user as { telegramId?: string; fullName?: string } | undefined;
        if (!telegramUser?.telegramId) {
            throw new BadRequestException('Не удалось определить пользователя');
        }

        const ambassador = await this.prisma.user.upsert({
            where: { telegramId: telegramUser.telegramId },
            update: { fullName: telegramUser.fullName ?? telegramUser.telegramId },
            create: { telegramId: telegramUser.telegramId, fullName: telegramUser.fullName ?? telegramUser.telegramId },
        });
        (req as any).user = { id: ambassador.id, telegramId: ambassador.telegramId, fullName: ambassador.fullName };
        const userId = ambassador.id;

        // 1. Создаем визит
        const visit = await this.prisma.visit.create({
            data: {
                userId,
                facilityId: body.facilityId,
                activityId: body.activityId ?? null,
                type: body.type || 'VISIT',
                isValidGeo,
                comment: body.comment,
                data: body.data ?? null,
                productsAvailable: {
                    connect: body.productsAvailable?.map(id => ({ id })) || []
                }
            },
            include: {
                productsAvailable: true,
            },
        });

        // 2. Геймификация: Начисляем XP пользователю
        const XP_PER_VISIT = 50;
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        
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

        const requiredProducts = facility.requiredProducts || [];
        const missingProductIds = requiredProducts.filter((id) => !(body.productsAvailable || []).includes(id));
        let alert: string | null = null;
        let missingProducts = [];

        if (missingProductIds.length > 0) {
            missingProducts = await this.prisma.product.findMany({ where: { id: { in: missingProductIds } } });
            const names = missingProducts
                .map((p) => p.flavor || p.line || p.sku)
                .filter(Boolean);
            if (names.length) {
                alert = `Срочно предложи заказать ${names.join(', ')}!`;
            }
        }

        return { visit, alert, missingProducts };
    }

    @Get()
    async getHistory() {
        return this.prisma.visit.findMany({
            include: { facility: true, user: true, productsAvailable: true, activity: true },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    }
}
