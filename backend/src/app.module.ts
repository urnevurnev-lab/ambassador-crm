import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UsersController } from './users/users.controller';
import { VisitsController } from './visits/visits.controller';
import { ProductsController } from './products/products.controller';
import { DistributorsController } from './distributors/distributors.controller';
import { FacilitiesModule } from './facilities/facilities.module';
import { OrderModule } from './orders/order.module';
import { TelegramModule } from './telegram/telegram.module';
import { ImportsModule } from './imports/imports.module';
import { AdminModule } from './admin/admin.module';
import { ActivitiesController } from './activities/activities.controller';
import { AuthModule } from './auth/auth.module';
import { PostsController } from './posts/posts.controller';
import { SamplesModule } from './samples/samples.module';

@Module({
    imports: [OrderModule, FacilitiesModule, TelegramModule, ImportsModule, AdminModule, AuthModule, SamplesModule],
    controllers: [UsersController, VisitsController, ProductsController, DistributorsController, ActivitiesController, PostsController],
    providers: [PrismaService],
})
export class AppModule { }
