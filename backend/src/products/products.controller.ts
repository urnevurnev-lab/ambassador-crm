import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('products')
export class ProductsController {
    constructor(private readonly prisma: PrismaService) { }

    // 1. Создание (добавили price)
    @Post()
    async createProduct(@Body() data: { line: string; flavor: string; sku: string; category?: string; isTopFlavor?: boolean; price?: number }) {
        return this.prisma.product.create({
            data: {
                line: data.line,
                flavor: data.flavor,
                sku: data.sku,
                category: data.category || 'UNKNOWN',
                isTopFlavor: data.isTopFlavor || false,
                price: data.price ? Number(data.price) : 0,
            },
        });
    }

    // 2. Получение списка
    @Get()
    async getProducts(@Query('line') line?: string, @Query('category') category?: string) {
        return this.prisma.product.findMany({
            where: {
                ...(line ? { line } : {}),
                ...(category ? { category } : {}),
            },
            orderBy: [{ isTopFlavor: 'desc' }, { line: 'asc' }, { flavor: 'asc' }],
        });
    }

    // 3. НОВЫЙ МЕТОД: Массовое обновление цены для линейки
    @Post('lines/update-price')
    async updateLinePrice(@Body() data: { line: string; price: number }) {
        // Обновляем ВСЕ товары этой линейки
        return this.prisma.product.updateMany({
            where: { line: data.line },
            data: { price: Number(data.price) },
        });
    }

    // 4. Обновление одного товара (добавили price)
    @Patch(':id')
    async updateProduct(
        @Param('id') id: string,
        @Body() data: Partial<{ line: string; flavor: string; sku: string; category: string; isTopFlavor: boolean; price: number }>
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
