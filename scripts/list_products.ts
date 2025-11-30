
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        select: { id: true, name: true }
    });
    console.log('Current Products:');
    products.forEach(p => console.log(`- ${p.name}`));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
