import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, amount } = body;

        if (!userId || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
        }

        // 1. Find all expenses paid by this user
        const userExpenses = await prisma.expense.findMany({
            where: { payerId: userId },
            orderBy: { date: 'asc' }, // Pay oldest first
            include: { refunds: true }
        });

        let remainingRefund = Number(amount);
        const refundsCreated = [];

        // 2. Distribute refund amount across expenses
        for (const expense of userExpenses) {
            if (remainingRefund <= 0) break;

            const alreadyRefunded = expense.refunds.reduce((sum, r) => sum + r.amount, 0);
            const debtRemaining = expense.amount - alreadyRefunded;

            if (debtRemaining > 0) {
                const refundAmount = Math.min(remainingRefund, debtRemaining);

                // Create refund expense
                const refund = await prisma.expense.create({
                    data: {
                        description: `Devolución parcial/total a ${expense.payerId} (Auto)`,
                        amount: refundAmount,
                        payerId: null, // Sanse pays
                        relatedExpenseId: expense.id,
                        date: new Date(),
                    }
                });

                refundsCreated.push(refund);
                remainingRefund -= refundAmount;
            }
        }

        return NextResponse.json({ success: true, refunds: refundsCreated, remaining: remainingRefund });

    } catch (error) {
        console.error('Error processing general refund:', error);
        return NextResponse.json({ error: 'Error al procesar devolución' }, { status: 500 });
    }
}
