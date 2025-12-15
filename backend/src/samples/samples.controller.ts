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

        // Find DB user ID
        const dbUser = await this.prisma.user.findUnique({ where: { telegramId: user.telegramId } });
        if (!dbUser) throw new Error('User not found in DB');

        return this.samplesService.createOrder(dbUser.id, dto);
    }

    @Get('analytics')
    async getAnalytics() {
        return this.samplesService.getFlavorRating();
    }

    @Get('export')
    async exportExcel(@Res() res: Response) {
        return this.samplesService.exportToExcel(res);
    }
}
