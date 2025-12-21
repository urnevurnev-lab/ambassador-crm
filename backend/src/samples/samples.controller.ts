import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { SamplesService } from './samples.service';
import { TelegramAuthGuard } from '../telegram/telegram.guard';
import { parseTelegramUserFromAuthHeader } from '../telegram/telegram.utils';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma.service';

@Controller('samples')
export class SamplesController {
    constructor(
        private readonly samplesService: SamplesService,
        private readonly prisma: PrismaService // Inject for quick user lookup helper
    ) { }

    @Post()
    @UseGuards(TelegramAuthGuard)
    async createOrder(@Body() dto: { items: { productId: number; quantity: number }[] }, @Req() req: Request) {
        const user = parseTelegramUserFromAuthHeader(req.headers.authorization as string);
        if (!user) throw new Error('Unauthorized');

        // Find DB user ID or create if not exists
        let dbUser = await this.prisma.user.findUnique({ where: { telegramId: user.telegramId } });

        if (!dbUser) {
            console.log(`User ${user.telegramId} not found in DB. Creating...`);
            dbUser = await this.prisma.user.create({
                data: {
                    telegramId: user.telegramId,
                    fullName: user.fullName || `User ${user.telegramId}`,
                    role: 'AMBASSADOR',
                }
            });
        }

        return this.samplesService.createOrder(dbUser.id, dto);
    }

    @Get('analytics')
    async getAnalytics() {
        return this.samplesService.getFlavorRating();
    }

    @Get()
    async getAllOrders() {
        return this.prisma.sampleOrder.findMany({
            include: { user: true, items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    @Get('my')
    @UseGuards(TelegramAuthGuard)
    async getMyOrders(@Req() req: any) {
        const telegramId = req.user?.telegramId;
        if (!telegramId) throw new Error('Unauthorized');

        const user = await this.prisma.user.findUnique({ where: { telegramId } });
        if (!user) throw new Error('User not found');

        return this.prisma.sampleOrder.findMany({
            where: { userId: user.id },
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    @Get('export')
    async exportExcel(@Res() res: Response) {
        return this.samplesService.exportToExcel(res);
    }
}
