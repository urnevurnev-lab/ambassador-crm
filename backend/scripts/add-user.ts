import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const telegramId = '762823091';
  const fullName = 'Admin User';
  const role = 'ADMIN' as any;

  const user = await prisma.user.upsert({
    where: { telegramId },
    update: { role },
    create: {
      telegramId,
      fullName,
      role,
    },
  });

  console.log('User added/updated:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
