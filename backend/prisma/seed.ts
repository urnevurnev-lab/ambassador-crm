import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding base data...');
    const chatId = '-1003288508767'; // Telegram group chat ID

    const facility = await prisma.facility.findFirst({ where: { name: 'Demo Bar' } });
    const facilityRecord = facility ?? await prisma.facility.create({
        data: {
            name: 'Demo Bar',
            address: '123 Test Street, Moscow',
            lat: 55.751244,
            lng: 37.618423,
        },
    });

    const distributorRecord = await prisma.distributor.upsert({
        where: { id: (await prisma.distributor.findFirst({ where: { name: 'Demo Distributor' } }))?.id ?? 0 },
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

    const activities = [
        { code: 'standard_visit', name: 'Стандартный визит', description: 'Базовый сценарий: отметки и комментарии.' },
        { code: 'inventory', name: 'Инвентаризация', description: 'Проверка наличия и выкладки SKU.' },
    ];

    for (const activity of activities) {
        await prisma.activity.upsert({
            where: { code: activity.code },
            update: { name: activity.name, description: activity.description },
            create: activity,
        });
    }

    console.log('✅ Facility:', facilityRecord);
    console.log('✅ Distributor:', distributorRecord);
    console.log('✅ Product:', product);
    console.log('✅ Activities:', activities.map(a => a.code).join(', '));
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
