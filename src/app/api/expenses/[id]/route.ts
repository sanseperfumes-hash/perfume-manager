import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        console.log(`[DELETE Expense] Attempting to delete expense ${params.id}`);
        const user = await getUserFromRequest(request);
        console.log('[DELETE Expense] User:', user);

        if (!user) {
            console.log('[DELETE Expense] No user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'ADMIN' && user.role !== 'EDITOR') {
            console.log('[DELETE Expense] Insufficient permissions:', user.role);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Verify expense exists
        const expense = await prisma.expense.findUnique({
            where: { id: params.id }
        });

        if (!expense) {
            console.log('[DELETE Expense] Expense not found');
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        await prisma.expense.delete({
            where: { id: params.id }
        });

        console.log('[DELETE Expense] Success');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[DELETE Expense] Error:', error);
        return NextResponse.json(
            { error: 'Error deleting expense' },
            { status: 500 }
        );
    }
}
