import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const sales = await prisma.sale.findMany({
            include: {
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(sales);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching sales' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items } = body; // items: { type: 'RETAIL' | 'RESELLER', id: string, quantity: number, price: number, name: string }[]

        const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Sale
            const sale = await tx.sale.create({
                data: {
                    total,
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.type === 'RETAIL' ? item.id : null,
                            resellerProductId: item.type === 'RESELLER' ? item.id : null,
                            quantity: item.quantity,
                            priceAtSale: item.price,
                            productName: item.name
                        }))
                    }
                },
                include: {
                    items: true
                }
            });

            // 2. Deduct Inventory
            for (const item of items) {
                let productId = item.type === 'RETAIL' ? item.id : null;

                // If reseller product, get the underlying product ID
                if (item.type === 'RESELLER') {
                    const resellerProduct = await tx.resellerProduct.findUnique({
                        where: { id: item.id },
                        select: { productId: true }
                    });
                    if (resellerProduct) productId = resellerProduct.productId;
                }

                if (productId) {
                    const product = await tx.product.findUnique({
                        where: { id: productId },
                        include: { ingredients: true }
                    });

                    if (product) {
                        for (const ingredient of product.ingredients) {
                            const totalQuantityUsed = ingredient.quantityUsed * item.quantity;

                            // Find inventory item for this material
                            const inventoryItem = await tx.inventoryItem.findFirst({
                                where: { materialId: ingredient.materialId }
                            });

                            if (inventoryItem) {
                                await tx.inventoryItem.update({
                                    where: { id: inventoryItem.id },
                                    data: { quantity: inventoryItem.quantity - totalQuantityUsed }
                                });
                            }
                        }
                    }
                }
            }

            return sale;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error creating sale:', error);
        return NextResponse.json({ error: 'Error creating sale' }, { status: 500 });
    }
}
