'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Calendar, TrendingUp, ShoppingBag, Loader2, Plus, X, Wallet, User } from 'lucide-react';

interface SaleItem {
    id: string;
    productName: string;
    quantity: number;
    priceAtSale: number;
}

interface Sale {
    id: string;
    total: number;
    createdAt: string;
    items: SaleItem[];
}

interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string;
    payerId: string | null;
    payer?: {
        username: string;
    };
}

interface User {
    id: string;
    username: string;
}

export default function SalesPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showExpenseModal, setShowExpenseModal] = useState(false);

    // Expense Form
    const [expenseDesc, setExpenseDesc] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expensePayer, setExpensePayer] = useState('SANSE'); // Default to Sanse

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [salesRes, expensesRes, usersRes] = await Promise.all([
                fetch('/api/sales'),
                fetch('/api/expenses'),
                fetch('/api/users')
            ]);

            setSales(await salesRes.json());
            setExpenses(await expensesRes.json());
            setUsers(await usersRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: expenseDesc,
                    amount: parseFloat(expenseAmount), // Ensure amount is a number
                    payerId: expensePayer === 'SANSE' ? null : expensePayer
                }),
            });

            if (res.ok) {
                setShowExpenseModal(false);
                setExpenseDesc('');
                setExpenseAmount('');
                setExpensePayer('SANSE');
                fetchData();
            } else {
                console.error('Failed to create expense:', await res.text());
            }
        } catch (error) {
            console.error('Error creating expense:', error);
        }
    };

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalSalesCount = sales.length; // Keep this for potential future use or if it was intended to be displayed

    const totalExpensesSanse = expenses
        .filter(e => e.payerId === null)
        .reduce((sum, e) => sum + e.amount, 0);

    const cashFlow = totalRevenue - totalExpensesSanse;

    // Calculate debts (Money owed to users who paid expenses)
    const debts = expenses
        .filter(e => e.payerId !== null)
        .reduce((acc, e) => {
            const payerName = e.payer?.username || 'Desconocido';
            acc[payerName] = (acc[payerName] || 0) + e.amount;
            return acc;
        }, {} as Record<string, number>);

    return (
        <div>
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <DollarSign className="w-8 h-8 text-green-400" />
                        Ventas y Gastos
                    </h1>
                    <p className="text-gray-400 mt-2">Historial de movimientos y balance general.</p>
                </div>
                <button
                    onClick={() => setShowExpenseModal(true)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-red-500/20 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Agregar Gasto
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Ingresos Totales</p>
                            <p className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/20 rounded-lg">
                            <Wallet className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Caja Sanse (Neta)</p>
                            <p className="text-2xl font-bold text-white">${cashFlow.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {Object.entries(debts).map(([user, amount]) => (
                    <div key={user} className="bg-gradient-to-br from-red-900/30 to-orange-900/30 backdrop-blur-xl border border-white/10 p-6 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/20 rounded-lg">
                                <User className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Deuda a {user}</p>
                                <p className="text-2xl font-bold text-red-400">${amount.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales History */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden h-fit">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            Historial de Ventas
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-12 flex justify-center text-purple-400">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto max-h-[500px]">
                            <table className="w-full text-left">
                                <thead className="bg-black/20 text-gray-400 text-sm uppercase sticky top-0 backdrop-blur-md">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Fecha</th>
                                        <th className="px-6 py-4 font-medium">Detalle</th>
                                        <th className="px-6 py-4 font-medium text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {sales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-gray-300 text-sm">
                                                {new Date(sale.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                <div className="space-y-1">
                                                    {sale.items.map((item) => (
                                                        <div key={item.id} className="text-sm">
                                                            <span className="text-purple-300 font-medium">{item.quantity}x</span> {item.productName}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-green-400 font-bold font-mono">
                                                ${sale.total.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    {sales.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                                No hay ventas registradas.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Expenses History */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden h-fit">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-gray-400" />
                            Historial de Gastos
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-12 flex justify-center text-purple-400">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto max-h-[500px]">
                            <table className="w-full text-left">
                                <thead className="bg-black/20 text-gray-400 text-sm uppercase sticky top-0 backdrop-blur-md">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Fecha</th>
                                        <th className="px-6 py-4 font-medium">Descripción</th>
                                        <th className="px-6 py-4 font-medium">Pagado Por</th>
                                        <th className="px-6 py-4 font-medium text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {expenses.map((expense) => (
                                        <tr key={expense.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-gray-300 text-sm">
                                                {new Date(expense.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-white text-sm">
                                                {expense.description}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {expense.payerId ? (
                                                    <span className="text-red-300 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                                                        {expense.payer?.username}
                                                    </span>
                                                ) : (
                                                    <span className="text-green-300 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                                                        Sanse
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right text-red-400 font-bold font-mono">
                                                -${expense.amount.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    {expenses.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                No hay gastos registrados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Expense Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setShowExpenseModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-white mb-6">Registrar Nuevo Gasto</h2>

                        <form onSubmit={handleCreateExpense} className="space-y-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Descripción</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Compra de insumos"
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={expenseDesc}
                                    onChange={e => setExpenseDesc(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Monto</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full pl-8 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={expenseAmount}
                                        onChange={e => setExpenseAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Pagado por</label>
                                <select
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none [&>option]:bg-gray-900"
                                    value={expensePayer}
                                    onChange={e => setExpensePayer(e.target.value)}
                                >
                                    <option value="SANSE">Caja Sanse (Negocio)</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.username}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-2">
                                    Si selecciona un usuario, se registrará como una deuda a reembolsar.
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-bold"
                            >
                                Guardar Gasto
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
