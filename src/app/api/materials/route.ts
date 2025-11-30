import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const materials = await prisma.material.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                type: true
            }
        });
        return NextResponse.json(materials);
    } catch (error) {
        return NextResponse.json(
            { error: 'Error al obtener insumos' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, unit, purchaseCost, purchaseQuantity, supplier, typeId, priceStatus } = body;

        // Calculate cost per unit
        const costPerUnit = Number(purchaseCost) / Number(purchaseQuantity);

        const material = await prisma.material.create({
            data: {
                name,
                unit, // "g", "ml", "u"
                purchaseCost: Number(purchaseCost),
                purchaseQuantity: Number(purchaseQuantity),
                costPerUnit,
                supplier: supplier || "Otro",
                typeId: typeId || null,
                priceStatus: priceStatus || "available",
            },
        });

        return NextResponse.json(material);
    } catch (error) {
        console.error('Error creating material:', error);
        return NextResponse.json(
            { error: 'Error al crear insumo' },
            { status: 500 }
        );
    }
}
