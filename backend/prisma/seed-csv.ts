// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
// csv-parser экспортируется как CommonJS, поэтому используем require
// eslint-disable-next-line @typescript-eslint/no-var-requires
const csvParser = require('csv-parser');

const prisma = new PrismaClient();

const ACTIVITY_MAP: Record<string, string> = {
  'Проезд': 'transit',
  'B2B': 'b2b',
  'Дегустация': 'tasting',
  'Открытая смена': 'checkup',
  'Смена': 'checkup',
};

const COLUMNS = {
  date: 'Отметка времени',
  ambassador: 'Амбассадор',
  activity: 'Выбери активность',
  facility: 'Название заведения с Яндекс карты',
  address: 'Адрес с Яндекс карты',
  bliss: 'Bliss ( что стоит в работе )',
  white: 'WHITE LINE  ( что стоит в работе )',
  black: 'BLACK LINE  ( что стоит в работе )',
  cigar: 'CIGAR LINE  ( что стоит в работе )',
};

async function main() {
  const results: any[] = [];
  const filePath = path.join(__dirname, 'import.csv');

  console.log('🚀 Чтение CSV с точеками и остатками...');
  console.log(`📂 Файл: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Файл не найден: ${filePath}`);
    process.exit(1);
  }

  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.sampleOrderItem.deleteMany({});
  await prisma.sampleOrder.deleteMany({});
  await prisma.visit.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.facility.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.product.deleteMany({});

  console.log('🧹 База очищена. Загружаем данные...');

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser({ separator: ';', skipLines: 0, mapHeaders: ({ header }) => header.trim() }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve())
      .on('error', reject);
  });

  console.log(`✅ Прочитано строк: ${results.length}`);

  let newUsers = 0;
  let newFacilities = 0;
  let newProducts = 0;
  let newVisits = 0;

  for (const row of results) {
    try {
      const userName = (row[COLUMNS.ambassador] || '').trim();
      if (!userName) continue;

      const telegramId = `import_${slugify(userName)}`;
      let user = await prisma.user.findUnique({ where: { telegramId } });
      if (!user) {
        user = await prisma.user.create({
          data: { telegramId, fullName: userName, role: 'AMBASSADOR' },
        });
        newUsers++;
      }

      const facilityName = (row[COLUMNS.facility] || '').trim();
      const address = (row[COLUMNS.address] || '').trim();
      if (!facilityName) continue;

      let facility = await prisma.facility.findFirst({
        where: { name: facilityName, address },
      });
      if (!facility) {
        facility = await prisma.facility.create({
          data: { name: facilityName, address: address || 'Адрес не указан', isVerified: true },
        });
        newFacilities++;
      }

      const lineColumns = [
        { col: COLUMNS.bliss, lineName: 'Bliss' },
        { col: COLUMNS.white, lineName: 'White Line' },
        { col: COLUMNS.black, lineName: 'Black Line' },
        { col: COLUMNS.cigar, lineName: 'Cigar Line' },
      ];

      const productsToConnect: number[] = [];

      for (const item of lineColumns) {
        const raw = row[item.col] as string | undefined;
        if (!raw) continue;
        const flavors = raw
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        for (const flavor of flavors) {
          const sku = `${item.lineName}_${flavor}`.toUpperCase().replace(/\s+/g, '_');
          const product = await prisma.product.upsert({
            where: { sku },
            update: {},
            create: {
              sku,
              flavor,
              line: item.lineName,
              category: 'Tobacco',
              price: 2500,
            },
          });
          productsToConnect.push(product.id);
          newProducts++;
        }
      }

      const dateRaw = (row[COLUMNS.date] || '').trim();
      const visitDate = parseDate(dateRaw);
      if (!visitDate) continue;

      const mappedType = (ACTIVITY_MAP[row[COLUMNS.activity]] || 'CHECKUP').toUpperCase();

      const existingVisit = await prisma.visit.findFirst({
        where: { userId: user.id, facilityId: facility.id, date: visitDate },
      });

      if (!existingVisit) {
        await prisma.visit.create({
          data: {
            userId: user.id,
            facilityId: facility.id,
            date: visitDate,
            status: 'COMPLETED',
            type: mappedType,
            productsAvailable: {
              connect: productsToConnect.map((id) => ({ id })),
            },
            data: {
              imported: true,
              source: 'import.csv',
            },
          },
        });
        newVisits++;
      }
    } catch (e) {
      console.error('⚠️ Ошибка строки, пропускаем:', e);
    }
  }

  console.log('------------------------------------------------');
  console.log('🎉 Импорт завершён');
  console.log('👤 Пользователей добавлено:', newUsers);
  console.log('🏢 Заведений добавлено:', newFacilities);
  console.log('📦 Вкусов создано/подключено:', newProducts);
  console.log('📝 Визитов загружено:', newVisits);
  console.log('------------------------------------------------');
}

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const parts = raw.split('.');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const dt = new Date(`${y}-${m}-${d}T12:00:00Z`);
    if (!isNaN(dt.getTime())) return dt;
  }
  const dt = new Date(raw);
  return isNaN(dt.getTime()) ? null : dt;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '_');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
