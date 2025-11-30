import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const inventory = await prisma.inventoryItem.findMany({
            include: {
                material: {
                    include: {
                        type: true
                    }
                },
            },
            orderBy: {
                material: {
                    name: 'asc',
                },
            },
        });
        return NextResponse.json(inventory);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return NextResponse.json({ error: 'Error fetching inventory' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { materialId, quantity, unit } = body;

        if (!materialId || quantity === undefined || !unit) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if item already exists for this material
        const existingItem = await prisma.inventoryItem.findFirst({
            where: { materialId },
        });

        if (existingItem) {
            // Update existing
            const updatedItem = await prisma.inventoryItem.update({
                where: { id: existingItem.id },
                data: {
                    quantity: existingItem.quantity + Number(quantity),
                    lastRestocked: new Date(),
                },
                include: { material: true },
            });
            return NextResponse.json(updatedItem);
        } else {
            // Create new
            const newItem = await prisma.inventoryItem.create({
                data: {
                    materialId,
                    quantity: Number(quantity),
                    unit,
                    lastRestocked: new Date(),
                },
                include: { material: true },
            });
            return NextResponse.json(newItem);
        }

    } catch (error) {
        console.error('Error creating inventory item:', error);
        return NextResponse.json({ error: 'Error creating inventory item' }, { status: 500 });
    }
}
