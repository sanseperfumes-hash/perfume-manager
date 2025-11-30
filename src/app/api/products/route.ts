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
                },
                type: true
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
        const { name, cost, profitMargin, finalPrice, ingredients, gender, typeId } = body;

        if (!name || !ingredients || ingredients.length === 0) {
            return NextResponse.json({ error: 'Name and ingredients are required' }, { status: 400 });
        }

        const product = await prisma.product.create({
            data: {
                name,
                cost,
                profitMargin,
                finalPrice,
                gender: gender || 'UNISEX',
                typeId: typeId || null,
                ingredients: {
                    create: ingredients.map((i: any) => ({
                        materialId: i.materialId,
                        quantityUsed: Number(i.quantity)
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
