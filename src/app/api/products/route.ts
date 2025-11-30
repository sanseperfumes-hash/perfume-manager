import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                ingredients: {
                    include: {
                        material: true
                    }
                }
            }
        });
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching products' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, cost, profitMargin, finalPrice, ingredients } = body;

        const product = await prisma.product.create({
            data: {
                name,
                cost,
                profitMargin,
                finalPrice,
                ingredients: {
                    create: ingredients.map((ing: any) => ({
                        materialId: ing.materialId,
                        quantityUsed: Number(ing.quantity)
                    }))
                }
            },
            include: {
                ingredients: true
            }
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Error creating product' }, { status: 500 });
    }
}
