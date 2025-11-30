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
                            purchaseQuantity: quantity,
                            costPerUnit: variant.price > 0 ? variant.price / quantity : 0,
                            lastUpdated: new Date(),
                            supplierUrl: product.url,
                            supplier: 'Van Rossum',
                            priceStatus: variant.priceStatus,
                            groupName: product.groupName,
                            gender: product.gender as any,
                            // Only set type if missing
                            typeId: existing.typeId || esenciaType.id
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
                            costPerUnit: variant.price > 0 ? variant.price / quantity : 0,
                            groupName: product.groupName,
                            supplierUrl: product.url,
                            supplier: 'Van Rossum',
                            priceStatus: variant.priceStatus,
                            gender: product.gender as any,
                            lastUpdated: new Date(),
                            typeId: esenciaType.id
                        }
                    });
                    createdCount++;
                }
            }
        }

        // Delete materials from Van Rossum that no longer exist on the website
        const vanRossumMaterials = await prisma.material.findMany({
            where: {
                supplier: 'Van Rossum'
            }
        });

        for (const material of vanRossumMaterials) {
            if (!scrapedMaterialNames.has(material.name)) {
                // This material no longer exists on Van Rossum website
                try {
                    await prisma.material.delete({
                        where: { id: material.id }
                    });
                    deletedCount++;
                    console.log(`Deleted obsolete material: ${material.name}`);
                } catch (error) {
                    // If deletion fails (e.g., foreign key constraint), just log it
                    console.warn(`Could not delete material ${material.name}:`, error);
                }
            }
        }

        return NextResponse.json({
            success: true,
            scraped: products.length,
            updated: updatedCount,
            created: createdCount,
            deleted: deletedCount
        });

    } catch (error) {
        console.error('Sync failed:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}

