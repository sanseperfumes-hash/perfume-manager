
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting cleanup by essence size...');

    const products = await prisma.product.findMany({
        include: {
            ingredients: {
                include: {
                    material: {
                        include: { type: true }
                    }
                }
            }
        }
    });

    console.log(`Total products to scan: ${products.length}`);

    let deletedCount = 0;

    for (const product of products) {
        // Find the essence ingredient
        const essence = product.ingredients.find(i =>
            i.material.type?.name === 'Esencia' ||
            i.material.name.toLowerCase().includes('esencia') ||
            // Fallback for scraped essences that might not have type set yet but are clearly essences
            // (Not Alcohol, Bottle, Box, Label)
            (!i.material.name.toLowerCase().includes('alcohol') &&
                !i.material.name.toLowerCase().includes('frasco') &&
                !i.material.name.toLowerCase().includes('caja') &&
                !i.material.name.toLowerCase().includes('etiqueta'))
        );

        if (essence) {
            // Check if purchase quantity is NOT 30
            // We use a small epsilon for float comparison just in case, though usually integers here
            if (Math.abs(essence.material.purchaseQuantity - 30) > 0.1) {
                console.log(`Deleting "${product.name}" - Uses essence "${essence.material.name}" (Qty: ${essence.material.purchaseQuantity})`);
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
    }

    console.log(`Deleted ${deletedCount} incorrect products.`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
