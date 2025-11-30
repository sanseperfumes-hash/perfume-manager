'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Tag, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
    id: string;
    name: string;
    cost: number;
    finalPrice: number;
    profitMargin: number;
}

export default function PriceListPage() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleProductSelection = (productId: string) => {
        const newSelection = new Set(selectedProducts);
        if (newSelection.has(productId)) {
            newSelection.delete(productId);
        } else {
            newSelection.add(productId);
        }
        setSelectedProducts(newSelection);
    };

    const handleRegisterSale = async () => {
        if (selectedProducts.size === 0) return;

        if (!confirm(`¿Confirmar venta de ${selectedProducts.size} productos?`)) return;

        const itemsToSell = products
            .filter(p => selectedProducts.has(p.id))
            .map(p => ({
                type: 'RETAIL',
                id: p.id,
                quantity: 1, // Default to 1 for now
                price: p.finalPrice,
                name: p.name
            }));

        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: itemsToSell }),
            });

            if (res.ok) {
                alert('Venta registrada exitosamente');
                setSelectedProducts(new Set());
            } else {
                alert('Error al registrar la venta');
            }
        } catch (error) {
            console.error('Error registering sale:', error);
            alert('Error al registrar la venta');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative">
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Tag className="w-8 h-8 text-purple-400" />
                        Lista de Precios Minorista
                    </h1>
                    <p className="text-gray-400 mt-2">Tus productos y precios de venta al público.</p>
                </div>

                {user?.role !== 'VIEWER' && selectedProducts.size > 0 && (
                    <button
                        onClick={handleRegisterSale}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-4"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        Registrar Venta ({selectedProducts.size})
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-xl mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center text-purple-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/40 text-gray-400 text-xs uppercase tracking-wider border-b border-white/10">
                                    <th className="w-12 px-6 py-4">
                                        <div className="w-4 h-4" />
                                    </th>
                                    <th className="px-6 py-4 font-medium">Perfume</th>
                                    <th className="px-6 py-4 font-medium">Costo Producción</th>
                                    <th className="px-6 py-4 font-medium">Margen</th>
                                    <th className="px-6 py-4 font-medium text-right">Precio Venta</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredProducts.map((product) => {
                                    const isSelected = selectedProducts.has(product.id);
                                    return (
                                        <tr
                                            key={product.id}
                                            className={`transition-colors cursor-pointer ${isSelected ? 'bg-purple-500/10 hover:bg-purple-500/20' : 'hover:bg-white/5'}`}
                                            onClick={() => toggleProductSelection(product.id)}
                                        >
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => { }} // Handled by row click
                                                    className="w-4 h-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500 bg-gray-800"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-white font-medium text-sm">
                                                {product.name}
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-sm font-mono">
                                                ${product.cost.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded text-xs font-medium border border-purple-500/20">
                                                    {product.profitMargin}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-green-400 font-bold font-mono">
                                                    ${product.finalPrice.toFixed(2)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No se encontraron productos. Ve al Armador para crear uno.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
