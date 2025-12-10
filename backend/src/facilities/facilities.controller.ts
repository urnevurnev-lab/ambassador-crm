import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { FacilitiesService } from './facilities.service';

@Controller('facilities')
export class FacilitiesController {
    constructor(private readonly facilitiesService: FacilitiesService) { }

    @Post()
    async createFacility(@Body() data: { name: string; address: string; city?: string; lat?: number; lng?: number; format?: string }) {
        const address = data.city ? `${data.city}, ${data.address}` : data.address;
        return this.facilitiesService.create({
            name: data.name,
            address,
            lat: data.lat !== undefined ? Number(data.lat) : null,
            lng: data.lng !== undefined ? Number(data.lng) : null,
            format: data.format,
        });
    }

    @Get()
    async getFacilities() {
        return this.facilitiesService.findAll();
    }

    @Patch(':id/geo')
    async updateFacilityGeo(@Param('id') id: string, @Body() data: { lat: number; lng: number }) {
        return this.facilitiesService.update(Number(id), {
            lat: Number(data.lat),
            lng: Number(data.lng),
        });
    }

    @Patch(':id/fix-location')
    async fixLocation(@Param('id') id: string, @Body() data: { lat: number; lng: number }) {
        return this.facilitiesService.update(Number(id), {
            lat: Number(data.lat),
            lng: Number(data.lng),
        });
    }

    @Get(':id')
    async getFacility(@Param('id') id: string) {
        const visitCount = await this.facilitiesService['prisma'].visit.count({ where: { facilityId: Number(id) } });
        console.log('DEBUG: Visits found for facility ' + id + ': ' + visitCount);
        return this.facilitiesService.findWithAnalytics(Number(id));
    }
}
