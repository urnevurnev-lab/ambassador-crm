import { Controller, Get, Post, Body } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('products')
export class ProductsController {
    constructor(private readonly prisma: PrismaService) { }

    @Post()
    async createProduct(@Body() data: { line: string; flavor: string; sku: string; category?: string }) {
        return this.prisma.product.create({
            data: {
                line: data.line,
                flavor: data.flavor,
                sku: data.sku,
                category: data.category || 'UNKNOWN',
            },
        });
    }

    @Get()
    async getProducts() {
        return this.prisma.product.findMany();
    }
}
