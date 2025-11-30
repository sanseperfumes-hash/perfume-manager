import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        if (user.role !== 'ADMIN' && user.role !== 'EDITOR') {
            return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
        }

        const body = await request.json();
        const { quantity, minStock } = body;

        if (quantity === undefined) {
            return NextResponse.json({ error: 'Missing quantity' }, { status: 400 });
        }

        const updatedItem = await prisma.inventoryItem.update({
            where: { id: params.id },
            data: {
                quantity: Number(quantity),
                minStock: minStock !== undefined ? Number(minStock) : undefined,
                lastRestocked: new Date(),
            },
            include: {
                material: {
                    include: {
                        type: true
                    }
                }
            },
        });

        return NextResponse.json(updatedItem);
    } catch (error) {
        console.error('Error updating inventory item:', error);
        return NextResponse.json({ error: 'Error updating inventory item' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        if (user.role !== 'ADMIN' && user.role !== 'EDITOR') {
            return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
        }

        await prisma.inventoryItem.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        return NextResponse.json({ error: 'Error deleting inventory item' }, { status: 500 });
    }
}
