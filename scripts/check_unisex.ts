
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const unisexCount = await prisma.product.count({
        where: { gender: 'UNISEX' }
    });
    console.log(`Unisex products found: ${unisexCount}`);

    if (unisexCount === 0) {
        console.log('No Unisex products found. Please re-run manual_sync.ts');
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
