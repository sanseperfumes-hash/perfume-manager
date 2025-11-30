
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting aggressive cleanup (round 2)...');

    const products = await prisma.product.findMany();
    console.log(`Total products in DB: ${products.length}`);

    let deletedCount = 0;
    for (const product of products) {
        // Match any product ending in (digits+g), allowing for trailing spaces
        if (/\(\d+g\)\s*$/.test(product.name)) {
            console.log(`Deleting: "${product.name}"`);
            try {
                await prisma.product.delete({
                    where: { id: product.id }
                });
                deletedCount++;
            } catch (error) {
                console.error(`Failed to delete ${product.name}:`, error);
            }
        }
    }

    console.log(`Deleted ${deletedCount} products.`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
