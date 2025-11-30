
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Inspecting "STRONGER WITH YOU" products...');

    const products = await prisma.product.findMany({
        where: {
            name: { contains: 'STRONGER WITH YOU' }
        },
        include: {
            ingredients: {
                include: {
                    material: true
                }
            }
        }
    });

    console.log(`Found ${products.length} products.`);

    for (const p of products) {
        console.log('------------------------------------------------');
        console.log(`ID: ${p.id}`);
        console.log(`Name: "${p.name}"`); // Quotes to see trailing spaces
        console.log(`Final Price: ${p.finalPrice}`);

        const essence = p.ingredients.find(i => i.material.type?.name === 'Esencia' || i.material.name.includes('Esencia') || (!i.material.name.includes('Alcohol') && !i.material.name.includes('Frasco') && !i.material.name.includes('Caja') && !i.material.name.includes('Etiqueta')));

        if (essence) {
            console.log(`Essence: ${essence.material.name}`);
            console.log(`Essence Purchase Qty: ${essence.material.purchaseQuantity}`);
            console.log(`Qty Used in Recipe: ${essence.quantityUsed}`);
        } else {
            console.log('No essence found in ingredients.');
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
