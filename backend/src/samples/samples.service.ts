import { Injectable, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

interface CreateSampleOrderDto {
    items: { productId: number; quantity: number }[];
}

@Injectable()
export class SamplesService {
    constructor(private readonly prisma: PrismaService) { }

    async createOrder(userId: number, dto: CreateSampleOrderDto) {
        return this.prisma.sampleOrder.create({
            data: {
                userId,
                items: {
                    create: dto.items.map((i) => ({
                        productId: i.productId,
                        quantity: i.quantity,
                    })),
                },
            },
        });
    }

    // Analytics: Flavor Rating (ABC Analysis approximation)
    async getFlavorRating() {
        // Count total visits where products were available (i.e. present in facility)
        // This is complex if we rely on `productsAvailable` in `Visit`.
        // Simpler approach: Count how many Facilities have this product in `currentStock` (if we tracked it).
        // BUT current DB schema doesn't seem to persist "currentStock" directly in Facility model (it uses `mustList` json?).
        // Let's rely on Visits data: "productsAvailable" relation.

        // Count occurrence of each product in ALL visits (Global Rating)
        // Group by product, count visits.

        const rating = await this.prisma.product.findMany({
            include: {
                _count: {
                    select: { productsAvailableIn: true }
                }
            },
            orderBy: {
                productsAvailableIn: {
                    _count: 'desc'
                }
            },
            take: 50
        });

        // Group by Line
        const grouped = rating.reduce((acc, p) => {
            if (!acc[p.line]) acc[p.line] = [];
            acc[p.line].push({
                id: p.id,
                flavor: p.flavor,
                score: p._count.productsAvailableIn
            });
            return acc;
        }, {} as Record<string, any[]>);

        return grouped;
    }

    async exportToExcel(res: Response) {
        const orders = await this.prisma.sampleOrder.findMany({
            include: {
                user: true,
                items: {
                    include: { product: true }
                }
            },
            where: {
                status: 'PENDING' // Only export pending orders
            }
        });

        const workbook = new ExcelJS.Workbook();

        // 1. Aggregated Production Sheet
        const prodSheet = workbook.addWorksheet('Производство');
        prodSheet.columns = [
            { header: 'Линейка', key: 'line', width: 15 },
            { header: 'Вкус', key: 'flavor', width: 25 },
            { header: 'Кол-во (шт)', key: 'qty', width: 15 },
        ];

        // Aggregate items
        const aggMap = new Map<string, number>(); // Key: "Line|Flavor", Value: qty
        orders.forEach(o => {
            o.items.forEach(i => {
                const key = `${i.product.line}|${i.product.flavor}`;
                aggMap.set(key, (aggMap.get(key) || 0) + i.quantity);
            });
        });

        Array.from(aggMap.entries()).sort().forEach(([key, qty]) => {
            const [line, flavor] = key.split('|');
            prodSheet.addRow({ line, flavor, qty });
        });

        // 2. Individual User Sheets
        const userOrders = new Map<number, typeof orders>();
        orders.forEach(o => {
            if (!userOrders.has(o.userId)) userOrders.set(o.userId, []);
            userOrders.get(o.userId)?.push(o);
        });

        userOrders.forEach((userOrdersList, userId) => {
            const user = userOrdersList[0].user;
            const sheetName = user.fullName.substring(0, 30).replace(/[\\/*?:\[\]]/g, ''); // Validate sheet name
            const sheet = workbook.addWorksheet(sheetName);

            // User Info Header
            sheet.addRow([`Сотрудник: ${user.fullName}`]);
            sheet.addRow([`Футболка: ${user.tshirtSize || 'Не указан'}`]);
            sheet.addRow([`ДР: ${user.birthDate ? user.birthDate.toISOString().split('T')[0] : 'Не указан'}`]);

            const cdek = user.cdekInfo as any;
            if (cdek) {
                sheet.addRow([`СДЭК: ${cdek.city}, ${cdek.address}`]);
            } else {
                sheet.addRow(['СДЭК: Не указан']);
            }
            sheet.addRow([]); // Gap

            // Order Table
            sheet.addRow(['Линейка', 'Вкус', 'Кол-во']);

            // Consolidate user's multiple orders if any
            const userAgg = new Map<string, number>();
            userOrdersList.forEach(order => {
                order.items.forEach(i => {
                    const key = `${i.product.line}|${i.product.flavor}`;
                    userAgg.set(key, (userAgg.get(key) || 0) + i.quantity);
                });
            });

            Array.from(userAgg.entries()).sort().forEach(([key, qty]) => {
                const [line, flavor] = key.split('|');
                sheet.addRow([line, flavor, qty]);
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=samples_export.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    }
}
