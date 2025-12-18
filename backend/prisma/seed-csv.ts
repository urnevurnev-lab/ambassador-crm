// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();

const ACTIVITY_MAP = {
  'Проезд': 'transit',
  'B2B': 'b2b',
  'Дегустация': 'tasting',
  'Открытая смена': 'checkup',
  'Смена': 'checkup'
};

async function main() {
  const results = [];
  const filePath = path.join(__dirname, 'activity.csv');

  console.log('🚀 Начинаем чтение CSV...');
  console.log(`📂 Путь к файлу: ${filePath}`);

  if (!fs.existsSync(filePath)) {
      console.error(`❌ Файл не найден по пути: ${filePath}`);
      process.exit(1);
  }

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log(`✅ Прочитано ${results.length} строк. Начинаем запись в базу...`);
      
      let newUsers = 0;
      let newFacilities = 0;
      let newProducts = 0;
      let newVisits = 0;

      for (const row of results) {
        try {
          // --- 1. АМБАССАДОР ---
          const userName = row['Амбассадор']?.trim();
          if (!userName) continue;

          let user = await prisma.user.findFirst({ where: { fullName: userName } });
          
          if (!user) {
            const randomId = Math.floor(100000 + Math.random() * 900000).toString();
            user = await prisma.user.create({
              data: {
                fullName: userName,
                telegramId: randomId, 
                role: 'AMBASSADOR'
              }
            });
            newUsers++;
          }

          // --- 2. ЗАВЕДЕНИЕ ---
          const facilityName = row['Название заведения с Яндекс карты']?.trim();
          const address = row['Адрес с Яндекс карты']?.trim();
          
          if (!facilityName) continue;

          let facility = await prisma.facility.findFirst({
            where: { name: facilityName, address: address }
          });

          if (!facility) {
            const category = row['Категория заведения '] || row['Категория заведения'] || 'C';
            facility = await prisma.facility.create({
              data: {
                name: facilityName,
                address: address || 'Адрес не указан',
                tier: category.trim() 
              }
            });
            newFacilities++;
          }

          // --- 3. ТОВАРЫ ---
          const linesToParse = [
            { col: 'Bliss ( что стоит в работе )', lineName: 'Bliss' },
            { col: 'WHITE LINE  ( что стоит в работе )', lineName: 'White Line' },
            { col: 'BLACK LINE  ( что стоит в работе )', lineName: 'Black Line' },
            { col: 'CIGAR LINE  ( что стоит в работе )', lineName: 'Cigar Line' }
          ];

          for (const lineObj of linesToParse) {
            const rawString = row[lineObj.col];
            if (rawString) {
                const flavors = rawString.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
                
                for (const flavor of flavors) {
                    const sku = `${lineObj.lineName}_${flavor}`.toUpperCase().replace(/\s+/g, '_');
                    
                    let product = await prisma.product.findFirst({
                        where: { flavor: flavor, line: lineObj.lineName }
                    });

                    if (!product) {
                        product = await prisma.product.create({
                            data: {
                                flavor: flavor,
                                line: lineObj.lineName,
                                category: 'Tobacco',
                                sku: sku,
                                price: 2500
                            }
                        });
                        newProducts++;
                    }
                }
            }
          }

          // --- 4. ВИЗИТ ---
          const dateStr = row['Отметка времени'];
          const visitDate = new Date(dateStr); 
          if (isNaN(visitDate.getTime())) continue;

          const activityType = ACTIVITY_MAP[row['Выбери активность']] || 'CHECKUP';
          const comment = [
              row['Что было сделано на проезде'], 
              row['Что говорят? '], 
              row['Что говорят?']
          ].filter(Boolean).join('. ');

          const distributor = row['У кого закупают? ( Даже если не у дистра то у кого ) '] || '';

          const existingVisit = await prisma.visit.findFirst({
              where: { userId: user.id, facilityId: facility.id, date: visitDate }
          });

          if (!existingVisit) {
            await prisma.visit.create({
                data: {
                    date: visitDate,
                    userId: user.id,
                    facilityId: facility.id,
                    type: 'CHECKUP',
                    status: 'COMPLETED',
                    comment: comment,
                    data: { distributor }
                }
            });
            newVisits++;
          }

        } catch (e) {
           // ignore errors
        }
      }
      
      console.log('------------------------------------------------');
      console.log('🎉 ИМПОРТ ЗАВЕРШЕН УСПЕШНО!');
      console.log('------------------------------------------------');
      console.log(`👤 Сотрудников добавлено: ${newUsers}`);
      console.log(`🏢 Заведений добавлено:   ${newFacilities}`);
      console.log(`📦 Вкусов найдено:        ${newProducts}`);
      console.log(`📝 Визитов загружено:     ${newVisits}`);
      console.log('------------------------------------------------');
    });
}

function transliterate(word) {
    if (!word) return 'user';
    const a = {"Ё":"YO","Й":"I","Ц":"TS","У":"U","К":"K","Е":"E","Н":"N","Г":"G","Ш":"SH","Щ":"SCH","З":"Z","Х":"H","Ъ":"'","ё":"yo","й":"i","ц":"ts","у":"u","к":"k","е":"e","н":"n","г":"g","ш":"sh","щ":"sch","з":"z","х":"h","ъ":"'","Ф":"F","Ы":"I","В":"V","А":"A","П":"P","Р":"R","О":"O","Л":"L","Д":"D","Ж":"ZH","Э":"E","ф":"f","ы":"i","в":"v","а":"a","п":"p","р":"r","о":"o","л":"l","д":"d","ж":"zh","э":"e","Я":"Ya","Ч":"CH","С":"S","М":"M","И":"I","Т":"T","Ь":"'","Б":"B","Ю":"YU","я":"ya","ч":"ch","с":"s","м":"m","и":"i","т":"t","ь":"'","б":"b","ю":"yu"};
    return word.split('').map((char) => a[char] || char).join("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });