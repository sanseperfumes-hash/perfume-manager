const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('Facu1234', 10);
    try {
        const user = await prisma.user.upsert({
            where: { username: 'facundo' },
            update: { password: password, role: 'ADMIN' },
            create: {
                username: 'facundo',
                email: 'facundo@example.com',
                password: password,
                role: 'ADMIN'
            }
        });
        console.log('User facundo updated/created with password Facu1234');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
