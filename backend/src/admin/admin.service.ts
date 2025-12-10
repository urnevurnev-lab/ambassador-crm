import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GeocodingService } from '../facilities/geocoding.service';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly geocodingService: GeocodingService
    ) {}

    // --- СТАРЫЕ МЕТОДЫ (Вернули, чтобы контроллер не падал) ---

    async geocode() {
        // Проксируем вызов в сервис геокодинга
        return this.geocodingService.geocodeMissingFacilities();
    }

    async createMainDistributor() {
        const exists = await this.prisma.distributor.findFirst();
        if (!exists) {
            return this.prisma.distributor.create({
                data: {
                    name: 'Main Distributor',
                    telegramChatId: '' // Пустой ID, заполнят потом
                }
            });
        }
        return { message: 'Distributor already exists' };
    }

    // --- НОВЫЕ МЕТОДЫ (Очистка и Статистика) ---

    async resetDatabase() {
        await this.prisma.visit.deleteMany();
        await this.prisma.orderItem.deleteMany();
        await this.prisma.order.deleteMany();
        await this.prisma.facility.deleteMany();
        await this.prisma.user.deleteMany();
        return { message: 'Database reset complete' };
    }

    async cleanDatabase() {
        this.logger.log('🧹 Starting deep cleaning...');

        // 1. Находим "мусор"
        const garbageFacilities = await this.prisma.facility.findMany({
            where: {
                OR: [
                    { name: { startsWith: 'Активность', mode: 'insensitive' } },
                    { name: { startsWith: 'Activity', mode: 'insensitive' } },
                    { name: { startsWith: 'Test', mode: 'insensitive' } },
                    { name: { startsWith: 'Тест', mode: 'insensitive' } },
                    { address: '' },
                    { address: null },
                    { address: 'Адрес не указан' },
                    // Удаляем те, что без координат (значит, умный поиск не справился)
                    { lat: null },
                    { lat: 0 },
                ]
            },
            select: { id: true }
        });

        const idsToDelete = garbageFacilities.map(f => f.id);

        if (idsToDelete.length === 0) {
            return { message: 'Nothing to clean.' };
        }

        this.logger.log(`Found ${idsToDelete.length} garbage facilities. Deleting...`);

        // 2. УДАЛЯЕМ СВЯЗИ (Чтобы не было ошибки Foreign Key)
        await this.prisma.orderItem.deleteMany({
            where: { order: { facilityId: { in: idsToDelete } } }
        });
        await this.prisma.order.deleteMany({
            where: { facilityId: { in: idsToDelete } }
        });
        await this.prisma.visit.deleteMany({
            where: { facilityId: { in: idsToDelete } }
        });

        // 3. УДАЛЯЕМ САМИ ТОЧКИ
        const deletedFacilities = await this.prisma.facility.deleteMany({
            where: { id: { in: idsToDelete } }
        });

        return { 
            message: 'Cleanup successful', 
            deleted: deletedFacilities.count 
        };
    }

    async getDashboardStats() {
        const [users, facilities, orders, visits] = await Promise.all([
            this.prisma.user.count({ where: { role: 'AMBASSADOR' } }),
            this.prisma.facility.count(),
            this.prisma.order.count({ where: { status: 'PENDING' } }),
            this.prisma.visit.count()
        ]);

        return {
            users,
            facilities,
            orders,
            visits
        };
    }
}
