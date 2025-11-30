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
                            purchaseQuantity: quantity,
                            costPerUnit: variant.price / quantity,
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
                            purchaseQuantity: quantity,
                            costPerUnit: variant.price / quantity,
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
