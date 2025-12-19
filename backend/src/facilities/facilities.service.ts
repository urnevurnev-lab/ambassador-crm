import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FacilitiesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        const facilities = await this.prisma.facility.findMany({
            where: {
                AND: [
                    { name: { not: { startsWith: 'Активность:' } } },
                    { name: { not: { equals: '' } } }
                ]
            },
            select: {
                id: true,
                name: true,
                address: true,
                city: true,
                isVerified: true,
                requiredProducts: true,
                visits: {
                    take: 1,
                    orderBy: { date: 'desc' },
                    select: {
                        date: true,
                        productsAvailable: { select: { id: true } }
                    }
                }
            }
        });

        const TARGET_SKU_COUNT = 20;
        const now = new Date();

        return facilities.map(f => {
            const lastVisit = f.visits[0];
            const stockCount = lastVisit?.productsAvailable?.length || 0;
            const score = Math.min(Math.round((stockCount / TARGET_SKU_COUNT) * 100), 100);

            let daysSinceLastVisit = null;
            if (lastVisit?.date) {
                const diffTime = Math.abs(now.getTime() - new Date(lastVisit.date).getTime());
                daysSinceLastVisit = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }

            return {
                id: f.id,
                name: f.name,
                address: f.address,
                city: f.city,
                isVerified: f.isVerified,
                score,
                lastVisitDate: lastVisit?.date || null,
                daysSinceLastVisit
            };
        }).sort((a, b) => {
            // Priority:
            // 1. Forgotten venues (daysSinceLastVisit >= 7)
            // 2. Never visited (daysSinceLastVisit === null)
            // 3. Recently visited
            if (a.daysSinceLastVisit === null && b.daysSinceLastVisit === null) return 0;
            if (a.daysSinceLastVisit === null) return -1;
            if (b.daysSinceLastVisit === null) return 1;
            return b.daysSinceLastVisit - a.daysSinceLastVisit;
        });
    }

    async findOne(id: number) {
        return this.prisma.facility.findUnique({ where: { id } });
    }

    async create(data: any) {
        if (!data.name || data.name.trim().length < 2) {
            throw new BadRequestException('name is required');
        }
        if (!data.address || !/[A-Za-zА-Яа-я]/.test(data.address)) {
            throw new BadRequestException('address is required');
        }

        const duplicate = await this.prisma.facility.findFirst({
            where: {
                name: { equals: data.name, mode: 'insensitive' },
                address: { equals: data.address, mode: 'insensitive' },
            },
        });
        if (duplicate) {
            throw new ConflictException('Такое заведение уже есть');
        }

        const newFacility = await this.prisma.facility.create({
            data: {
                ...data,
                isVerified: false, // New venues need verification
                requiredProducts: data.requiredProducts ?? [],
            },
        });

        return { facility: newFacility, geocoded: false };
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
