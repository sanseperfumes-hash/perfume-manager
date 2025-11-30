
import { PrismaClient } from '@prisma/client';
// import { scrapeVanRossum } from '../src/lib/scraper';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Starting manual price sync...');
        // const products = await scrapeVanRossum();
        // console.log(`Scraped ${products.length} products.`);

        // Auto-generate Products
        console.log('Auto-generating products...');
        const alcohol = await prisma.material.findFirst({ where: { name: { contains: 'Alcohol' } } });
        const caja = await prisma.material.findFirst({ where: { name: { contains: 'Caja' } } });
        const etiquetas = await prisma.material.findFirst({ where: { name: { contains: 'Etiquetas' } } });
        const frascoM = await prisma.material.findFirst({ where: { OR: [{ name: 'Frasco masculino' }, { name: 'Frascos masculinos' }] } });
        const frascoF = await prisma.material.findFirst({ where: { name: { contains: 'Frascos Femeninos' } } });

        if (!alcohol || !caja || !etiquetas || !frascoM || !frascoF) {
            console.error('Missing base materials for product generation. Skipping.');
        } else {
            let productCount = 0;
            let updatedCount = 0;

            // Fetch ALL essences, no quantity filter
            const allEssences = await prisma.material.findMany({
                where: {
                    type: { name: 'Esencia' }
                }
            });

            console.log(`Found ${allEssences.length} essences (all sizes).`);

            for (const essence of allEssences) {
                // Only process MALE, FEMALE, or UNISEX
                if (essence.gender !== 'MALE' && essence.gender !== 'FEMALE' && essence.gender !== 'UNISEX') {
                    continue;
                }

                // We use the full essence name to ensure uniqueness for different sizes
                // e.g. "Perfume ANGEL (THIERRY MUGLER) (F) (30g)"
                // e.g. "Perfume ANGEL (THIERRY MUGLER) (F) (100g)"
                const productName = `Perfume ${essence.name}`;

                const existingProduct = await prisma.product.findFirst({ where: { name: productName } });

                // Use Male bottle for Unisex as default if no specific Unisex bottle exists
                const bottle = essence.gender === 'FEMALE' ? frascoF : frascoM;

                // Calculate cost
                // Recipe: 15g Essence, 80ml Alcohol, 1 Bottle, 1 Box, 1 Label
                // Note: We always use 15g of essence in the recipe, regardless of the essence source size.
                // The cost will vary because the costPerUnit of the 100g essence is likely lower than the 30g one.
                const cost =
                    (essence.costPerUnit * 15) +
                    (alcohol.costPerUnit * 80) +
                    (bottle.costPerUnit * 1) +
                    (caja.costPerUnit * 1) +
                    (etiquetas.costPerUnit * 1);

                if (!existingProduct) {
                    const profitMargin = 100; // 100%
                    const finalPrice = cost * (1 + profitMargin / 100);

                    await prisma.product.create({
                        data: {
                            name: productName,
                            cost,
                            profitMargin,
                            finalPrice,
                            gender: essence.gender,
                            ingredients: {
                                create: [
                                    { materialId: essence.id, quantityUsed: 15 },
                                    { materialId: alcohol.id, quantityUsed: 80 },
                                    { materialId: bottle.id, quantityUsed: 1 },
                                    { materialId: caja.id, quantityUsed: 1 },
                                    { materialId: etiquetas.id, quantityUsed: 1 }
                                ]
                            }
                        }
                    });
                    productCount++;
                } else {
                    // Update existing product cost/price
                    const profitMargin = existingProduct.profitMargin || 100;
                    const finalPrice = cost * (1 + profitMargin / 100);

                    await prisma.product.update({
                        where: { id: existingProduct.id },
                        data: {
                            cost,
                            finalPrice
                        }
                    });
                    updatedCount++;
                }
            }
            console.log(`Generated ${productCount} new products. Updated ${updatedCount} existing products.`);
        }

    } catch (error) {
        console.error('Sync failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
