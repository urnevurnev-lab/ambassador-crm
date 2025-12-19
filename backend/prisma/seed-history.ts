import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const csv = require('csv-parser');

const prisma = new PrismaClient();

const COLUMN_NAMES = {
    TIMESTAMP: 'Отметка времени',
    AMBASSADOR: 'Амбассадор',
    FACILITY_NAME: 'Название заведения с Яндекс карты',
    FACILITY_ADDRESS: 'Адрес с Яндекс карты',
};

async function parseAndSeedHistory(): Promise<void> {
    return new Promise((resolve, reject) => {
        const filePath = path.join(__dirname, 'activity.csv');
        if (!fs.existsSync(filePath)) {
            console.error('❌ File not found:', filePath);
            reject(new Error('File not found'));
            return;
        }

        const results: any[] = [];
        console.log('🌱 Start seeding history...');

        fs.createReadStream(filePath)
            .pipe(csv({ separator: ',' })) // Changed to comma
            .on('data', (row: any) => results.push(row))
            .on('end', async () => {
                try {
                    let facilitiesCreated = 0;
                    let visitsCreated = 0;

                    for (const row of results) {
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
                                // Try DD.MM.YYYY
                                const [day, month, year] = datePart.split('.');
                                const [h, m, s] = timePart.split(':');
                                if (day && month && year) {
                                    date = new Date(Number(year), Number(month) - 1, Number(day), Number(h || 0), Number(m || 0), Number(s || 0));
                                } else {
                                    const isoDate = new Date(timestampStr);
                                    if (!isNaN(isoDate.getTime())) date = isoDate;
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
                                },
                            });
                            facilitiesCreated++;
                        }

                        await prisma.visit.create({
                            data: {
                                userId: user.id,
                                facilityId: facility.id,
                                createdAt: date,
                                type: 'CHECKUP',
                                status: 'COMPLETED'
                            },
                        });
                        visitsCreated++;

                        if (visitsCreated % 50 === 0) console.log(`Processed ${visitsCreated}...`);
                    }

                    console.log(`✅ History imported. Added ${facilitiesCreated} new facilities and ${visitsCreated} visits.`);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error: any) => {
                reject(error);
            });
    });
}

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
