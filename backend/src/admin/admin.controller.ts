import { Controller, HttpCode, Post, Res } from '@nestjs/common';
import { AdminService } from './admin.service';
import { FacilitiesService } from '../facilities/facilities.service';
import { Delete } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { Response } from 'express';

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

    @Get('stats')
    async getStats() {
        return this.adminService.getDashboardStats();
    }

    @Post('clean-db')
    @HttpCode(200)
    async cleanDb() {
        return this.adminService.cleanDatabase();
    }

    @Get('export/visits')
    async exportVisits(@Res() res: Response) {
        const buffer = await this.adminService.exportVisitsExcel();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="visits.xlsx"');
        return res.send(buffer);
    }
}
