import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const materials = await prisma.material.findMany({
            where: {
                gender: { not: null }
            },
            take: 5
        });

        console.log(`Found ${materials.length} materials with gender.`);
        materials.forEach(m => {
            console.log(`${m.name} - Gender: ${m.gender}`);
        });

        const total = await prisma.material.count();
        const withGender = await prisma.material.count({
            where: { gender: { not: null } }
        });

        console.log(`Total materials: ${total}`);
        console.log(`Materials with gender: ${withGender}`);

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
