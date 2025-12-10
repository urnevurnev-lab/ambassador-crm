import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

@Injectable()
export class GeocodingService {
    private readonly logger = new Logger(GeocodingService.name);

    constructor(private readonly prisma: PrismaService) {}

    async getGeocodingStats() {
        const total = await this.prisma.facility.count();
        
        // ИСПРАВЛЕНИЕ ЗДЕСЬ: Используем AND для двух условий "не null" и "не 0"
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
        
        const stats = { total, geocoded, pending };
        // this.logger.log(`STATS: Total: ${total} | Done: ${geocoded} | Pending: ${pending}`);
        return stats;
    }

    async geocodeMissingFacilities() {
        this.logger.log('Starting SMART geocoding...');
        
        // Берем точки без координат (batches of 50)
        const facilities = await this.prisma.facility.findMany({
            where: {
                OR: [
                    { lat: null },
                    { lat: 0 },
                ],
            },
            take: 50, 
        });

        console.log(`Found ${facilities.length} facilities to geocode`);
        let updated = 0;

        for (const facility of facilities) {
            try {
                // Умный поиск: "Название + Адрес"
                // Если адрес слишком короткий, пропускаем
                if (!facility.address || facility.address.length < 3) {
                    console.log(`Skipping invalid address: ${facility.name}`);
                    continue;
                }

                const query = `${facility.name} ${facility.address}`;
                const encodedQuery = encodeURIComponent(query);
                
                // Запрос к Nominatim (OpenStreetMap)
                const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`, {
                    headers: { 
                        'User-Agent': 'AmbassadorCRM/1.0',
                        'Referer': 'https://google.com',
                    },
                    timeout: 10000,
                });

                const data = res.data;
                
                if (data && data.length > 0) {
                    const first = data[0];
                    if (first.lat && first.lon) {
                        await this.prisma.facility.update({
                            where: { id: facility.id },
                            data: {
                                lat: parseFloat(first.lat),
                                lng: parseFloat(first.lon),
                            },
                        });
                        updated++;
                        console.log(`✅ Geocoded: ${facility.name} -> [${first.lat}, ${first.lon}]`);
                    }
                } else {
                    console.warn(`❌ Not found: ${query}`);
                }

                // Пауза 1.5 сек, чтобы не забанили API
                await new Promise((r) => setTimeout(r, 1500));

            } catch (e: any) {
                console.error(`Error processing ${facility.id}: ${e.message}`);
                // Если ошибка сети (429/403), ждем дольше
                if (e?.response?.status === 429 || e?.response?.status === 403) {
                    console.warn('Rate limited. Waiting 5s...');
                    await new Promise((r) => setTimeout(r, 5000));
                }
            }
        }

        return { updated };
    }
}
