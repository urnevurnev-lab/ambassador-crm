import { Controller, Get, Post, Body, Patch, Param, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('visits')
export class VisitsController {
    constructor(private readonly prisma: PrismaService) { }

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
    }) {
        // Ищем пользователя по Telegram ID или внутреннему ID
        let user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { telegramId: String(data.userId) },
                    { id: Number(data.userId) }
                ]
            }
        });

        // Фоллбек на ID 1 (для тестов/отладки)
        if (!user) {
            console.log(`⚠️ User not found for ID ${data.userId}. Using fallback ID 1.`);
            user = await this.prisma.user.findUnique({ where: { id: 1 } });
        }

        if (!user) {
            throw new HttpException('User not found in DB', HttpStatus.BAD_REQUEST);
        }

        return this.prisma.visit.create({
            data: {
                userId: user.id,
                facilityId: Number(data.facilityId),
                type: data.type,
                date: new Date(),
                status: data.status || 'IN_PROGRESS',
                data: {
                    userLat: data.userLat || 0,
                    userLng: data.userLng || 0,
                },
            },
        });
    }

    @Patch(':id')
    async updateVisit(@Param('id') id: string, @Body() data: any) {
        return this.prisma.visit.update({
            where: { id: Number(id) },
            data,
        });
    }
}
