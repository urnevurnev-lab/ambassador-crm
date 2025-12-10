import { Controller, Post, Body, Get, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('visits')
export class VisitsController {
    constructor(private readonly prisma: PrismaService) { }

    @Post()
    async createVisit(@Body() body: {
        userId: number;
        facilityId: number;
        type: string;
        lat: number;
        lng: number;
        photoUrl?: string;
        date?: Date;
    }) {
        // Basic geo validation stub
        const facility = await this.prisma.facility.findUnique({ where: { id: body.facilityId } });
        if (!facility) throw new BadRequestException('Facility not found');

        // Simple distance check logic could go here. For now just set valid if close enough.
        // 0.001 degrees is roughly 100m.
        const isValidGeo = Math.abs(facility.lat - body.lat) < 0.001 && Math.abs(facility.lng - body.lng) < 0.001;

        return this.prisma.visit.create({
            data: {
                userId: body.userId,
                facilityId: body.facilityId,
                type: body.type || 'UNKNOWN',
                date: body.date ? new Date(body.date) : new Date(),
                photoUrl: body.photoUrl,
                isValidGeo,
            },
        });
    }

    @Get()
    async getHistory() {
        return this.prisma.visit.findMany({
            include: { facility: true, user: true },
            orderBy: { createdAt: 'desc' },
        });
    }
}
