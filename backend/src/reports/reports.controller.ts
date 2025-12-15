import { Controller, Get, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('visits')
    async downloadVisitsReport(@Res() res: Response) {
        return this.reportsService.generateVisitsReport(res);
    }

    @Get('orders')
    async downloadOrdersReport(@Res() res: Response) {
        return this.reportsService.generateOrdersReport(res);
    }
}
