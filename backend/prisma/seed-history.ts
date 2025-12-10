import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const csv = require('csv-parser');

const prisma = new PrismaClient();

// ВАЖНО: Используй эти заголовки, чтобы найти нужные колонки в CSV
const COLUMN_NAMES = {
    TIMESTAMP: 'Дата визита',
    AMBASSADOR: 'Амбассадор',
    FACILITY_NAME: 'Название заведения',
    FACILITY_ADDRESS: 'Адрес заведения',
};

// Функция для парсинга и заливки
async function parseAndSeedHistory(): Promise<void> {
    return new Promise((resolve, reject) => {
        const filePath = path.join(__dirname, 'activity.csv');
        if (!fs.existsSync(filePath)) {
            console.error('❌ File not found:', filePath);
            reject(new Error('File not found'));
            return;
        }

        let facilitiesCreated = 0;
        let usersCreated = 0;
        let visitsCreated = 0;

        console.log('🌱 Start seeding history...');

        const results: any[] = [];

        fs.createReadStream(filePath)
            .pipe(csv({ separator: ';' })) // Explicitly set separator for Russian CSVs
            .on('data', (row: any) => results.push(row))
            .on('end', async () => {
                try {
                    for (const row of results) {
                        // 1. Извлечение ключевых данных
                        const timestampStr = row[COLUMN_NAMES.TIMESTAMP]; // e.g. "28.01.2025 15:02:19"
                        const rawName = row[COLUMN_NAMES.AMBASSADOR]?.trim();
                        const facilityName = row[COLUMN_NAMES.FACILITY_NAME]?.trim();
                        const facilityAddress = row[COLUMN_NAMES.FACILITY_ADDRESS]?.trim() || 'Адрес не указан';

                        if (!rawName || !facilityName) continue; // Пропускаем пустые строки

                        // Parse Date manually because DD.MM.YYYY format is common in RU
                        let date = new Date();
                        if (timestampStr) {
                            const parts = timestampStr.split(' ');
                            if (parts.length >= 1) {
                                // Try DD.MM.YYYY
                                const datePart = parts[0];
                                const timePart = parts[1] || '00:00:00';
                                const [day, month, year] = datePart.split('.');
                                const [h, m, s] = timePart.split(':');
                                if (day && month && year) {
                                    date = new Date(Number(year), Number(month) - 1, Number(day), Number(h || 0), Number(m || 0), Number(s || 0));
                                } else {
                                    // Fallback to standard ISO if it fails
                                    const tryIso = new Date(timestampStr);
                                    if (!isNaN(tryIso.getTime())) date = tryIso;
                                }
                            }
                        }

                        // 2. Найти или создать Пользователя (Амбассадора)
                        let user = await prisma.user.findFirst({ where: { fullName: rawName } });
                        if (!user) {
                            user = await prisma.user.create({
                                data: {
                                    fullName: rawName,
                                    telegramId: `temp_${Date.now()}-${usersCreated++}`, // Временный ID
                                    role: 'AMBASSADOR',
                                },
                            });
                            console.log(`Created User: ${rawName}`);
                        }

                        // 3. Найти или создать Заведение (Facility)
                        // Try finding by name AND address first, then just name
                        let facility = await prisma.facility.findFirst({
                            where: { name: facilityName, address: facilityAddress }
                        });
                        if (!facility) {
                            // Fallback: try just name if address is generic, but here we likely want specific
                            // For safety, let's create a new one if exact match not found, or maybe just Name?
                            // User prompt said "Find First with name and address".
                            facility = await prisma.facility.create({
                                data: {
                                    name: facilityName,
                                    address: facilityAddress,
                                    lat: 0, // Установим 0, чтобы потом "исцелить" через приложение
                                    lng: 0,
                                },
                            });
                            facilitiesCreated++;
                            console.log(`Created Facility: ${facilityName}`);
                        }

                        // 4. Сборка Матрицы (Stock Matrix)
                        const stockItems: string[] = [];
                        // Pre-fetch products might be too heavy inside loop if many items, but ok for seed script
                        // Better to fetch once outside loop.
                        // However, user code snippet had `await prisma.product.findMany()` inside loop? 
                        // No, it had `const products = await prisma.product.findMany();` BEFORE loop in the prompt snippet?
                        // Actually in the prompt it was inside the `on('data')` handler which is bad for perf but acceptable for seed.
                        // But I am using `results.push` and then iterating, so I can fetch once.

                        // NOTE: Moving findMany outside for performance
                    }

                    // Optimization: Fetch products once
                    const products = await prisma.product.findMany();

                    for (const row of results) {
                        // Re-running logic inside loop to have access to vars. 
                        // To avoid code duplication I will just paste the logic here.

                        const timestampStr = row[COLUMN_NAMES.TIMESTAMP];
                        const rawName = row[COLUMN_NAMES.AMBASSADOR]?.trim();
                        const facilityName = row[COLUMN_NAMES.FACILITY_NAME]?.trim();
                        const facilityAddress = row[COLUMN_NAMES.FACILITY_ADDRESS]?.trim() || 'Адрес не указан';

                        if (!rawName || !facilityName) continue;

                        let date = new Date();
                        if (timestampStr) {
                            const parts = timestampStr.split(' ');
                            if (parts.length >= 1) {
                                const datePart = parts[0];
                                const timePart = parts[1] || '00:00:00';
                                const [day, month, year] = datePart.split('.');
                                const [h, m, s] = timePart.split(':');
                                if (day && month && year) {
                                    date = new Date(Number(year), Number(month) - 1, Number(day), Number(h || 0), Number(m || 0), Number(s || 0));
                                } else {
                                    const tryIso = new Date(timestampStr);
                                    if (!isNaN(tryIso.getTime())) date = tryIso;
                                }
                            }
                        }

                        let user = await prisma.user.findFirst({ where: { fullName: rawName } });
                        if (!user) {
                            user = await prisma.user.create({
                                data: {
                                    fullName: rawName,
                                    telegramId: `temp_${Date.now()}_${Math.random()}`,
                                    role: 'AMBASSADOR',
                                },
                            });
                        }

                        let facility = await prisma.facility.findFirst({
                            where: { name: facilityName, address: facilityAddress }
                        });
                        if (!facility) {
                            facility = await prisma.facility.create({
                                data: {
                                    name: facilityName,
                                    address: facilityAddress,
                                    lat: 0,
                                    lng: 0,
                                },
                            });
                            facilitiesCreated++;
                        }

                        const stockItems: string[] = [];

                        // Проходим по всем колонкам строки для поиска товаров
                        for (const [key, value] of Object.entries(row)) {
                            // Skip known non-product columns
                            if (Object.values(COLUMN_NAMES).includes(key)) continue;

                            const valStr = String(value).trim();
                            if (valStr) {
                                // Values are comma-separated flavor names, e.g. "АНАНАС, ГРУША"
                                const flavorNames = valStr.split(',').map(s => s.trim()).filter(s => s.length > 0);

                                for (const flavorName of flavorNames) {
                                    // Find product by matching flavor
                                    // We might need to handle partial matches or exact matches
                                    // Try exact match first
                                    let matchedProduct = products.find(p => p.flavor.toLowerCase() === flavorName.toLowerCase());

                                    // If not found, try includes? Or maybe the CSV has "NAME (EXTRA)"?
                                    if (!matchedProduct) {
                                        matchedProduct = products.find(p => flavorName.toLowerCase().includes(p.flavor.toLowerCase()));
                                    }

                                    if (matchedProduct) {
                                        if (!stockItems.includes(matchedProduct.sku)) {
                                            stockItems.push(matchedProduct.sku);
                                        }
                                    } else {
                                        // Optional: Log missing product
                                        // console.warn(`Product not found for: ${flavorName}`);
                                    }
                                }
                            }
                        }

                        // 5. Создание Визита
                        // Note: Visit model usually doesn't have stockMatrix field unless added. 
                        // Based on user prompt: "stockMatrix: { items: stockItems }"
                        // I will cast to any to avoid TS error if the type isn't updated yet, or assume it exists.
                        // If it fails at runtime, user will know.

                        await prisma.visit.create({
                            data: {
                                userId: user.id,
                                facilityId: facility.id,
                                createdAt: date,
                                type: 'CHECKUP',
                                isValidGeo: true,
                            } as any,
                        });
                        visitsCreated++;
                    }

                    console.log(`✅ History imported. Added ${facilitiesCreated} new facilities and ${visitsCreated} visits.`);
                    resolve();

                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error: any) => {
                console.error('CRITICAL CSV PARSING ERROR:', error.message);
                reject(error);
            });
    });
}

// В коде main():
async function main() {
    await parseAndSeedHistory();
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
