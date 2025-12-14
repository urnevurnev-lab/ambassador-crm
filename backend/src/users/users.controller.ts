import { Controller, Post, Body, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('users')
export class UsersController {
    constructor(private readonly prisma: PrismaService) { }

    // Метод 1: Авторизация/Регистрация через бота (старый)
    @Post('auth')
    async authUser(@Body() data: { telegramId: string; fullName: string }) {
        const user = await this.prisma.user.findUnique({
            where: { telegramId: data.telegramId },
            include: { allowedDistributors: true } // Возвращаем сразу с чатами
        });
        if (user) return user;
        return this.prisma.user.create({
            data: {
                telegramId: data.telegramId,
                fullName: data.fullName,
            },
        });
    }

    // Метод 2: Ручное создание сотрудника из Админки (НОВЫЙ)
    @Post()
    async createUser(@Body() data: { fullName: string; telegramId: string; role?: 'ADMIN' | 'AMBASSADOR' }) {
        const existing = await this.prisma.user.findUnique({ where: { telegramId: data.telegramId } });
        if (existing) {
            throw new HttpException('Сотрудник с таким ID уже есть', HttpStatus.BAD_REQUEST);
        }
        return this.prisma.user.create({
            data: {
                fullName: data.fullName,
                telegramId: data.telegramId,
                role: data.role || 'AMBASSADOR',
            },
        });
    }

    // Метод 3: Получить всех (для списка)
    @Get()
    async getAllUsers() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: { allowedDistributors: true }
        });
    }

    // Метод 4: Привязать чаты к сотруднику
    @Post(':id/distributors')
    async linkDistributors(@Param('id') userId: string, @Body() data: { distributorIds: number[] }) {
        // Сначала очищаем старые связи, потом создаем новые (set)
        return this.prisma.user.update({
            where: { id: Number(userId) },
            data: {
                allowedDistributors: {
                    set: data.distributorIds.map(id => ({ id })),
                }
            },
            include: { allowedDistributors: true }
        });
    }
}
