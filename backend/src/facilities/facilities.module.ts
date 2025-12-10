import { Module } from '@nestjs/common';
import { FacilitiesService } from './facilities.service';
import { FacilitiesController } from './facilities.controller';
import { PrismaService } from '../prisma.service';
import { GeocodingService } from './geocoding.service';

@Module({
    controllers: [FacilitiesController],
    providers: [FacilitiesService, PrismaService, GeocodingService],
    exports: [FacilitiesService, GeocodingService],
})
export class FacilitiesModule { }
