import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('users')
export class UsersController {
    constructor(private readonly prisma: PrismaService) { }

    @Post('auth')
    async authUser(@Body() data: { telegramId: string; fullName: string; username?: string }) {
        // ... existing auth logic
        const user = await this.prisma.user.findUnique({
            where: { telegramId: data.telegramId },
        });
        if (user) return user;
        return this.prisma.user.create({
            data: {
                telegramId: data.telegramId,
                fullName: data.fullName,
            },
        });
    }

    // Admin Methods
    @Get()
    async getAllUsers() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    @Patch(':id')
    async updateUser(@Param('id') id: string, @Body() data: { role?: 'ADMIN' | 'AMBASSADOR'; telegramId?: string }) {
        return this.prisma.user.update({
            where: { id: Number(id) },
            data: {
                ...(data.role && { role: data.role }),
                ...(data.telegramId && { telegramId: data.telegramId }),
            }
        });
    }
}
