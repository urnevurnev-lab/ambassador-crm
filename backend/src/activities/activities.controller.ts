import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('activities')
export class ActivitiesController {
    constructor(private readonly prisma: PrismaService) {}

    @Get()
    async list() {
        return this.prisma.activity.findMany({
            orderBy: { name: 'asc' },
        });
    }
}
