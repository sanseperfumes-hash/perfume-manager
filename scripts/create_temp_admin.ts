import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    try {
        const username = 'admin_test';
        const password = 'admin_password';
        const hashedPassword = await bcrypt.hash(password, 10);
        const email = 'admin@test.com';

        const existing = await prisma.user.findFirst({
            where: { username }
        });

        if (existing) {
            console.log('User already exists, updating role and password...');
            await prisma.user.update({
                where: { id: existing.id },
                data: {
                    role: 'ADMIN',
                    password: hashedPassword
                }
            });
        } else {
            console.log('Creating new admin user...');
            await prisma.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    email,
                    role: 'ADMIN'
                }
            });
        }
        console.log('Admin user ready: admin_test / admin_password');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
