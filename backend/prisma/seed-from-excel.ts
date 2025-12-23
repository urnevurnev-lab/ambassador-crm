import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs'; 

const prisma = new PrismaClient();

// ЗАГОЛОВКИ
const CSV_HEADERS = {
  DATE: 'Отметка времени',
  AMBASSADOR: 'Амбассадор',
  FACILITY_NAME: 'Название заведения с Яндекс карты',
  ADDRESS: 'Адрес с Яндекс карты',
  FLAVORS_TASTED: 'Вкусы', 
  LINE_BLISS: 'Bliss ( что стоит в работе )',
  LINE_WHITE: 'WHITE LINE  ( что стоит в работе )',
  LINE_BLACK: 'BLACK LINE  ( что стоит в работе )',
  LINE_CIGAR: 'Cigar Line'
};

async function main() {
  console.log('🚀 Start FINAL Import (Fixed Delimiter)...');

  // 1. HARD RESET
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.sampleOrderItem.deleteMany({});
  await prisma.sampleOrder.deleteMany({});
  await prisma.visit.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.facility.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.product.deleteMany({});
  
  console.log('🗑️  Database clean.');

  // 2. СОЗДАЕМ ЛИНЕЙКИ
  const linesIds = {
    BLISS: await createLineMarker('Bliss'),
    WHITE: await createLineMarker('White Line'),
    BLACK: await createLineMarker('Black Line'),
    CIGAR: await createLineMarker('Cigar Line'),
  };

  // 3. ЧИТАЕМ ФАЙЛ
  const csvFilePath = path.join(__dirname, 'import.csv');
  if (!fs.existsSync(csvFilePath)) throw new Error('❌ import.csv not found!');

  const workbook = new ExcelJS.Workbook();
  // ИЗМЕНЕНИЕ: Ставим delimiter: ';' (точка с запятой)
  const worksheet = await workbook.csv.readFile(csvFilePath, {
      parserOptions: { delimiter: ';', ltrim: true, rtrim: true }
  });
  
  const headers: string[] = [];
  worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = cell.text?.trim().replace(/^"|"$/g, '');
  });

  const getColIndex = (expectedName: string, isOptional = false) => {
      let index = headers.indexOf(expectedName);
      if (index === -1) {
          index = headers.findIndex(h => h && h.includes(expectedName.split('(')[0].trim()));
      }
      if (index === -1) {
          if (isOptional) return 0;
          console.error(`❌ Missed Header: "${expectedName}"`);
          throw new Error(`Column not found`);
      }
      return index;
  };

  const colIdx = {
      date: getColIndex(CSV_HEADERS.DATE),
      amb: getColIndex(CSV_HEADERS.AMBASSADOR),
      fac: getColIndex(CSV_HEADERS.FACILITY_NAME),
      addr: getColIndex(CSV_HEADERS.ADDRESS),
      taste: getColIndex(CSV_HEADERS.FLAVORS_TASTED, true),
      bliss: getColIndex(CSV_HEADERS.LINE_BLISS, true),
      white: getColIndex(CSV_HEADERS.LINE_WHITE, true),
      black: getColIndex(CSV_HEADERS.LINE_BLACK, true),
      cigar: getColIndex(CSV_HEADERS.LINE_CIGAR, true),
  };

  console.log(`📄 Processing rows...`);

  for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      
      const dateRaw = row.getCell(colIdx.date).text;
      const ambName = row.getCell(colIdx.amb).text;
      const facName = row.getCell(colIdx.fac).text;
      const facAddress = row.getCell(colIdx.addr).text;

      // Если после смены разделителя данные пустые - пропускаем
      if (!facName && !ambName) continue;

      // ПАРСЕР ДАТЫ
      let visitDate: Date;
      try {
          const cleanDate = dateRaw.split(' ')[0]; // 12.09.2025
          if (cleanDate.includes('.')) {
              const parts = cleanDate.split('.');
              // DD.MM.YYYY -> YYYY-MM-DD
              visitDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00.000Z`);
          } else {
              visitDate = new Date(dateRaw);
          }

          if (isNaN(visitDate.getTime())) {
              console.warn(`⚠️  Bad date at row ${i}: "${dateRaw}". Using NOW().`);
              visitDate = new Date();
          }
      } catch (e) {
          visitDate = new Date();
      }

      const cleanNameId = ambName.replace(/[^a-zA-Zа-яА-Я0-9]/g, '').toLowerCase();
      const telegramId = `import_${cleanNameId}`; 
      const user = await prisma.user.upsert({
          where: { telegramId },
          update: {},
          create: { fullName: ambName, telegramId, role: 'AMBASSADOR' }
      });

      let facility = await prisma.facility.findFirst({ where: { name: facName, address: facAddress } });
      if (!facility) {
          facility = await prisma.facility.create({ data: { name: facName, address: facAddress, isVerified: true } });
      }

      const productsAvailableConnect: any[] = [];
      const inventorySnapshot: any = {};
      
      const checkLine = (idx: number, lineId: number, key: string) => {
          if (idx === 0) return;
          const val = parseInt(row.getCell(idx).text);
          if (!isNaN(val) && val > 0) {
              productsAvailableConnect.push({ id: lineId });
              inventorySnapshot[key] = val;
          }
      };
      
      checkLine(colIdx.bliss, linesIds.BLISS, 'bliss');
      checkLine(colIdx.white, linesIds.WHITE, 'white');
      checkLine(colIdx.black, linesIds.BLACK, 'black');
      checkLine(colIdx.cigar, linesIds.CIGAR, 'cigar');

      const productsTastedConnect: any[] = [];
      if (colIdx.taste > 0) {
          const tasteRaw = row.getCell(colIdx.taste).text;
          if (tasteRaw && tasteRaw.length > 2) {
              const flavors = tasteRaw.split(/,|;/).map(s => s.trim()).filter(s => s);
              for (const fName of flavors) {
                  const sku = `flavor_${fName.replace(/\s/g, '_').toLowerCase()}`;
                  const safeSku = sku.substring(0, 50);
                  const p = await prisma.product.upsert({
                      where: { sku: safeSku },
                      update: {},
                      create: { line: 'Unknown', flavor: fName, sku: safeSku, category: 'FLAVOR' }
                  });
                  productsTastedConnect.push({ id: p.id });
              }
          }
      }

      await prisma.visit.create({
          data: {
              userId: user.id,
              facilityId: facility.id,
              date: visitDate,
              status: 'COMPLETED',
              type: 'CHECKUP',
              data: { imported: true, inventory_counts: inventorySnapshot },
              productsAvailable: { connect: productsAvailableConnect },
              productsTasted: { connect: productsTastedConnect }
          }
      });
  }
  console.log('✅ COMPLETE. Real dates imported.');
}

async function createLineMarker(name: string) {
    const sku = `line_${name.replace(/\s/g, '_').toLowerCase()}`;
    return (await prisma.product.upsert({
        where: { sku },
        update: {},
        create: { line: name, flavor: 'General', sku, category: 'LINE_MARKER', price: 0 }
    })).id;
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });