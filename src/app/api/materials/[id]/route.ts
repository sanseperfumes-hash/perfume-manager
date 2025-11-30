import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, unit, purchaseCost, purchaseQuantity } = body;

        // Calculate cost per unit
        const costPerUnit = Number(purchaseCost) / Number(purchaseQuantity);

        const material = await prisma.material.update({
            where: { id },
            data: {
                name,
                unit,
                purchaseCost: Number(purchaseCost),
                purchaseQuantity: Number(purchaseQuantity),
                costPerUnit,
            },
        });

        return NextResponse.json(material);
    } catch (error) {
        console.error('Error updating material:', error);
        return NextResponse.json(
            { error: 'Error al actualizar insumo' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.material.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting material:', error);

        if (error.code === 'P2003') {
            return NextResponse.json(
                { error: 'No se puede eliminar el insumo porque está siendo usado en uno o más productos.' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Error al eliminar insumo' },
            { status: 500 }
        );
    }
}
