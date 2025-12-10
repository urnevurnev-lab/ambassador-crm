import { Module } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { ImportsController } from './imports.controller';
import { PrismaService } from '../prisma.service';

@Module({
    providers: [ImportsService, PrismaService],
    controllers: [ImportsController],
})
export class ImportsModule {}
