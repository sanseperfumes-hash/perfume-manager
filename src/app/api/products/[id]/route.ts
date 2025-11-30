import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if product is in any sale
        const salesCount = await prisma.saleItem.count({
            where: { productId: id }
        });

        if (salesCount > 0) {
            // Optional: Block deletion or allow it. 
            // For now, we allow it but warn if needed. 
            // Ideally, we should probably just let it happen if the user insists.
        }

        await prisma.product.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting product:', error);
        if (error.code === 'P2003') {
            return NextResponse.json(
                { error: 'No se puede eliminar el producto porque tiene ventas asociadas.' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Error al eliminar producto' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, profitMargin, ingredients, gender, typeId } = body;

        // 1. Get current product to check existence
        const currentProduct = await prisma.product.findUnique({
            where: { id },
            include: { ingredients: true }
        });

        if (!currentProduct) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // 2. Calculate new cost if ingredients provided
        let newCost = currentProduct.cost;
        if (ingredients) {
            newCost = 0;
            for (const item of ingredients) {
                const material = await prisma.material.findUnique({
                    where: { id: item.materialId }
                });
                if (material) {
                    newCost += material.costPerUnit * Number(item.quantityUsed);
                }
            }
        }

        // 3. Calculate new final price
        const margin = profitMargin !== undefined ? Number(profitMargin) : currentProduct.profitMargin;
        const finalPrice = newCost * (1 + margin / 100);

        // 4. Update product
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                name: name || undefined,
                cost: newCost,
                profitMargin: margin,
                finalPrice,
                gender: gender || undefined,
                typeId: typeId || undefined,
                ingredients: ingredients ? {
                    deleteMany: {}, // Remove old ingredients
                    create: ingredients.map((i: any) => ({
                        materialId: i.materialId,
                        quantityUsed: Number(i.quantityUsed)
                    }))
                } : undefined
            },
            include: {
                ingredients: {
                    include: { material: true }
                },
                type: true
            }
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Error updating product' }, { status: 500 });
    }
}
