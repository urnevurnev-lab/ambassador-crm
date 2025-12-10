import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

@Injectable()
export class GeocodingService {
    private readonly logger = new Logger(GeocodingService.name);

    constructor(private readonly prisma: PrismaService) {}

    async getGeocodingStats() {
        const total = await this.prisma.facility.count();
        
        // Исправленный запрос для статистики
        const geocoded = await this.prisma.facility.count({
            where: {
                AND: [
                    { lat: { not: null } },
                    { lat: { not: 0 } }
                ]
            }
        });

        const pending = await this.prisma.facility.count({
            where: {
                OR: [
                    { lat: null },
                    { lat: 0 },
                ],
            },
        });
        
        return { total, geocoded, pending };
    }

    async geocodeMissingFacilities() {
        this.logger.log('🚀 Starting SUPER-SMART geocoding...');
        
        // 1. Берем точки без координат (batches of 20, чтобы не перегружать)
        const facilities = await this.prisma.facility.findMany({
            where: {
                OR: [{ lat: null }, { lat: 0 }],
            },
            take: 20, 
        });

        console.log(`Found ${facilities.length} facilities to process`);
        let updated = 0;

        for (const facility of facilities) {
            try {
                // 2. ФИЛЬТР: Пропускаем активности и тесты
                if (facility.name.toLowerCase().startsWith('активность') || facility.name.toLowerCase().includes('тест')) {
                    console.log(`⏭️ Skipping activity: ${facility.name}`);
                    // Можно пометить их как "обработанные" (например, lat=0.0001), чтобы не брать снова
                    // Но пока просто пропускаем
                    continue;
                }

                const coords = await this.tryGeocode(facility.name, facility.address);

                if (coords) {
                    await this.prisma.facility.update({
                        where: { id: facility.id },
                        data: {
                            lat: coords.lat,
                            lng: coords.lng,
                        },
                    });
                    updated++;
                } else {
                    console.warn(`❌ FAILED all strategies for: ${facility.name}`);
                }

            } catch (e: any) {
                console.error(`Error processing ${facility.id}: ${e.message}`);
            }
        }

        return { updated };
    }

    async tryGeocode(name: string, address: string | null) {
        if (!address || address.length < 3) return null;

        // Очищаем адрес от индексов
        const cleanAddr = address.replace(/(\d{6})|(\d{6},)/g, '').trim();

        const strategies = [
            { name: 'Exact Match', query: `${name} ${cleanAddr}` },
            { name: 'Address Only', query: `${cleanAddr}` },
            { name: 'Moscow Fallback', query: `${cleanAddr} Москва` },
        ];

        for (const strat of strategies) {
            if (strat.query.length < 5) continue;

            try {
                const encodedQuery = encodeURIComponent(strat.query);
                const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`, {
                    headers: { 'User-Agent': 'AmbassadorCRM/2.0', 'Referer': 'https://google.com' },
                    timeout: 5000,
                });

                if (res.data && res.data.length > 0) {
                    const first = res.data[0];
                    if (first.lat && first.lon) {
                        console.log(`✅ [${strat.name}] Found: "${name}" -> ${first.display_name.substring(0, 60)}...`);
                        return {
                            lat: parseFloat(first.lat),
                            lng: parseFloat(first.lon),
                        };
                    }
                }
            } catch (err) {
                // игнорируем и пробуем следующую стратегию
            }

            await new Promise((r) => setTimeout(r, 1000));
        }

        return null;
    }
}
