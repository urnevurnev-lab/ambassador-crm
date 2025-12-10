import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FacilitiesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.facility.findMany({
            where: {
                // Фильтр: скрываем технические записи
                name: { not: { startsWith: 'Активность:' } }
            },
            select: {
                id: true,
                name: true,
                address: true,
                lat: true,
                lng: true,
            }
        });
    }

    async findOne(id: number) {
        return this.prisma.facility.findUnique({ where: { id } });
    }

    async create(data: any) {
        return this.prisma.facility.create({ data });
    }

    async update(id: number, data: any) {
        return this.prisma.facility.update({ where: { id }, data });
    }

    async findWithHistory(id: number) {
        // ... (оставим стандартную реализацию для совместимости)
        return this.prisma.facility.findUnique({
            where: { id },
            include: { visits: true }
        });
    }

    async mergeDuplicates() { return { mergedGroups: 0, deletedFacilities: 0 }; }
    async smartMergeByVisits() { return { mergedNames: 0, visitsMoved: 0, facilitiesDeleted: 0 }; }

    // ГЛАВНЫЙ МЕТОД АНАЛИТИКИ
    async findWithAnalytics(id: number) {
        const facility = await this.prisma.facility.findUnique({
            where: { id },
            include: {
                visits: {
                    orderBy: { date: 'desc' },
                    include: { user: true, productsAvailable: true },
                },
            },
        });
        if (!facility) return null;

        const lastVisit = facility.visits[0] || null;
        // Сортировка по линейке
        const currentStock = (lastVisit?.productsAvailable || []).sort((a, b) => a.line.localeCompare(b.line));

        // Анализ топов (Global Top)
        const allVisits = await this.prisma.visit.findMany({
            select: { productsAvailable: true },
        });
        
        const freq = new Map<number, { count: number; flavor: string; category: string; line: string }>();
        
        for (const v of allVisits) {
            for (const p of v.productsAvailable) {
                const entry = freq.get(p.id) || { count: 0, flavor: p.flavor, category: p.category, line: p.line };
                entry.count += 1;
                freq.set(p.id, entry);
            }
        }

        const top20 = Array.from(freq.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 20)
            .map(([id, meta]) => ({ id, ...meta }));

        const currentIds = new Set(currentStock.map((p) => p.id));
        const missingRecommendations = top20.filter((p) => !currentIds.has(p.id));

        // ГРУППИРОВКА ПО ЛИНЕЙКЕ (LINE), А НЕ ПО CATEGORY
        const categoryBreakdown = currentStock.reduce<Record<string, number>>((acc, p) => {
            const key = p.line || 'Other'; 
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        return { facility, lastVisit, currentStock, missingRecommendations, categoryBreakdown };
    }
}
