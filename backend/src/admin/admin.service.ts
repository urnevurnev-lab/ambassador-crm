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

    async getDashboardStats() {
        const [users, facilities, orders, visits] = await Promise.all([
            this.prisma.user.count({ where: { role: 'AMBASSADOR' } }),
            this.prisma.facility.count(),
            this.prisma.order.count({ where: { status: 'PENDING' } }),
            this.prisma.visit.count(),
        ]);

        return { users, facilities, orders, visits };
    }

    async cleanDatabase() {
        // 1. Удаляем активности/тесты
        const activitiesDeleted = await this.prisma.facility.deleteMany({
            where: {
                OR: [
                    { name: { startsWith: 'Активность', mode: 'insensitive' } },
                    { name: { startsWith: 'Activity', mode: 'insensitive' } },
                    { name: { startsWith: 'Test', mode: 'insensitive' } },
                    { name: { startsWith: 'Тест', mode: 'insensitive' } },
                ],
            },
        });

        // 2. Удаляем пустые/короткие адреса
        const badAddresses = await this.prisma.facility.findMany({
            where: {
                OR: [
                    { address: null },
                    { address: { contains: 'Адрес не указан', mode: 'insensitive' } },
                    { address: '' },
                ],
            },
            select: { id: true, address: true },
        });
        const badAddressIds = badAddresses
            .filter((f) => !f.address || f.address.trim().length < 5)
            .map((f) => f.id);

        const emptyDeleted = badAddressIds.length
            ? await this.prisma.facility.deleteMany({ where: { id: { in: badAddressIds } } })
            : { count: 0 };

        // 3. Дубликаты по name+address
        const allFacilities = await this.prisma.facility.findMany({
            select: { id: true, name: true, address: true },
            orderBy: { id: 'asc' },
        });
        const seen = new Map<string, number>();
        const duplicateIds: number[] = [];
        for (const f of allFacilities) {
            const addr = (f.address || '').trim();
            const key = `${(f.name || '').trim().toLowerCase()}|${addr.toLowerCase()}`;
            if (!key.trim()) continue;
            if (seen.has(key)) {
                duplicateIds.push(f.id);
            } else {
                seen.set(key, f.id);
            }
        }
        let duplicatesDeleted = { count: 0 };
        if (duplicateIds.length) {
            duplicatesDeleted = await this.prisma.facility.deleteMany({ where: { id: { in: duplicateIds } } });
        }

        // 4. Безнадежные (lat null или 0)
        const hopelessDeleted = await this.prisma.facility.deleteMany({
            where: { OR: [{ lat: null }, { lat: 0 }] },
        });

        return {
            activitiesDeleted: activitiesDeleted.count,
            emptyDeleted: emptyDeleted.count,
            duplicatesDeleted: duplicatesDeleted.count,
            hopelessDeleted: hopelessDeleted.count,
        };
    }
}
