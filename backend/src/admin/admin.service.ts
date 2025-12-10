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

        // 1. ОПРЕДЕЛЯЕМ КРИТЕРИИ МУСОРА
        // Находим ID всех заведений, которые подходят под удаление
        const garbageFacilities = await this.prisma.facility.findMany({
            where: {
                OR: [
                    // Активности и Тесты
                    { name: { startsWith: 'Активность', mode: 'insensitive' } },
                    { name: { startsWith: 'Activity', mode: 'insensitive' } },
                    { name: { startsWith: 'Test', mode: 'insensitive' } },
                    { name: { startsWith: 'Тест', mode: 'insensitive' } },
                    
                    // Плохие адреса
                    { address: '' },
                    { address: null },
                    { address: 'Адрес не указан' },
                    
                    // Безнадежные (без координат)
                    { lat: null },
                    { lat: 0 },
                ]
            },
            select: { id: true }
        });

        const idsToDelete = garbageFacilities.map(f => f.id);

        if (idsToDelete.length === 0) {
            return { message: 'Nothing to clean. Database is shiny! ✨' };
        }

        this.logger.log(`Found ${idsToDelete.length} garbage facilities. Deleting...`);

        // 2. УДАЛЯЕМ СВЯЗИ (Визиты и Заказы)
        // Сначала удаляем элементы заказов
        await this.prisma.orderItem.deleteMany({
            where: {
                order: {
                    facilityId: { in: idsToDelete }
                }
            }
        });

        // Удаляем сами заказы
        const deletedOrders = await this.prisma.order.deleteMany({
            where: { facilityId: { in: idsToDelete } }
        });

        // Удаляем визиты
        const deletedVisits = await this.prisma.visit.deleteMany({
            where: { facilityId: { in: idsToDelete } }
        });

        // 3. УДАЛЯЕМ САМИ ЗАВЕДЕНИЯ
        const deletedFacilities = await this.prisma.facility.deleteMany({
            where: { id: { in: idsToDelete } }
        });

        const result = {
            deletedFacilities: deletedFacilities.count,
            deletedVisits: deletedVisits.count,
            deletedOrders: deletedOrders.count
        };

        this.logger.log(`Cleanup complete: ${JSON.stringify(result)}`);
        return result;
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
