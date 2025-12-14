import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

type CsvRow = [
  fullName: string,
  facilityName: string,
  facilityAddress: string,
  bliss: string,
  whiteLine: string,
  blackLine: string,
  cigarLine: string,
  visitDate: string,
];

const prisma = new PrismaClient();

const possiblePaths = [
  path.resolve(__dirname, 'БАЗАБАЗА.csv'),
  path.resolve(__dirname, '..', 'БАЗАБАЗА.csv'),
  path.resolve(__dirname, '..', '..', 'БАЗАБАЗА.csv'),
  '/Users/viktorurnev/Downloads/БАЗАБАЗА.csv',
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function parseFlavors(cell: string): string[] {
  return cell
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseDate(dateStr: string): Date | null {
  const parts = dateStr.split('.').map((v) => Number(v));
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

async function main() {
  const csvPath = possiblePaths.find((p) => existsSync(p));
  if (!csvPath) {
    throw new Error(`CSV file not found. Checked: ${possiblePaths.join(', ')}`);
  }

  const content = readFileSync(csvPath, 'utf8');
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) {
    console.log('CSV has no data rows');
    return;
  }

  const header = lines[0];
  console.log(`Using CSV: ${csvPath}`);
  console.log(`Header: ${header}`);

  const userCache = new Map<string, number>();
  const facilityCache = new Map<string, number>();
  const productCache = new Map<string, number>();

  let processed = 0;

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    const cols = raw.split(';').map((c) => c.trim()) as Partial<CsvRow>;
    if (cols.length < 8) {
      console.warn(`Row ${i + 1} skipped: expected 8 columns, got ${cols.length}`);
      continue;
    }

    const [
      fullName,
      facilityName,
      facilityAddress,
      blissCell,
      whiteCell,
      blackCell,
      cigarCell,
      visitDateStr,
    ] = cols as CsvRow;

    if (!fullName || !facilityName || !facilityAddress || !visitDateStr) {
      console.warn(`Row ${i + 1} skipped: missing required fields`);
      continue;
    }

    const visitDate = parseDate(visitDateStr);
    if (!visitDate || isNaN(visitDate.getTime())) {
      console.warn(`Row ${i + 1} skipped: invalid date "${visitDateStr}"`);
      continue;
    }

    // User
    let userId = userCache.get(fullName);
    if (!userId) {
      const existingUser = await prisma.user.findFirst({ where: { fullName } });
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const user = await prisma.user.create({
          data: {
            fullName,
            telegramId: `temp_${randomUUID()}`,
          },
        });
        userId = user.id;
      }
      userCache.set(fullName, userId);
    }

    // Facility
    const facilityKey = `${facilityName}__${facilityAddress}`;
    let facilityId = facilityCache.get(facilityKey);
    if (!facilityId) {
      const existingFacility = await prisma.facility.findFirst({
        where: { name: facilityName, address: facilityAddress },
      });
      if (existingFacility) {
        facilityId = existingFacility.id;
      } else {
        const facility = await prisma.facility.create({
          data: {
            name: facilityName,
            address: facilityAddress,
          },
        });
        facilityId = facility.id;
      }
      facilityCache.set(facilityKey, facilityId);
    }

    // Products
    const lineCells: Record<string, string> = {
      'BLISS': blissCell,
      'WHITE LINE': whiteCell,
      'BLACK LINE': blackCell,
      'CIGAR LINE': cigarCell,
    };

    const productIds: number[] = [];

    for (const [lineName, cell] of Object.entries(lineCells)) {
      const flavors = parseFlavors(cell || '');
      for (const flavor of flavors) {
        const sku = `${slugify(lineName)}-${slugify(flavor)}`;
        if (!sku || sku.endsWith('-')) continue;

        let productId = productCache.get(sku);
        if (!productId) {
          const existingProduct = await prisma.product.findUnique({ where: { sku } });
          if (existingProduct) {
            productId = existingProduct.id;
          } else {
            const product = await prisma.product.create({
              data: {
                line: lineName,
                flavor,
                sku,
              },
            });
            productId = product.id;
          }
          productCache.set(sku, productId);
        }
        productIds.push(productId);
      }
    }

    // Visit
    await prisma.visit.create({
      data: {
        userId,
        facilityId,
        type: 'IMPORT',
        date: visitDate,
        productsAvailable: {
          connect: productIds.map((id) => ({ id })),
        },
      },
    });

    processed += 1;
    console.log(`Processed row ${i + 1}: Visit to "${facilityName}" by "${fullName}" (${productIds.length} products)`);
  }

  // Post-processing: update must-list
  const facilities = await prisma.facility.findMany({ select: { id: true } });
  for (const facility of facilities) {
    const lastVisit = await prisma.visit.findFirst({
      where: { facilityId: facility.id },
      orderBy: { date: 'desc' },
      include: { productsAvailable: { select: { id: true } } },
    });
    if (!lastVisit) continue;

    const requiredProducts = lastVisit.productsAvailable.map((p) => p.id);
    await prisma.facility.update({
      where: { id: facility.id },
      data: { requiredProducts },
    });
  }

  console.log(`Done. Total processed rows: ${processed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
