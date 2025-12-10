import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

@Injectable()
export class GeocodingService {
    private readonly logger = new Logger(GeocodingService.name);

    constructor(private readonly prisma: PrismaService) {}

    async getGeocodingStats() {
        const total = await this.prisma.facility.count();
        const geocoded = await this.prisma.facility.count({
            where: {
                lat: {
                    not: null,
                },
            },
        });
        const pending = await this.prisma.facility.count({
            where: {
                OR: [
                    { lat: null },
                    { lat: { equals: 0 } },
                ],
            },
        });
        const stats = { total, geocoded, pending };
        this.logger.log(`STATS: Total: ${total} | Done: ${geocoded} | Pending: ${pending}`);
        return stats;
    }

    async geocodeMissingFacilities() {
        console.log('Starting geocoding...');
        const stats = await this.getGeocodingStats();

        let facilities = [];
        try {
            facilities = await this.prisma.facility.findMany({
                where: {
                    OR: [
                        { lat: null },
                        { lat: { equals: 0 } },
                    ],
                },
                take: 1000,
            });
        } catch (err: any) {
            this.logger.error(`Failed to fetch facilities: ${err.message}`);
            return { updated: 0, error: err.message };
        }

        console.log('Found ' + facilities.length + ' facilities to geocode');
        let updated = 0;

        for (const facility of facilities) {
            try {
                const query = encodeURIComponent(`${facility.address || ''}`);
                const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`, {
                    headers: { 
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': 'https://google.com',
                    },
                    timeout: 10000,
                });
                const [first] = res.data || [];
                if (first && first.lat && first.lon) {
                    await this.prisma.facility.update({
                        where: { id: facility.id },
                        data: {
                            lat: parseFloat(first.lat),
                            lng: parseFloat(first.lon),
                        },
                    });
                    updated++;
                    console.log('Updated: ' + facility.address);
                }
                await new Promise((r) => setTimeout(r, 1000));
            } catch (e: any) {
                console.warn(`Geocoding failed for facility ${facility.id}: ${e.message}`);
                const status = e?.response?.status;
                if (status === 429 || status === 403) {
                    await new Promise((r) => setTimeout(r, 5000));
                } else {
                    await new Promise((r) => setTimeout(r, 1000));
                }
            }
        }

        return { updated, stats };
    }
}
