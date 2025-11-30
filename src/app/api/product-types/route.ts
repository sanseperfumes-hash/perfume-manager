import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const types = await prisma.productType.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(types);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching product types' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const type = await prisma.productType.create({
            data: { name }
        });

        return NextResponse.json(type);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating product type' }, { status: 500 });
    }
}
