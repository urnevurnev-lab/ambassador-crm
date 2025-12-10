import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const productsData = [
    // Линейка NASH
    { line: "NASH", flavor: "Алоэ Вера" },
    { line: "NASH", flavor: "Ананас" },
    { line: "NASH", flavor: "Апельсин" },
    { line: "NASH", flavor: "Арбуз Дыня" },
    { line: "NASH", flavor: "Бабан" },
    { line: "NASH", flavor: "Барбарис" },
    { line: "NASH", flavor: "Бергамот" },
    { line: "NASH", flavor: "Бренди Моторс" },
    { line: "NASH", flavor: "Виноград" },
    { line: "NASH", flavor: "Вишня" },
    { line: "NASH", flavor: "Гарнет (Гранат)" },
    { line: "NASH", flavor: "Грейпфрут" },
    { line: "NASH", flavor: "Груша Дюшес" },
    { line: "NASH", flavor: "Земляника" },
    { line: "NASH", flavor: "Кактус финик" },
    { line: "NASH", flavor: "Киви" },
    { line: "NASH", flavor: "Клюква" },
    { line: "NASH", flavor: "Кола" },
    { line: "NASH", flavor: "Личи" },
    { line: "NASH", flavor: "Малина" },
    { line: "NASH", flavor: "Манго" },
    { line: "NASH", flavor: "Маракуйя" },
    { line: "NASH", flavor: "Мята перечная" },
    { line: "NASH", flavor: "Орехи (Скитлс)" },
    { line: "NASH", flavor: "Персик" },
    { line: "NASH", flavor: "Ром Баба" },
    { line: "NASH", flavor: "Скитлс" },
    { line: "NASH", flavor: "Смородина красная" },
    { line: "NASH", flavor: "Смородина черная" },
    { line: "NASH", flavor: "Тархун" },
    { line: "NASH", flavor: "Фейхоа" },
    { line: "NASH", flavor: "Хвоя" },
    { line: "NASH", flavor: "Черника" },
    { line: "NASH", flavor: "Энергетик" },
    { line: "NASH", flavor: "Яблоко зеленое" },
    // Линейка NASH Strong
    { line: "NASH Strong", flavor: "Байкал" },
    { line: "NASH Strong", flavor: "Банановый пирог" },
    { line: "NASH Strong", flavor: "Белый мишка (Холодок)" },
    { line: "NASH Strong", flavor: "Брусника" },
    { line: "NASH Strong", flavor: "Вафли" },
    { line: "NASH Strong", flavor: "Гранат" },
    { line: "NASH Strong", flavor: "Грейпфрут" },
    { line: "NASH Strong", flavor: "Дыня" },
    { line: "NASH Strong", flavor: "Земляника" },
    { line: "NASH Strong", flavor: "Кактус" },
    { line: "NASH Strong", flavor: "Клубника" },
    { line: "NASH Strong", flavor: "Клюква" },
    { line: "NASH Strong", flavor: "Лайм" },
    { line: "NASH Strong", flavor: "Лимон" },
    { line: "NASH Strong", flavor: "Личи" },
    { line: "NASH Strong", flavor: "Малина" },
    { line: "NASH Strong", flavor: "Манго" },
    { line: "NASH Strong", flavor: "Мандарин" },
    { line: "NASH Strong", flavor: "Маракуйя" },
    { line: "NASH Strong", flavor: "Мятная жвачка" },
    { line: "NASH Strong", flavor: "Овсяная каша" },
    { line: "NASH Strong", flavor: "Папайя" },
    { line: "NASH Strong", flavor: "Персик" },
    { line: "NASH Strong", flavor: "Ревень" },
    { line: "NASH Strong", flavor: "Слива" },
    { line: "NASH Strong", flavor: "Смородина черная" },
    { line: "NASH Strong", flavor: "Тархун" },
    { line: "NASH Strong", flavor: "Фейхоа" },
    { line: "NASH Strong", flavor: "Хвоя" },
    { line: "NASH Strong", flavor: "Чай с жасмином" },
    { line: "NASH Strong", flavor: "Черника" },
    { line: "NASH Strong", flavor: "Чернослив" },
    { line: "NASH Strong", flavor: "Шоколад мята" },
    { line: "NASH Strong", flavor: "Яблоко" },
];

async function main() {
    console.log('🌱 Start seeding products...');
    // 1. Чистим
    await prisma.orderItem.deleteMany({});
    await prisma.product.deleteMany({});
    // 2. Заливаем
    for (const p of productsData) {
        const slug = `${p.line}-${p.flavor}`.toUpperCase().replace(/ /g, '-').replace(/[()]/g, '').replace(/[^A-Z0-9-А-Я]/g, '');
        await prisma.product.create({
            data: { line: p.line, flavor: p.flavor, sku: slug },
        });
    }
    console.log(`✅ Added ${productsData.length} products.`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
