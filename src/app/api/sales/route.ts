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

        const sale = await prisma.sale.create({
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

        return NextResponse.json(sale);
    } catch (error) {
        console.error('Error creating sale:', error);
        return NextResponse.json({ error: 'Error creating sale' }, { status: 500 });
    }
}
