import { Controller, HttpCode, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { FacilitiesService } from '../facilities/facilities.service';
import { Delete } from '@nestjs/common';

@Controller(['api/admin', 'admin'])
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly facilitiesService: FacilitiesService,
    ) {}

    @Delete('reset')
    @HttpCode(200)
    async reset() {
        return this.adminService.resetDatabase();
    }

    @Post('geocode')
    @HttpCode(200)
    async geocode() {
        return this.adminService.geocode();
    }

    @Post('create-distributor')
    @HttpCode(200)
    async createDistributor() {
        return this.adminService.createMainDistributor();
    }

    @Post('merge-duplicates')
    @HttpCode(200)
    async mergeDuplicates() {
        return this.facilitiesService.mergeDuplicates();
    }

    @Post('smart-merge')
    @HttpCode(200)
    async smartMerge() {
        return this.facilitiesService.smartMergeByVisits();
    }
}
