import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma.service';
import { GeocodingService } from '../facilities/geocoding.service';
import { FacilitiesModule } from '../facilities/facilities.module';
import { FacilitiesService } from '../facilities/facilities.service';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Module({
    imports: [FacilitiesModule, AuthModule],
    providers: [AdminService, PrismaService, GeocodingService, FacilitiesService, AdminAuthGuard],
    controllers: [AdminController],
})
export class AdminModule {}
