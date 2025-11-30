import { NextResponse } from 'next/server';
import { scrapeVanRossum } from '@/lib/scraper';
import prisma from '@/lib/prisma';

export const maxDuration = 300; // 5 minutes timeout for Vercel

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // Allow manual trigger in dev or if secret matches
            if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        console.log('Starting price sync...');
        const products = await scrapeVanRossum();
        console.log(`Scraped ${products.length} products.`);

        let updatedCount = 0;
        let createdCount = 0;
        let deletedCount = 0;

        // Track all material names from scraping
        const scrapedMaterialNames = new Set<string>();

        // Get or create 'Esencia' type
        let esenciaType = await prisma.materialType.findUnique({ where: { name: 'Esencia' } });
        if (!esenciaType) {
            esenciaType = await prisma.materialType.create({ data: { name: 'Esencia' } });
        }

        for (const product of products) {
            for (const variant of product.variants) {
                // Construct a unique name for the material, e.g., "Alien (30g)"
                const materialName = `${product.groupName} (${variant.size})`;
                scrapedMaterialNames.add(materialName);

                // Calculate quantity from size string (e.g., "30g" -> 30)
                const quantity = parseInt(variant.size.replace('g', ''));

                // Upsert material
                const existing = await prisma.material.findFirst({
                    where: {
                        name: materialName
                    }
                });

                if (existing) {
                    await prisma.material.update({
                        where: { id: existing.id },
                        data: {
                            purchaseCost: variant.price,
                            costPerUnit: variant.price / quantity,
                            priceStatus: variant.status,
                            lastUpdated: new Date()
                        }
                    });
                    updatedCount++;
                } else {
                    await prisma.material.create({
                        data: {
                            name: materialName,
                            purchaseCost: variant.price,
                            purchaseQuantity: quantity,
                            unit: 'g',
                            costPerUnit: variant.price / quantity,
                            supplier: 'Van Rossum',
                            supplierUrl: product.url,
                            groupName: product.groupName,
                            priceStatus: variant.status,
                            gender: product.gender,
                            typeId: esenciaType.id
                        }
                    });
                    createdCount++;
                }
            }
        }

        // --- Auto-generate Products Logic ---
        console.log('Auto-generating products...');

        // 1. Ensure Base Materials Exist
        const baseMaterials = [
            { name: 'Alcohol', cost: 3000, quantity: 1000, unit: 'ml' },
            { name: 'Caja', cost: 500, quantity: 1, unit: 'u' },
            { name: 'Etiquetas', cost: 100, quantity: 1, unit: 'u' },
            { name: 'Frasco masculino', cost: 2000, quantity: 1, unit: 'u' },
            { name: 'Frascos Femeninos', cost: 2000, quantity: 1, unit: 'u' }
        ];

        for (const base of baseMaterials) {
            const exists = await prisma.material.findFirst({ where: { name: { contains: base.name } } });
            if (!exists) {
                await prisma.material.create({
                    data: {
                        name: base.name,
                        purchaseCost: base.cost,
                        purchaseQuantity: base.quantity,
                        unit: base.unit,
                        costPerUnit: base.cost / base.quantity,
                        supplier: 'Otro',
                        priceStatus: 'available'
                    }
                });
                console.log(`Created base material: ${base.name}`);
            }
        }

        // 2. Fetch Base Materials
        const alcohol = await prisma.material.findFirst({ where: { name: { contains: 'Alcohol' } } });
        const caja = await prisma.material.findFirst({ where: { name: { contains: 'Caja' } } });
        const etiquetas = await prisma.material.findFirst({ where: { name: { contains: 'Etiquetas' } } });
        const frascoM = await prisma.material.findFirst({ where: { OR: [{ name: 'Frasco masculino' }, { name: 'Frascos masculinos' }] } });
        const frascoF = await prisma.material.findFirst({ where: { name: { contains: 'Frascos Femeninos' } } });

        let productsGenerated = 0;
        let productsUpdated = 0;

        if (alcohol && caja && etiquetas && frascoM && frascoF) {
            const allEssences = await prisma.material.findMany({
                where: { type: { name: 'Esencia' } }
            });

            for (const essence of allEssences) {
                if (essence.gender !== 'MALE' && essence.gender !== 'FEMALE' && essence.gender !== 'UNISEX') continue;

                const productName = `Perfume ${essence.name}`;
                const existingProduct = await prisma.product.findFirst({ where: { name: productName } });
                const bottle = essence.gender === 'FEMALE' ? frascoF : frascoM;

                const cost =
                    (essence.costPerUnit * 15) +
                    (alcohol.costPerUnit * 80) +
                    (bottle.costPerUnit * 1) +
                    (caja.costPerUnit * 1) +
                    (etiquetas.costPerUnit * 1);

                if (!existingProduct) {
                    await prisma.product.create({
                        data: {
                            name: productName,
                            cost,
                            profitMargin: 100,
                            finalPrice: cost * 2,
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
                    productsGenerated++;
                } else {
                    await prisma.product.update({
                        where: { id: existingProduct.id },
                        data: { cost, finalPrice: cost * (1 + (existingProduct.profitMargin / 100)) }
                    });
                    productsUpdated++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            materials: { updated: updatedCount, created: createdCount },
            products: { generated: productsGenerated, updated: productsUpdated }
        });

    } catch (error) {
        console.error('Sync failed:', error);
        return NextResponse.json({ error: 'Sync failed', details: error }, { status: 500 });
    }
}
