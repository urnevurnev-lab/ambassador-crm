import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('distributors')
export class DistributorsController {
    constructor(private readonly prisma: PrismaService) { }

    @Post()
    async createDistributor(@Body() data: { name?: string; fullName?: string; telegramChatId?: string; chatId?: string }) {
        const name = data.name || data.fullName;
        const chatId = data.telegramChatId || data.chatId;

        const created = await this.prisma.distributor.create({
            data: {
                name,
                telegramChatId: chatId,
            },
        });

        return { ...created, fullName: created.name, chatId: created.telegramChatId };
    }

    @Get()
    async getDistributors() {
        const distributors = await this.prisma.distributor.findMany();
        return distributors.map((d) => ({
            ...d,
            fullName: d.name,
            chatId: d.telegramChatId,
        }));
    }

    @Delete(':id')
    async deleteDistributor(@Param('id') id: string) {
        const deleted = await this.prisma.distributor.delete({
            where: { id: Number(id) },
        });
        return { ...deleted, fullName: deleted.name, chatId: deleted.telegramChatId };
    }
}
