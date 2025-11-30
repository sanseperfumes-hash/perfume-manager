'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Loader2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Material {
    id: string;
    name: string;
    unit: string;
    purchaseCost: number;
    purchaseQuantity: number;
    costPerUnit: number;
}

export default function InsumosPage() {
    const { user } = useAuth();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        type: 'Esencia',
        unit: 'g',
        purchaseCost: '',
        purchaseQuantity: '',
    });

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            const res = await fetch('/api/materials');
            const data = await res.json();
            setMaterials(data);
        } catch (error) {
            console.error('Error fetching materials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (material: Material) => {
        setEditingId(material.id);
        setFormData({
            name: material.name,
            type: 'Esencia', // Default or derived if we had it
            unit: material.unit,
            purchaseCost: material.purchaseCost.toString(),
            purchaseQuantity: material.purchaseQuantity.toString(),
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este insumo?')) return;

        try {
            const res = await fetch(`/api/materials/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchMaterials();
            }
        } catch (error) {
            console.error('Error deleting material:', error);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: '', type: 'Esencia', unit: 'g', purchaseCost: '', purchaseQuantity: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Auto-convert larger units to base units (L -> ml, Kg -> g)
            let finalQuantity = Number(formData.purchaseQuantity);
            let finalUnit = formData.unit;

            if (formData.unit === 'l') {
                finalQuantity = finalQuantity * 1000;
                finalUnit = 'ml';
            } else if (formData.unit === 'kg') {
                finalQuantity = finalQuantity * 1000;
                finalUnit = 'g';
            }

            const payload = {
                ...formData,
                purchaseQuantity: finalQuantity,
                unit: finalUnit,
            };

            let res;
            if (editingId) {
                res = await fetch(`/api/materials/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch('/api/materials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }

            if (res.ok) {
                closeModal();
                fetchMaterials();
            }
        } catch (error) {
            console.error('Error saving material:', error);
        }
    };

    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Insumos</h1>
                    <p className="text-gray-400 mt-2">Gestiona tus materias primas y costos.</p>
                </div>
                {user?.role !== 'VIEWER' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-lg shadow-purple-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nuevo Insumo</span>
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-xl mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar insumo..."
                        className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Materials Table */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center text-purple-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-black/20 text-gray-400 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4 font-medium">Nombre</th>
                                <th className="px-6 py-4 font-medium">Stock Inicial</th>
                                <th className="px-6 py-4 font-medium">Costo Lote</th>
                                <th className="px-6 py-4 font-medium">Costo Unitario</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredMaterials.map((material) => (
                                <tr key={material.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-white font-medium">{material.name}</td>
                                    <td className="px-6 py-4 text-gray-300">
                                        {material.purchaseQuantity} {material.unit}
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">
                                        ${material.purchaseCost.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-green-400 font-medium">
                                        ${material.costPerUnit.toFixed(2)} / {material.unit}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {user?.role !== 'VIEWER' && (
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEdit(material)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(material.id)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredMaterials.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No se encontraron insumos.
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
                            {editingId ? 'Editar Insumo' : 'Agregar Nuevo Insumo'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Nombre</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Esencia de Rosas"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Cantidad Compra</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={formData.purchaseQuantity}
                                        onChange={e => setFormData({ ...formData, purchaseQuantity: e.target.value })}
                                        placeholder="100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Unidad</label>
                                    <select
                                        className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                    >
                                        <option value="g">Gramos (g)</option>
                                        <option value="kg">Kilogramos (kg)</option>
                                        <option value="ml">Mililitros (ml)</option>
                                        <option value="l">Litros (l)</option>
                                        <option value="u">Unidades (u)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Costo Total de Compra ($)</label>
                                <input
                                    required
                                    type="number"
                                    className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.purchaseCost}
                                    onChange={e => setFormData({ ...formData, purchaseCost: e.target.value })}
                                    placeholder="5000"
                                />
                            </div>

                            {(formData.unit === 'l' || formData.unit === 'kg') && (
                                <div className="text-xs text-blue-400 bg-blue-500/10 p-2 rounded border border-blue-500/20">
                                    ℹ️ Se convertirá automáticamente a {formData.unit === 'l' ? 'mililitros (x1000)' : 'gramos (x1000)'} para facilitar los cálculos.
                                </div>
                            )}

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
                                    {editingId ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
