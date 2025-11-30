'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Users, X, ShoppingCart } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    cost: number;
}

interface ResellerProduct {
    id: string;
    product: Product;
    profitMargin: number;
    price: number;
}

export default function ResellersPage() {
    const [resellerProducts, setResellerProducts] = useState<ResellerProduct[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    // Form State
    const [selectedProductId, setSelectedProductId] = useState('');
    const [profitMargin, setProfitMargin] = useState(30);

    useEffect(() => {
        fetchResellerProducts();
        fetchProducts();
    }, []);

    const fetchResellerProducts = async () => {
        try {
            const res = await fetch('/api/reseller-products');
            const data = await res.json();
            setResellerProducts(data);
        } catch (error) {
            console.error('Error fetching reseller products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const toggleItemSelection = (itemId: string) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(itemId)) {
            newSelection.delete(itemId);
        } else {
            newSelection.add(itemId);
        }
        setSelectedItems(newSelection);
    };

    const handleRegisterSale = async () => {
        if (selectedItems.size === 0) return;

        if (!confirm(`¿Confirmar venta de ${selectedItems.size} productos a revendedores?`)) return;

        const itemsToSell = resellerProducts
            .filter(item => selectedItems.has(item.id))
            .map(item => ({
                type: 'RESELLER',
                id: item.id,
                quantity: 1, // Default to 1
                price: item.price,
                name: item.product.name
            }));

        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: itemsToSell }),
            });

            if (res.ok) {
                alert('Venta registrada exitosamente');
                setSelectedItems(new Set());
            } else {
                alert('Error al registrar la venta');
            }
        } catch (error) {
            console.error('Error registering sale:', error);
            alert('Error al registrar la venta');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/reseller-products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProductId,
                    profitMargin
                }),
            });

            if (res.ok) {
                setShowModal(false);
                setSelectedProductId('');
                setProfitMargin(30);
                fetchResellerProducts();
            }
        } catch (error) {
            console.error('Error creating reseller product:', error);
        }
    };

    const selectedProduct = products.find(p => p.id === selectedProductId);
    const calculatedPrice = selectedProduct
        ? selectedProduct.cost * (1 + profitMargin / 100)
        : 0;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-purple-400" />
                        Lista de Revendedores
                    </h1>
                    <p className="text-gray-400 mt-2">Ofertas especiales para venta mayorista.</p>
                </div>

                <div className="flex gap-4">
                    {selectedItems.size > 0 && (
                        <button
                            onClick={handleRegisterSale}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-lg shadow-green-500/20 animate-in fade-in"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            <span>Registrar Venta ({selectedItems.size})</span>
                        </button>
                    )}
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-lg shadow-purple-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Agregar Producto</span>
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center text-purple-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-black/20 text-gray-400 text-sm uppercase">
                            <tr>
                                <th className="w-12 px-6 py-4">
                                    <div className="w-4 h-4" />
                                </th>
                                <th className="px-6 py-4 font-medium">Producto</th>
                                <th className="px-6 py-4 font-medium">Costo Base</th>
                                <th className="px-6 py-4 font-medium">Margen Revendedor</th>
                                <th className="px-6 py-4 font-medium text-right">Precio Final</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {resellerProducts.map((item) => {
                                const isSelected = selectedItems.has(item.id);
                                return (
                                    <tr
                                        key={item.id}
                                        className={`transition-colors cursor-pointer ${isSelected ? 'bg-purple-500/10 hover:bg-purple-500/20' : 'hover:bg-white/5'}`}
                                        onClick={() => toggleItemSelection(item.id)}
                                    >
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => { }}
                                                className="w-4 h-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500 bg-gray-800"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">{item.product.name}</td>
                                        <td className="px-6 py-4 text-gray-300">${item.product.cost.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-blue-400">{item.profitMargin}%</td>
                                        <td className="px-6 py-4 text-right text-green-400 font-bold text-lg">
                                            ${item.price.toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
                            {resellerProducts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No hay productos para revendedores.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-white mb-6">Agregar a Revendedores</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Seleccionar Producto</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none [&>option]:bg-gray-900"
                                    value={selectedProductId}
                                    onChange={e => setSelectedProductId(e.target.value)}
                                >
                                    <option value="">Seleccione un producto...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} (Costo: ${p.cost.toFixed(2)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedProduct && (
                                <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Margen de Ganancia (%)</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="0"
                                                max="200"
                                                value={profitMargin}
                                                onChange={(e) => setProfitMargin(Number(e.target.value))}
                                                className="flex-1 accent-purple-500"
                                            />
                                            <input
                                                type="number"
                                                value={profitMargin}
                                                onChange={(e) => setProfitMargin(Number(e.target.value))}
                                                className="w-16 bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-right focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end pt-2 border-t border-white/10">
                                        <span className="text-gray-400">Precio Revendedor:</span>
                                        <span className="text-2xl font-bold text-green-400">
                                            ${calculatedPrice.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!selectedProductId}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Guardar Oferta
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
