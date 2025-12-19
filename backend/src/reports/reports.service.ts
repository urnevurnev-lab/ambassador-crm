import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) { }

    async generateVisitsReport(res: Response) {
        const visits = await this.prisma.visit.findMany({
            include: {
                user: true,
                facility: true,
            },
            orderBy: { date: 'desc' }
        });

        const workbook = new ExcelJS.Workbook();

        // 1. ПОДРОБНЫЙ ЖУРНАЛ
        const sheet = workbook.addWorksheet('Журнал Визитов');
        sheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Дата', key: 'date', width: 15 },
            { header: 'Сотрудник', key: 'user', width: 25 },
            { header: 'Точка', key: 'facility', width: 25 },
            { header: 'Тип', key: 'type', width: 20 },
            { header: 'Продажи (шт)', key: 'sales', width: 12 },
            { header: 'Гости (чел)', key: 'guests', width: 12 },
            { header: 'B2B Контакт', key: 'b2b', width: 25 },
            { header: 'Комментарий', key: 'comment', width: 30 },
            { header: 'Сырые данные', key: 'raw', width: 50 },
        ];

        visits.forEach(v => {
            const sData = (v.data || {}) as any;

            sheet.addRow({
                id: v.id,
                date: new Date(v.date).toLocaleString('ru-RU'),
                user: v.user?.fullName || 'N/A',
                facility: v.facility?.name || 'N/A',
                type: v.type,
                sales: sData.shift?.cups || 0,
                guests: sData.guests?.length || 0,
                b2b: sData.b2bContact?.name || '',
                comment: sData.comment || v.comment || '',
                raw: JSON.stringify(sData),
            });
        });

        // 2. СВОДНАЯ ПО СОТРУДНИКАМ
        const summarySheet = workbook.addWorksheet('Сводка по Амбассадорам');
        summarySheet.columns = [
            { header: 'ФИО Сотрудника', key: 'name', width: 30 },
            { header: 'Всего активностей', key: 'total', width: 20 },
            { header: 'Продажи (суммарно)', key: 'totalSales', width: 20 },
            { header: 'Дегустации', key: 'tastings', width: 15 },
            { header: 'B2B Встречи', key: 'b2b', width: 15 },
            { header: 'Проезд/Чек-ин', key: 'transit', width: 15 },
        ];

        // Aggregate by user
        const userStats = new Map<number, any>();
        visits.forEach(v => {
            if (!v.user) return;
            const userId = v.user.id;
            if (!userStats.has(userId)) {
                userStats.set(userId, {
                    name: v.user.fullName, total: 0, totalSales: 0,
                    tastings: 0, b2b: 0, transit: 0, checkup: 0
                });
            }
            const stat = userStats.get(userId);
            stat.total++;
            const sData = (v.data || {}) as any;
            if (v.type === 'checkup') {
                stat.totalSales += Number(sData.shift?.cups || 0);
                stat.checkup++;
            }
            if (v.type === 'tasting') stat.tastings++;
            if (v.type === 'b2b') stat.b2b++;
            if (v.type === 'transit') stat.transit++;
        });

        Array.from(userStats.values()).forEach(s => {
            summarySheet.addRow(s);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=activity_report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    }

    async generateOrdersReport(res: Response) {
        const orders = await this.prisma.order.findMany({
            include: {
                user: true,
                facility: true,
                distributor: true, // Assuming relation exists
                items: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Заказы');

        sheet.columns = [
            { header: 'ID Заказа', key: 'id', width: 10 },
            { header: 'Дата', key: 'date', width: 15 },
            { header: 'Статус', key: 'status', width: 15 },
            { header: 'Сотрудник', key: 'user', width: 20 },
            { header: 'Точка', key: 'facility', width: 25 },
            { header: 'Дистрибьютор', key: 'distributor', width: 25 },
            { header: 'Товары', key: 'items', width: 50 },
            { header: 'Сумма (шт)', key: 'quantity', width: 15 },
        ];

        orders.forEach(o => {
            const itemsStr = o.items.map(i => `${i.product?.sku || 'SKU?'} (${i.quantity})`).join(', ');
            const totalQty = o.items.reduce((acc, i) => acc + i.quantity, 0);

            let statusLabel = 'Новый';
            if (o.status === 'SHIPPED') statusLabel = '✅ Отгружен';
            if (o.status === 'REJECTED') statusLabel = '❌ Отменен';

            sheet.addRow({
                id: o.id,
                date: new Date(o.createdAt).toLocaleDateString(),
                status: statusLabel,
                user: o.user?.fullName || 'N/A',
                facility: o.facility?.name || 'N/A',
                distributor: o.distributor?.name || 'N/A',
                items: itemsStr,
                quantity: totalQty
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=orders_report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    }
}
