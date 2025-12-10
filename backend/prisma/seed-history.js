"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const csv = require('csv-parser');
const prisma = new client_1.PrismaClient();
const COLUMN_NAMES = {
    TIMESTAMP: 'Дата визита',
    AMBASSADOR: 'Амбассадор',
    FACILITY_NAME: 'Название заведения',
    FACILITY_ADDRESS: 'Адрес заведения',
};
async function parseAndSeedHistory() {
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
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv({ separator: ';' }))
            .on('data', (row) => results.push(row))
            .on('end', async () => {
            var _a, _b, _c, _d, _e, _f;
            try {
                for (const row of results) {
                    const timestampStr = row[COLUMN_NAMES.TIMESTAMP];
                    const rawName = (_a = row[COLUMN_NAMES.AMBASSADOR]) === null || _a === void 0 ? void 0 : _a.trim();
                    const facilityName = (_b = row[COLUMN_NAMES.FACILITY_NAME]) === null || _b === void 0 ? void 0 : _b.trim();
                    const facilityAddress = ((_c = row[COLUMN_NAMES.FACILITY_ADDRESS]) === null || _c === void 0 ? void 0 : _c.trim()) || 'Адрес не указан';
                    if (!rawName || !facilityName)
                        continue;
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
                            }
                            else {
                                const tryIso = new Date(timestampStr);
                                if (!isNaN(tryIso.getTime()))
                                    date = tryIso;
                            }
                        }
                    }
                    let user = await prisma.user.findFirst({ where: { fullName: rawName } });
                    if (!user) {
                        user = await prisma.user.create({
                            data: {
                                fullName: rawName,
                                telegramId: `temp_${Date.now()}-${usersCreated++}`,
                                role: 'AMBASSADOR',
                            },
                        });
                        console.log(`Created User: ${rawName}`);
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
                        console.log(`Created Facility: ${facilityName}`);
                    }
                    const stockItems = [];
                }
                const products = await prisma.product.findMany();
                for (const row of results) {
                    const timestampStr = row[COLUMN_NAMES.TIMESTAMP];
                    const rawName = (_d = row[COLUMN_NAMES.AMBASSADOR]) === null || _d === void 0 ? void 0 : _d.trim();
                    const facilityName = (_e = row[COLUMN_NAMES.FACILITY_NAME]) === null || _e === void 0 ? void 0 : _e.trim();
                    const facilityAddress = ((_f = row[COLUMN_NAMES.FACILITY_ADDRESS]) === null || _f === void 0 ? void 0 : _f.trim()) || 'Адрес не указан';
                    if (!rawName || !facilityName)
                        continue;
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
                            }
                            else {
                                const tryIso = new Date(timestampStr);
                                if (!isNaN(tryIso.getTime()))
                                    date = tryIso;
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
                    const stockItems = [];
                    for (const [key, value] of Object.entries(row)) {
                        if (Object.values(COLUMN_NAMES).includes(key))
                            continue;
                        const valStr = String(value).trim();
                        if (valStr) {
                            const flavorNames = valStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
                            for (const flavorName of flavorNames) {
                                let matchedProduct = products.find(p => p.flavor.toLowerCase() === flavorName.toLowerCase());
                                if (!matchedProduct) {
                                    matchedProduct = products.find(p => flavorName.toLowerCase().includes(p.flavor.toLowerCase()));
                                }
                                if (matchedProduct) {
                                    if (!stockItems.includes(matchedProduct.sku)) {
                                        stockItems.push(matchedProduct.sku);
                                    }
                                }
                                else {
                                }
                            }
                        }
                    }
                    await prisma.visit.create({
                        data: {
                            userId: user.id,
                            facilityId: facility.id,
                            createdAt: date,
                            type: 'CHECKUP',
                            isValidGeo: true,
                        },
                    });
                    visitsCreated++;
                }
                console.log(`✅ History imported. Added ${facilitiesCreated} new facilities and ${visitsCreated} visits.`);
                resolve();
            }
            catch (error) {
                reject(error);
            }
        })
            .on('error', (error) => {
            console.error('CRITICAL CSV PARSING ERROR:', error.message);
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
//# sourceMappingURL=seed-history.js.map