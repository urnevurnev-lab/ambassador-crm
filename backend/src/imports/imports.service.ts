import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class ImportsService {
    constructor(private readonly prisma: PrismaService) { }

    private clean(str: any): string {
        if (!str) return '';
        return String(str).trim();
    }

    // Генерация SKU: Bliss + Ананас -> bliss_ananas
    private generateSku(line: string, flavor: string): string {
        const translit = (str: string) => {
            const ru = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya' };
            return str.toLowerCase().split('').map(char => ru[char] || char).join('').replace(/[^a-z0-9]/g, '_');
        };
        return `${translit(line)}_${translit(flavor)}`;
    }

    // "Умная" функция для исправления перепутанных имени и адреса
    private fixNameAndAddress(name: string, address: string): { finalName: string, finalAddress: string } {
        let n = name;
        let a = address;
        if (n.length > 40 && n.includes(',') && (!a || a.length < n.length)) {
            const temp = n;
            n = a || 'Unknown Name';
            a = temp;
        }
        return { finalName: n, finalAddress: a };
    }

    async importExcel(buffer: Buffer) {
        const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        console.log(`🚀 Starting Full Import (Visits + Products). Rows: ${rows.length}`);
        let successCount = 0;

        // Карта индексов колонок в Excel (начинаем с 0)
        // G(6)=Category, H(7)=Bliss, I(8)=White, J(9)=Black, K(10)=Cigar
        const PRODUCT_COLUMNS = [
            { idx: 7, line: 'Bliss' },
            { idx: 8, line: 'White Line' },
            { idx: 9, line: 'Black Line' },
            { idx: 10, line: 'Cigar Line' }
        ];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];

            try {
                // 1. Базовый парсинг
                const rawDate = row[0];
                const ambassadorName = this.clean(row[1]);
                const activityType = this.clean(row[2]);
                let facilityName = this.clean(row[3]);
                let facilityAddress = this.clean(row[4]);

                if (!ambassadorName && !facilityName) continue;

                // 2. Дата
                let visitDate = new Date();
                if (rawDate instanceof Date) visitDate = rawDate;
                else if (typeof rawDate === 'string') {
                    const parsed = new Date(rawDate);
                    if (!isNaN(parsed.getTime())) visitDate = parsed;
                }

                // 3. User
                let user = await this.prisma.user.findFirst({ where: { fullName: ambassadorName } });
                if (!user) {
                    user = await this.prisma.user.create({
                        data: { fullName: ambassadorName, telegramId: `import_${Date.now()}_${i}`, role: 'AMBASSADOR' }
                    });
                }

                // 4. Facility
                if (!facilityName) {
                    if (activityType) { facilityName = `Активность: ${activityType}`; facilityAddress = 'Адрес не указан'; }
                    else continue;
                }
                const { finalName, finalAddress } = this.fixNameAndAddress(facilityName, facilityAddress);

                let facility = await this.prisma.facility.findFirst({
                    where: { name: finalName, ...(finalAddress ? { address: finalAddress } : {}) }
                });

                if (!facility) {
                    facility = await this.prisma.facility.create({
                        data: { name: finalName, address: finalAddress || '' }
                    });
                }

                // 5. Visit Creation
                const visit = await this.prisma.visit.create({
                    data: {
                        userId: user.id,
                        facilityId: facility.id,
                        type: activityType || 'VISIT',
                        date: visitDate,
                    }
                });

                // 6. ОБРАБОТКА ПРОДУКТОВ (ГЛАВНОЕ ИЗМЕНЕНИЕ)
                const productIdsToConnect: number[] = [];

                for (const col of PRODUCT_COLUMNS) {
                    const cellValue = this.clean(row[col.idx]); // Например: "АНАНАС, ГРУША"
                    if (!cellValue) continue;

                    // Разбиваем по запятым
                    const flavors = cellValue.split(',').map(f => f.trim()).filter(f => f.length > 0);

                    for (const flavor of flavors) {
                        const sku = this.generateSku(col.line, flavor); // Генерируем уникальный SKU

                        // Ищем или создаем Продукт
                        let product = await this.prisma.product.findUnique({ where: { sku } });

                        if (!product) {
                            // Если вкус новый - создаем
                            product = await this.prisma.product.create({
                                data: {
                                    line: col.line,
                                    flavor: flavor.toUpperCase(), // Храним в верхнем регистре для порядка
                                    sku: sku,
                                    category: 'TOBACCO'
                                }
                            });
                            console.log(`   + New Product: ${col.line} - ${flavor}`);
                        }
                        productIdsToConnect.push(product.id);
                    }
                }

                // 7. Связываем продукты с визитом
                if (productIdsToConnect.length > 0) {
                    await this.prisma.visit.update({
                        where: { id: visit.id },
                        data: {
                            productsAvailable: {
                                connect: productIdsToConnect.map(id => ({ id }))
                            }
                        }
                    });
                }

                successCount++;

            } catch (e) {
                console.error(`Row ${i + 1} Error:`, e.message);
            }
        }

        console.log(`✅ Import Finished. Visits created: ${successCount}`);
        return { successCount };
    }
}
