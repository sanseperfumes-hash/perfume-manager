import { PrismaClient } from '@prisma/client';
import { formatPrice } from '@/lib/utils';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const [
        materialCount,
        productCount,
        inventoryValue
    ] = await Promise.all([
        prisma.material.count(),
        prisma.product.count(),
        prisma.material.aggregate({
            _sum: {
                purchaseCost: true
            }
        })
    ]);

    return (
        <div>
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        Panel de Control
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/20">
                            v2.2 (GitHub Test)
                        </span>
                    </h1>
                    <p className="text-gray-400 mt-2">Bienvenido al sistema de gestión de perfumes.</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                    Datos actualizados: {new Date().toLocaleTimeString()}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-xl">
                    <h3 className="text-gray-400 text-sm font-medium">Total Insumos</h3>
                    <p className="text-3xl font-bold text-white mt-2">{materialCount}</p>
                </div>

                <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-xl">
                    <h3 className="text-gray-400 text-sm font-medium">Productos Activos</h3>
                    <p className="text-3xl font-bold text-white mt-2">{productCount}</p>
                </div>

                <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-xl">
                    <h3 className="text-gray-400 text-sm font-medium">Valor Inventario (Costo)</h3>
                    <p className="text-3xl font-bold text-green-400 mt-2">
                        {formatPrice(inventoryValue._sum.purchaseCost || 0)}
                    </p>
                </div>
            </div>

            <div className="mt-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Actividad Reciente</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-white/5">
                        <div>
                            <p className="text-white font-medium">Sistema Actualizado</p>
                            <p className="text-sm text-gray-500">Sincronización de precios y productos</p>
                        </div>
                        <span className="text-xs text-gray-500">Reciente</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
