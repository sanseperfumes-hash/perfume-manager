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

        for (const product of products) {
            for (const variant of product.variants) {
                // Construct a unique name for the material, e.g., "Alien (30g)"
                const materialName = `${product.groupName} (${variant.size})`;

                // Calculate unit cost (assuming unit is 'g' for now, or just price per unit)
                // If it's a 30g bottle, the unit is 'u' (unit) or we treat it as bulk?
                // The user wants to select "30g" or "100g" in the dropdown.
                // So we should probably store them as separate materials but grouped.

                // Logic: Upsert material
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
                            // If it's a fixed size bottle, purchaseQuantity is 1 unit of that bottle? 
                            // Or is it 30g?
                            // User said: "traigan el costo de los 30 gramos... menu desplegable... costo se actualice"
                            // If I select "30g", the cost is $30534.
                            // Let's assume purchaseQuantity = 1 (unit) and costPerUnit = price.
                            // Or if they use it by gram... 
                            // Usually for "Armador", you use grams. 
                            // If I buy a 30g bottle for $30000, cost per gram is $1000.
                            // Let's store it as:
                            // Name: Alien
                            // Group: Alien
                            // Unit: g
                            // PurchaseCost: $30534
                            // PurchaseQuantity: 30
                            // CostPerUnit: $1017.8

                            // Wait, if I have multiple sizes, I have multiple costs per gram.
                            // Usually you buy the most efficient one.
                            // But the user wants to select the size in the UI.
                            // So maybe we store them as separate "Purchase Options" for the same material?
                            // Or separate materials grouped by name.

                            // Let's go with separate materials for now, as the schema supports it.
                            purchaseCost: variant.price,
                            purchaseQuantity: variant.size === '30g' ? 30 : (variant.size === '100g' ? 100 : 15),
                            costPerUnit: variant.price / (variant.size === '30g' ? 30 : (variant.size === '100g' ? 100 : 15)),
                            lastUpdated: new Date(),
                            supplierUrl: product.url,
                            groupName: product.groupName
                        }
                    });
                    updatedCount++;
                } else {
                    await prisma.material.create({
                        data: {
                            name: materialName,
                            unit: 'g',
                            purchaseCost: variant.price,
                            purchaseQuantity: variant.size === '30g' ? 30 : (variant.size === '100g' ? 100 : 15),
                            costPerUnit: variant.price / (variant.size === '30g' ? 30 : (variant.size === '100g' ? 100 : 15)),
                            groupName: product.groupName,
                            supplierUrl: product.url,
                            lastUpdated: new Date()
                        }
                    });
                    createdCount++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            scraped: products.length,
            updated: updatedCount,
            created: createdCount
        });

    } catch (error) {
        console.error('Sync failed:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
