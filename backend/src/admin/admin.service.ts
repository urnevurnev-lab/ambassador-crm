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

    // --- СТАРЫЕ МЕТОДЫ (для совместимости) ---

    async geocode() {
        return this.geocodingService.geocodeMissingFacilities();
    }

    async createMainDistributor() {
        const exists = await this.prisma.distributor.findFirst();
        if (!exists) {
            return this.prisma.distributor.create({
                data: {
                    name: 'Main Distributor',
                    telegramChatId: '' 
                }
            });
        }
        return { message: 'Distributor already exists' };
    }

    // --- НОВЫЕ МЕТОДЫ ---

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
        // ВАЖНО: Убрали { address: null }, так как поле обязательное
        const garbageFacilities = await this.prisma.facility.findMany({
            where: {
                OR: [
                    // Активности и Тесты
                    { name: { startsWith: 'Активность', mode: 'insensitive' } },
                    { name: { startsWith: 'Activity', mode: 'insensitive' } },
                    { name: { startsWith: 'Test', mode: 'insensitive' } },
                    { name: { startsWith: 'Тест', mode: 'insensitive' } },
                    
                    // Плохие адреса (пустые строки)
                    { address: '' },
                    { address: 'Адрес не указан' },
                    { address: { lt: '     ' } }, // Короче 5 символов (примерно)
                    
                    // Безнадежные (без координат)
                    { lat: null },
                    { lat: 0 },
                ]
            },
            select: { id: true }
        });

        const idsToDelete = garbageFacilities.map(f => f.id);

        if (idsToDelete.length === 0) {
            this.logger.log('Nothing to clean. Database is shiny! ✨');
            return { message: 'Nothing to clean. Database is shiny! ✨', deleted: 0 };
        }

        this.logger.log(`Found ${idsToDelete.length} garbage facilities. Deleting...`);

        // 2. УДАЛЯЕМ СВЯЗИ (Чтобы не было ошибки Foreign Key)
        // Удаляем OrderItems, связанные с этими заведениями
        await this.prisma.orderItem.deleteMany({
            where: { order: { facilityId: { in: idsToDelete } } }
        });
        
        // Удаляем Orders
        const deletedOrders = await this.prisma.order.deleteMany({
            where: { facilityId: { in: idsToDelete } }
        });

        // Удаляем Visits
        const deletedVisits = await this.prisma.visit.deleteMany({
            where: { facilityId: { in: idsToDelete } }
        });

        // 3. УДАЛЯЕМ САМИ ЗАВЕДЕНИЯ
        const deletedFacilities = await this.prisma.facility.deleteMany({
            where: { id: { in: idsToDelete } }
        });

        const result = { 
            message: 'Cleanup successful', 
            deletedFacilities: deletedFacilities.count,
            deletedVisits: deletedVisits.count,
            deletedOrders: deletedOrders.count
        };
        
        this.logger.log(`Cleanup Done: ${JSON.stringify(result)}`);
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
