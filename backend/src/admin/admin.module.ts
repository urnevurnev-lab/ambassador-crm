import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma.service';
import { GeocodingService } from '../facilities/geocoding.service';
import { FacilitiesModule } from '../facilities/facilities.module';
import { FacilitiesService } from '../facilities/facilities.service';

@Module({
    imports: [FacilitiesModule],
    providers: [AdminService, PrismaService, GeocodingService, FacilitiesService],
    controllers: [AdminController],
})
export class AdminModule {}
