import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding base data (activities only, no demo entities)...');

    const activities = [
        { code: 'visit', name: 'Проезд', description: 'Наличие вкусов, контакты, комментарий' },
        { code: 'tasting', name: 'Дегустация', description: 'Сбор контактов участников' },
        { code: 'b2b', name: 'B2B Визит', description: 'Переговоры, контакты ЛПР' },
        { code: 'open_shift', name: 'Открытая смена', description: 'Время работы и количество чашек' },
    ];

    for (const activity of activities) {
        await prisma.activity.upsert({
            where: { code: activity.code },
            update: { name: activity.name, description: activity.description },
            create: activity,
        });
    }

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
