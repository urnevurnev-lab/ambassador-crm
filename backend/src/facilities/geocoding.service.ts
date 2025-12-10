import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

@Injectable()
export class GeocodingService {
    private readonly logger = new Logger(GeocodingService.name);

    constructor(private readonly prisma: PrismaService) {}

    async getGeocodingStats() {
        const total = await this.prisma.facility.count();
        const geocoded = await this.prisma.facility.count({ where: { lat: { not: null, not: 0 } } });
        const pending = await this.prisma.facility.count({ where: { OR: [{ lat: null }, { lat: 0 }] } });
        return { total, geocoded, pending };
    }

    async geocodeMissingFacilities() {
        this.logger.log('Starting SMART geocoding...');
        
        // Берем точки без координат
        const facilities = await this.prisma.facility.findMany({
            where: { OR: [{ lat: null }, { lat: 0 }] },
            take: 50,
        });

        console.log(`Found ${facilities.length} facilities to geocode`);
        let updated = 0;

        for (const facility of facilities) {
            try {
                // УМНЫЙ ЗАПРОС: Пробуем "Название + Адрес"
                let query = `${facility.name} ${facility.address}`;

                if (!facility.address || facility.address.length < 5) {
                    console.log(`Skipping invalid address: ${facility.name}`);
                    continue;
                }

                const encodedQuery = encodeURIComponent(query);

                const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`, {
                    headers: { 
                        'User-Agent': 'AmbassadorCRM/1.0',
                        'Referer': 'https://telegram-app.com',
                    },
                    timeout: 5000,
                });

                const data = res.data;
                
                if (data && data.length > 0) {
                    const first = data[0];
                    await this.prisma.facility.update({
                        where: { id: facility.id },
                        data: {
                            lat: parseFloat(first.lat),
                            lng: parseFloat(first.lon),
                        },
                    });
                    updated++;
                    console.log(`✅ Geocoded: ${facility.name} -> ${first.display_name}`);
                } else {
                    console.warn(`❌ Not found: ${query}. Trying address only...`);
                }

                await new Promise((r) => setTimeout(r, 1500));

            } catch (e: any) {
                console.error(`Error processing ${facility.id}: ${e.message}`);
            }
        }

        return { updated };
    }
}
