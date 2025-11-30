import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const types = await prisma.materialType.findMany({
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(types);
    } catch (error) {
        console.error('Error fetching material types:', error);
        return NextResponse.json({ error: 'Error fetching material types' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const newType = await prisma.materialType.create({
            data: { name },
        });

        return NextResponse.json(newType);
    } catch (error) {
        console.error('Error creating material type:', error);
        return NextResponse.json({ error: 'Error creating material type' }, { status: 500 });
    }
}
