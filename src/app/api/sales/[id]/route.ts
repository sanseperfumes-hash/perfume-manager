import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        // 1. Check Auth & Role
        const user = await getUserFromRequest(request);

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userRole = user.role;

        if (userRole !== 'ADMIN' && userRole !== 'EDITOR') {
            return NextResponse.json({ error: 'No tienes permisos para eliminar ventas' }, { status: 403 });
        }

        const saleId = params.id;

        // 2. Get Sale with Items and Product Ingredients
        const sale = await prisma.sale.findUnique({
            where: { id: saleId },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                ingredients: true
                            }
                        },
                        resellerProduct: {
                            include: {
                                product: {
                                    include: {
                                        ingredients: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!sale) {
            return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
        }

        // 3. Transaction: Restore Stock & Delete Sale
        await prisma.$transaction(async (tx) => {
            // Restore stock for each item
            for (const item of sale.items) {
                const product = item.product || item.resellerProduct?.product;

                if (product && product.ingredients) {
                    for (const ingredient of product.ingredients) {
                        const quantityToRestore = item.quantity * ingredient.quantityUsed;

                        // Find inventory item for this material
                        const inventoryItem = await tx.inventoryItem.findFirst({
                            where: { materialId: ingredient.materialId }
                        });

                        if (inventoryItem) {
                            await tx.inventoryItem.update({
                                where: { id: inventoryItem.id },
                                data: {
                                    quantity: { increment: quantityToRestore }
                                }
                            });
                        }
                    }
                }
            }

            // Delete Sale
            await tx.sale.delete({
                where: { id: saleId }
            });
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting sale:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: `Error al eliminar venta: ${errorMessage}` }, { status: 500 });
    }
}
