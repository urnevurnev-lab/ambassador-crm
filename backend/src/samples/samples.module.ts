import { Module } from '@nestjs/common';
import { SamplesController } from './samples.controller';
import { SamplesService } from './samples.service';
import { PrismaService } from '../prisma.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  controllers: [SamplesController],
  providers: [SamplesService, PrismaService]
})
export class SamplesModule { }
