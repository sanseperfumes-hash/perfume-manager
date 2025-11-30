import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const resellerProducts = await prisma.resellerProduct.findMany({
            include: {
                product: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(resellerProducts);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching reseller products' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productId, profitMargin } = body;

        // Fetch the base product to calculate price
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Calculate reseller price based on base COST + Reseller Margin
        // User requirement: "el producto me lo traiga con el valor del costo no del precio de venta"
        const price = product.cost * (1 + profitMargin / 100);

        const resellerProduct = await prisma.resellerProduct.create({
            data: {
                productId,
                profitMargin: Number(profitMargin),
                price
            },
            include: {
                product: true
            }
        });

        return NextResponse.json(resellerProduct);
    } catch (error) {
        console.error('Error creating reseller product:', error);
        return NextResponse.json({ error: 'Error creating reseller product' }, { status: 500 });
    }
}
