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
                activity: true,
            },
            orderBy: { date: 'desc' }
        });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Визиты');

        sheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Дата', key: 'date', width: 15 },
            { header: 'Сотрудник', key: 'user', width: 25 },
            { header: 'Точка', key: 'facility', width: 25 },
            { header: 'Адрес', key: 'address', width: 30 },
            { header: 'Тип активности', key: 'type', width: 20 },
            { header: 'Комментарий', key: 'comment', width: 30 },
            { header: 'Гео-статус', key: 'geo', width: 15 },
            { header: 'Данные (JSON)', key: 'data', width: 50 },
        ];

        visits.forEach(v => {
            // Flatten JSON data into a string for overview
            const dataStr = v.data ? JSON.stringify(v.data, null, 2) : '';

            sheet.addRow({
                id: v.id,
                date: new Date(v.date).toLocaleDateString() + ' ' + new Date(v.date).toLocaleTimeString(),
                user: v.user?.fullName || 'N/A',
                facility: v.facility?.name || 'N/A',
                address: v.facility?.address || '',
                type: v.activity?.name || v.type, // Use activity name if available
                comment: v.comment,
                geo: v.isSuspicious ? '❌ Далеко' : (v.isValidGeo ? '✅ ОК' : '❓ Неизвестно'),
                data: dataStr
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=visits_report.xlsx');

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
