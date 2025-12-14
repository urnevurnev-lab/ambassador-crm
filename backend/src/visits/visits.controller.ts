import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// Функция расчета расстояния (в метрах)
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // Радиус Земли в метрах
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

@Controller('visits')
export class VisitsController {
    constructor(private readonly prisma: PrismaService) {}

    @Post()
    async createVisit(@Body() data: { 
        userId: number; 
        facilityId: number; 
        activityId?: number; // Теперь привязываем к активности
        type: string; 
        userLat?: number; 
        userLng?: number;
        comment?: string;
    }) {
        // 1. Получаем координаты заведения
        const facility = await this.prisma.facility.findUnique({
            where: { id: data.facilityId }
        });

        // 2. Проверяем геопозицию
        let isValidGeo = false;
        let isSuspicious = false;
        
        if (facility?.lat && facility?.lng && data.userLat && data.userLng) {
            const distance = getDistanceInMeters(data.userLat, data.userLng, facility.lat, facility.lng);
            console.log(`Проверка гео: Дистанция ${distance.toFixed(0)}м`);
            
            if (distance <= 500) { // Допуск 500 метров
                isValidGeo = true;
            } else {
                isSuspicious = true; // Слишком далеко
            }
        }

        // 3. Создаем визит
        const visit = await this.prisma.visit.create({
            data: {
                userId: data.userId,
                facilityId: data.facilityId,
                activityId: data.activityId, // ID выбранной активности
                type: data.type,
                comment: data.comment,
                isValidGeo,
                isSuspicious,
                // Сохраняем "сырые" данные локации на всякий случай
                data: {
                    userLat: data.userLat,
                    userLng: data.userLng
                }
            }
        });

        return visit;
    }

    @Get()
    async getVisits() {
        return this.prisma.visit.findMany({
            orderBy: { date: 'desc' },
            take: 100, // Чтобы не грузить всё сразу
            include: {
                user: { select: { fullName: true } },
                facility: { select: { name: true, address: true } },
                activity: true
            }
        });
    }
}
