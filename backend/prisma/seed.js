"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    var _a, _b;
    console.log('🌱 Seeding base data...');
    const chatId = '-1003288508767';
    const facility = await prisma.facility.findFirst({ where: { name: 'Demo Bar' } });
    const facilityRecord = facility !== null && facility !== void 0 ? facility : await prisma.facility.create({
        data: {
            name: 'Demo Bar',
            address: '123 Test Street, Moscow',
            lat: 55.751244,
            lng: 37.618423,
        },
    });
    const distributorRecord = await prisma.distributor.upsert({
        where: { id: (_b = (_a = (await prisma.distributor.findFirst({ where: { name: 'Demo Distributor' } }))) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : 0 },
        update: { telegramChatId: chatId },
        create: {
            name: 'Demo Distributor',
            telegramChatId: chatId,
        },
    });
    const product = await prisma.product.upsert({
        where: { sku: 'TEST-001' },
        update: {},
        create: {
            line: 'Demo Line',
            flavor: 'Demo Flavor',
            sku: 'TEST-001',
        },
    });
    console.log('✅ Facility:', facilityRecord);
    console.log('✅ Distributor:', distributorRecord);
    console.log('✅ Product:', product);
    console.log('Done.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map