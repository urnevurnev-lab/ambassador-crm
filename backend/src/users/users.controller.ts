import { Controller, Post, Body, Get, Param, HttpException, HttpStatus, UseGuards, Req, Patch, Delete } from '@nestjs/common';
import { TelegramAuthGuard } from '../telegram/telegram.guard';
import { PrismaService } from '../prisma.service';

@Controller('users')
export class UsersController {
    constructor(private readonly prisma: PrismaService) { }

    // Метод 1: Проверка регистрации при входе (ТОЛЬКО ДЛЯ ТЕХ КТО В АДМИНКЕ)
    @Post('auth')
    async authUser(@Body() data: { telegramId: string; fullName: string }) {
        const user = await this.prisma.user.findUnique({
            where: { telegramId: data.telegramId },
            include: { allowedDistributors: true }
        });
        if (!user) {
            throw new HttpException('Доступ запрещен. Обратитесь к администратору для регистрации.', HttpStatus.FORBIDDEN);
        }
        return user;
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

    // Метод 5: Удалить сотрудника
    @Delete(':id')
    async deleteUser(@Param('id') id: string) {
        return this.prisma.user.delete({ where: { id: Number(id) } });
    }

    // Метод 5: Получить свой профиль
    @Get('me')
    @UseGuards(TelegramAuthGuard)
    async getMe(@Req() req: any) {
        const telegramId = req.user.telegramId;
        const user = await this.prisma.user.findUnique({ where: { telegramId } });
        if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        return user;
    }

    // Метод 6: Обновить свой профиль
    @Patch('me')
    @UseGuards(TelegramAuthGuard)
    async updateMe(@Req() req: any, @Body() data: { birthDate?: string; tshirtSize?: string; cdekInfo?: any }) {
        const telegramId = req.user.telegramId;
        return this.prisma.user.update({
            where: { telegramId },
            data: {
                birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
                tshirtSize: data.tshirtSize,
                cdekInfo: data.cdekInfo
            }
        });
    }
}
