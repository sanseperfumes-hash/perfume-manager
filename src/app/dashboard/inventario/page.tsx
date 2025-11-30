'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Loader2, X, AlertTriangle, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MaterialType {
    id: string;
    name: string;
}

interface Material {
    id: string;
    name: string;
    unit: string;
    supplier: string;
    type?: MaterialType;
    typeId?: string;
}

interface InventoryItem {
    id: string;
    materialId: string;
    quantity: number;
    minStock: number;
    unit: string;
    material: Material;
}

export default function InventoryPage() {
    const { user } = useAuth();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        materialId: '',
        quantity: '',
        minStock: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [invRes, matRes, typesRes] = await Promise.all([
                fetch('/api/inventory'),
                fetch('/api/materials'),
                fetch('/api/material-types')
            ]);

            if (invRes.ok) setInventory(await invRes.json());
            if (matRes.ok) setMaterials(await matRes.json());
            if (typesRes.ok) setMaterialTypes(await typesRes.json());

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: InventoryItem) => {
        setEditingId(item.id);
        setFormData({
            materialId: item.materialId,
            quantity: item.quantity.toString(),
            minStock: item.minStock.toString(),
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este ítem del inventario?')) return;

        try {
            const res = await fetch(`/api/inventory/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || 'Error al eliminar ítem');
            }
        } catch (error) {
            console.error('Error deleting inventory item:', error);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ materialId: '', quantity: '', minStock: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                materialId: formData.materialId,
                quantity: parseFloat(formData.quantity),
                minStock: parseFloat(formData.minStock),
            };

            let res;
            if (editingId) {
                res = await fetch(`/api/inventory/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch('/api/inventory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }

            if (res.ok) {
                closeModal();
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error saving inventory:', error);
        }
    };

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.material.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || item.material.typeId === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Inventario</h1>
                    <p className="text-gray-400 mt-2">Control de stock y alertas de reposición.</p>
                </div>
                {user?.role !== 'VIEWER' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-lg shadow-purple-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Agregar Stock</span>
                    </button>
                )}
            </div>

            {/* Search and Filters */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-xl mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar en inventario..."
                            className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Type Filter */}
                    <div>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-gray-900"
                        >
                            <option value="all">Todos los tipos</option>
                            {materialTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center text-purple-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-black/20 text-gray-400 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4 font-medium">Material</th>
                                <th className="px-6 py-4 font-medium">Tipo</th>
                                <th className="px-6 py-4 font-medium">Proveedor</th>
                                <th className="px-6 py-4 font-medium">Stock Actual</th>
                                <th className="px-6 py-4 font-medium">Stock Mínimo</th>
                                <th className="px-6 py-4 font-medium">Estado</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredInventory.map((item) => {
                                const isLowStock = item.quantity <= item.minStock;
                                return (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-white font-medium">
                                            {item.material.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            <span className="bg-white/10 px-2 py-1 rounded text-xs">
                                                {item.material.type?.name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {item.material.supplier}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 font-bold">
                                            {item.quantity} {item.unit}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {item.minStock} {item.unit}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isLowStock ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                    Bajo Stock
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                    <Package className="w-3 h-3 mr-1" />
                                                    OK
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {user?.role !== 'VIEWER' && (
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredInventory.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No hay ítems en el inventario.
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
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-white mb-4">
                            {editingId ? 'Actualizar Stock' : 'Agregar al Inventario'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Material</label>
                                <select
                                    required
                                    disabled={!!editingId}
                                    className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50"
                                    value={formData.materialId}
                                    onChange={e => setFormData({ ...formData, materialId: e.target.value })}
                                >
                                    <option value="">Seleccionar Material</option>
                                    {materials.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({m.unit}) - {m.supplier}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Cantidad en Stock</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.quantity}
                                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Stock Mínimo (Alerta)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.minStock}
                                    onChange={e => setFormData({ ...formData, minStock: e.target.value })}
                                    placeholder="0"
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
