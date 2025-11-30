export default function DashboardPage() {
    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white">Panel de Control</h1>
                <p className="text-gray-400 mt-2">Bienvenido al sistema de gestión de perfumes.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-xl">
                    <h3 className="text-gray-400 text-sm font-medium">Total Insumos</h3>
                    <p className="text-3xl font-bold text-white mt-2">24</p>
                </div>

                <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-xl">
                    <h3 className="text-gray-400 text-sm font-medium">Productos Activos</h3>
                    <p className="text-3xl font-bold text-white mt-2">12</p>
                </div>

                <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-xl">
                    <h3 className="text-gray-400 text-sm font-medium">Valor Inventario</h3>
                    <p className="text-3xl font-bold text-green-400 mt-2">$450.000</p>
                </div>
            </div>

            <div className="mt-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Actividad Reciente</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-white/5">
                        <div>
                            <p className="text-white font-medium">Nuevo insumo agregado</p>
                            <p className="text-sm text-gray-500">Esencia de Jazmín - 500g</p>
                        </div>
                        <span className="text-xs text-gray-500">Hace 2 horas</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/5">
                        <div>
                            <p className="text-white font-medium">Precio actualizado</p>
                            <p className="text-sm text-gray-500">Perfume Floral #5</p>
                        </div>
                        <span className="text-xs text-gray-500">Hace 5 horas</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
