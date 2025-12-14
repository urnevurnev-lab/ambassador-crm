import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
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
    async getProducts(@Query('line') line?: string, @Query('category') category?: string) {
        return this.prisma.product.findMany({
            where: {
                ...(line ? { line } : {}),
                ...(category ? { category } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    @Patch(':id')
    async updateProduct(
        @Param('id') id: string,
        @Body() data: Partial<{ line: string; flavor: string; sku: string; category: string }>
    ) {
        return this.prisma.product.update({
            where: { id: Number(id) },
            data,
        });
    }

    @Delete(':id')
    async deleteProduct(@Param('id') id: string) {
        return this.prisma.product.delete({ where: { id: Number(id) } });
    }
}
