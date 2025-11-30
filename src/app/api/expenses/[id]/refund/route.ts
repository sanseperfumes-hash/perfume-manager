import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { amount } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
        }

        const originalExpense = await prisma.expense.findUnique({
            where: { id: params.id },
            include: { payer: true }
        });

        if (!originalExpense) {
            return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });
        }

        if (!originalExpense.payerId) {
            return NextResponse.json({ error: 'Solo se pueden reembolsar gastos pagados por usuarios' }, { status: 400 });
        }

        // Create refund expense (Paid by Sanse -> payerId: null)
        const refund = await prisma.expense.create({
            data: {
                description: `Devolución a ${originalExpense.payer?.username}: ${originalExpense.description}`,
                amount: Number(amount),
                payerId: null, // Sanse pays back
                relatedExpenseId: originalExpense.id,
                date: new Date(),
            }
        });

        return NextResponse.json(refund);

    } catch (error) {
        console.error('Error creating refund:', error);
        return NextResponse.json({ error: 'Error al crear devolución' }, { status: 500 });
    }
}
