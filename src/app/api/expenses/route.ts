import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const expenses = await prisma.expense.findMany({
            include: {
                payer: {
                    select: {
                        username: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });
        return NextResponse.json(expenses);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching expenses' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { description, amount, payerId } = body;

        const expense = await prisma.expense.create({
            data: {
                description,
                amount: Number(amount),
                payerId: payerId === 'SANSE' ? null : payerId
            },
            include: {
                payer: true
            }
        });

        return NextResponse.json(expense);
    } catch (error) {
        console.error('Error creating expense:', error);
        return NextResponse.json({ error: 'Error creating expense' }, { status: 500 });
    }
}
