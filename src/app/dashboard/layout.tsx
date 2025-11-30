'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FlaskConical, Calculator, Users, LogOut, Tag, DollarSign, Package } from 'lucide-react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'EDITOR', 'VIEWER'] },
    { name: 'Insumos', href: '/dashboard/insumos', icon: FlaskConical, roles: ['ADMIN', 'EDITOR', 'VIEWER'] },
    { name: 'Inventario', href: '/dashboard/inventario', icon: Package, roles: ['ADMIN', 'EDITOR'] },
    { name: 'Armador de Productos', href: '/dashboard/calculadora', icon: Calculator, roles: ['ADMIN', 'EDITOR', 'VIEWER'] },
    { name: 'Lista de Precios', href: '/dashboard/precios', icon: Tag, roles: ['ADMIN', 'EDITOR', 'VIEWER'] },
    { name: 'Revendedores', href: '/dashboard/revendedores', icon: Users, roles: ['ADMIN', 'EDITOR', 'VIEWER'] },
    { name: 'Ventas y Gastos', href: '/dashboard/ventas', icon: DollarSign, roles: ['ADMIN', 'EDITOR', 'VIEWER'] },
    { name: 'Usuarios', href: '/dashboard/usuarios', icon: Users, roles: ['ADMIN'] }, // Only ADMIN
];
function SidebarContent() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    if (!user) return null; // Or a loading skeleton

    return (
        <aside className="w-64 bg-gray-800/50 backdrop-blur-xl border-r border-white/10 flex flex-col fixed h-full z-10">
            <div className="p-6 border-b border-white/10">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Perfume Manager
                </h1>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                    {user.role}
                </p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navigation.map((item) => {
                    if (!item.roles.includes(user.role)) return null;

                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${isActive
                                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-gray-900 text-white flex">
                <SidebarContent />
                {/* Main Content */}
                <main className="flex-1 ml-64 p-8 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 min-h-screen">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </AuthProvider>
    );
}
