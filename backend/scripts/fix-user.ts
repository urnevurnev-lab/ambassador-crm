import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const telegramId = '762823091';
    const fullName = 'Admin User';

    console.log(`🚀 Starting fix for user ${telegramId}...`);

    try {
        const user = await prisma.user.upsert({
            where: { telegramId },
            update: {
                role: 'ADMIN',
                fullName: fullName
            },
            create: {
                telegramId,
                fullName,
                role: 'ADMIN'
            }
        });

        console.log('✅ User updated/created successfully:');
        console.log(JSON.stringify(user, null, 2));

        const allAdmins = await prisma.user.findMany({
            where: { role: 'ADMIN' }
        });
        console.log('\n👥 All current administrators:');
        allAdmins.forEach(admin => {
            console.log(`- ${admin.fullName} (${admin.telegramId})`);
        });

    } catch (error) {
        console.error('❌ Error fixing user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
