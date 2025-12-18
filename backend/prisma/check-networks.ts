// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Загружаем все заведения
  const allFacilities = await prisma.facility.findMany({
    orderBy: { name: 'asc' }
  });

  console.log(`\n🔎 Всего заведений в базе: ${allFacilities.length}`);

  // 2. Группируем их по названиям
  const groups: Record<string, any[]> = {};
  
  allFacilities.forEach(f => {
    if (!groups[f.name]) groups[f.name] = [];
    groups[f.name].push(f);
  });

  // 3. Выводим те, у которых больше 1 адреса (Сетевые)
  console.log('\n🏢 --- ПРОВЕРКА СЕТЕВЫХ ЗАВЕДЕНИЙ (Одинаковое имя, разные адреса) ---');
  
  let networkCount = 0;

  for (const [name, locations] of Object.entries(groups)) {
    if (locations.length > 1) {
      networkCount++;
      console.log(`\n🔹 СЕТЬ: "${name}" (Точек: ${locations.length})`);
      locations.forEach(loc => {
        console.log(`   📍 ID: ${loc.id} | Адрес: ${loc.address}`);
      });
    }
  }

  if (networkCount === 0) {
    console.log('⚠️ Сетевых заведений не найдено. Либо все названия уникальны, либо адреса склеились (если они были идентичны).');
  } else {
    console.log(`\n✅ Найдено ${networkCount} сетей. Значит, дубликаты по имени НЕ склеились!`);
  }
}

main().finally(() => prisma.$disconnect());