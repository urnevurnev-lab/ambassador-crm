import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { FacilitiesService } from './facilities.service';

@Controller('facilities')
export class FacilitiesController {
    constructor(private readonly facilitiesService: FacilitiesService) { }

    @Post()
    async createFacility(@Body() data: { name: string; address: string; city?: string; format?: string; requiredProducts?: number[] }) {
        const address = data.city ? `${data.city}, ${data.address}` : data.address;
        return this.facilitiesService.create({
            name: data.name,
            address,
            requiredProducts: data.requiredProducts ?? [],
        });
    }

    @Get()
    async getFacilities() {
        return this.facilitiesService.findAll();
    }

    @Patch(':id')
    async updateFacility(@Param('id') id: string, @Body() data: any) {
        // Позволяем менять прочие поля; числа приводим явно если они есть
        const prepared = { ...data };
        if (prepared.lat !== undefined) prepared.lat = Number(prepared.lat);
        if (prepared.lng !== undefined) prepared.lng = Number(prepared.lng);
        return this.facilitiesService.update(Number(id), prepared);
    }

    @Get(':id')
    async getFacility(@Param('id') id: string) {
        return this.facilitiesService.findWithAnalytics(Number(id));
    }
}
