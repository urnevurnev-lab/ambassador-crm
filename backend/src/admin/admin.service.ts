import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GeocodingService } from '../facilities/geocoding.service';

@Injectable()
export class AdminService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly geocodingService: GeocodingService,
    ) {}

    async resetDatabase() {
        await this.prisma.$transaction([
            this.prisma.orderItem.deleteMany({}),
            this.prisma.order.deleteMany({}),
            this.prisma.visit.deleteMany({}),
            this.prisma.product.deleteMany({}),
            this.prisma.distributor.deleteMany({}),
            this.prisma.facility.deleteMany({}),
        ]);

        return { ok: true, message: 'Database cleared (users preserved)' };
    }

    async geocode() {
        return this.geocodingService.geocodeMissingFacilities();
    }

    async createMainDistributor() {
        let distributor = await this.prisma.distributor.findFirst({
            where: { name: 'Main Distributor' },
        });
        if (!distributor) {
            distributor = await this.prisma.distributor.create({
                data: {
                    name: 'Main Distributor',
                    telegramChatId: '-1',
                },
            });
        }
        return distributor;
    }
}
