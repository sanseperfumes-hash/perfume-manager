'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Loader2, X, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/utils';

interface MaterialType {
    id: string;
    name: string;
}

interface Material {
    id: string;
    name: string;
    unit: string;
    purchaseCost: number;
    purchaseQuantity: number;
    costPerUnit: number;
    groupName?: string;
    gender?: string;
    supplier: string;
    priceStatus: string; // 'available' or 'consultar'
    supplierUrl?: string;
    lastUpdated?: string;
    typeId?: string;
    type?: MaterialType;
}

export default function InsumosPage() {
    const { user } = useAuth();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState<string>('all');
    const [supplierFilter, setSupplierFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        typeId: '',
        unit: 'g',
        purchaseCost: '',
        purchaseQuantity: '',
        supplier: '',
    });

    // Type Management State
    const [newTypeName, setNewTypeName] = useState('');

    useEffect(() => {
        fetchMaterials();
        fetchMaterialTypes();
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

    const fetchMaterialTypes = async () => {
        try {
            const res = await fetch('/api/material-types');
            const data = await res.json();
            setMaterialTypes(data);
        } catch (error) {
            console.error('Error fetching material types:', error);
        }
    };

    const handleCreateType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTypeName.trim()) return;

        try {
            const res = await fetch('/api/material-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTypeName }),
            });

            if (res.ok) {
                setNewTypeName('');
                fetchMaterialTypes();
            }
        } catch (error) {
            console.error('Error creating type:', error);
        }
    };

    const handleDeleteType = async (id: string) => {
        if (!confirm('¿Estás seguro? Esto podría afectar a los insumos asignados.')) return;
        try {
            const res = await fetch(`/api/material-types/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchMaterialTypes();
            }
        } catch (error) {
            console.error('Error deleting type:', error);
        }
    };

    const handleEdit = (material: Material) => {
        setEditingId(material.id);
        setFormData({
            name: material.name,
            typeId: material.typeId || '',
            unit: material.unit,
            purchaseCost: material.purchaseCost.toString(),
            purchaseQuantity: material.purchaseQuantity.toString(),
            supplier: material.supplier,
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
            } else {
                const data = await res.json();
                alert(data.error || 'Error al eliminar el insumo');
            }
        } catch (error) {
            console.error('Error deleting material:', error);
            alert('Error de conexión al intentar eliminar');
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: '', typeId: '', unit: 'g', purchaseCost: '', purchaseQuantity: '', supplier: '' });
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

    // Group materials by groupName
    const groupedMaterials = useMemo(() => {
        const groups: { [key: string]: Material[] } = {};
        const ungrouped: Material[] = [];

        materials.forEach(m => {
            if (m.groupName) {
                if (!groups[m.groupName]) groups[m.groupName] = [];
                groups[m.groupName].push(m);
            } else {
                ungrouped.push(m);
            }
        });

        return { groups, ungrouped };
    }, [materials]);

    // State for selected size in grouped rows
    const [selectedSizes, setSelectedSizes] = useState<{ [key: string]: string }>({});

    const handleSizeChange = (groupName: string, materialId: string) => {
        setSelectedSizes(prev => ({ ...prev, [groupName]: materialId }));
    };

    // Get unique suppliers for filter
    const uniqueSuppliers = useMemo(() => {
        const suppliers = new Set(materials.map(m => m.supplier));
        return Array.from(suppliers).sort();
    }, [materials]);

    const filteredGroups = Object.keys(groupedMaterials.groups).filter(name => {
        const variants = groupedMaterials.groups[name];
        const firstVariant = variants[0];

        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGender = genderFilter === 'all' || firstVariant.gender === genderFilter;
        const matchesSupplier = supplierFilter === 'all' || firstVariant.supplier === supplierFilter;
        const matchesType = typeFilter === 'all' || firstVariant.typeId === typeFilter;

        return matchesSearch && matchesGender && matchesSupplier && matchesType;
    });

    const filteredUngrouped = groupedMaterials.ungrouped.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGender = genderFilter === 'all' || m.gender === genderFilter;
        const matchesSupplier = supplierFilter === 'all' || m.supplier === supplierFilter;
        const matchesType = typeFilter === 'all' || m.typeId === typeFilter;

        return matchesSearch && matchesGender && matchesSupplier && matchesType;
    });

    // Combine and Paginate
    const allItems = [
        ...filteredGroups.map(group => ({ type: 'group', data: group })),
        ...filteredUngrouped.map(item => ({ type: 'material', data: item }))
    ];

    const totalPages = Math.ceil(allItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = allItems.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Insumos</h1>
                    <p className="text-gray-400 mt-2">Gestiona tus materias primas y costos.</p>
                </div>
                {user?.role !== 'VIEWER' && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowTypeModal(true)}
                            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors border border-white/10"
                        >
                            <Tag className="w-5 h-5" />
                            <span>+ Tipos</span>
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-lg shadow-purple-500/20"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Nuevo Insumo</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Search and Filters */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-xl mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative md:col-span-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar insumo..."
                            className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Gender Filter */}
                    <div>
                        <select
                            value={genderFilter}
                            onChange={(e) => setGenderFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-gray-900"
                        >
                            <option value="all">Todos los géneros</option>
                            <option value="MALE">Masculino</option>
                            <option value="FEMALE">Femenino</option>
                            <option value="UNISEX">Unisex</option>
                            <option value="OTHER">Otro</option>
                        </select>
                    </div>

                    {/* Supplier Filter */}
                    <div>
                        <select
                            value={supplierFilter}
                            onChange={(e) => setSupplierFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-gray-900"
                        >
                            <option value="all">Todos los proveedores</option>
                            {uniqueSuppliers.map(supplier => (
                                <option key={supplier} value={supplier}>{supplier}</option>
                            ))}
                        </select>
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

            {/* Materials Table */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden flex flex-col">
                {loading ? (
                    <div className="p-8 flex justify-center text-purple-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-black/20 text-gray-400 text-sm uppercase">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Nombre</th>
                                        <th className="px-6 py-4 font-medium">Tipo</th>
                                        <th className="px-6 py-4 font-medium">Género</th>
                                        <th className="px-6 py-4 font-medium">Proveedor</th>
                                        <th className="px-6 py-4 font-medium">Stock Inicial</th>
                                        <th className="px-6 py-4 font-medium">Costo Lote</th>
                                        <th className="px-6 py-4 font-medium">Costo Unitario</th>
                                        <th className="px-6 py-4 font-medium text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {paginatedItems.map((item, index) => {
                                        if (item.type === 'group') {
                                            const groupName = item.data as string;
                                            const variants = groupedMaterials.groups[groupName];
                                            variants.sort((a, b) => a.purchaseQuantity - b.purchaseQuantity);

                                            const selectedId = selectedSizes[groupName] || variants[0].id;
                                            const selectedMaterial = variants.find(v => v.id === selectedId) || variants[0];

                                            return (
                                                <tr key={`group-${groupName}`} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 text-white font-medium">
                                                        <div className="flex items-center gap-2">
                                                            {groupName}
                                                            {selectedMaterial.supplierUrl && (
                                                                <div
                                                                    className={`w-2 h-2 rounded-full ${selectedMaterial.lastUpdated ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}
                                                                    title={selectedMaterial.lastUpdated ? `Actualizado: ${new Date(selectedMaterial.lastUpdated).toLocaleString(undefined, { hour12: false })}` : "Error de sincronización"}
                                                                />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-300">
                                                        <span className="bg-white/10 px-2 py-1 rounded text-xs">
                                                            Esencia
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-300">
                                                        {selectedMaterial.gender === 'MALE' && <span className="text-blue-400">Masculino</span>}
                                                        {selectedMaterial.gender === 'FEMALE' && <span className="text-pink-400">Femenino</span>}
                                                        {selectedMaterial.gender === 'UNISEX' && <span className="text-purple-400">Unisex</span>}
                                                        {!selectedMaterial.gender && <span className="text-gray-500">-</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-300">
                                                        {selectedMaterial.supplier}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-300">
                                                        <select
                                                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                            value={selectedId}
                                                            onChange={(e) => handleSizeChange(groupName, e.target.value)}
                                                        >
                                                            {variants.map(v => (
                                                                <option key={v.id} value={v.id}>
                                                                    {v.purchaseQuantity} {v.unit}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-300">
                                                        {selectedMaterial.priceStatus === 'consultar' ? (
                                                            <span className="text-yellow-400 italic">Consultar</span>
                                                        ) : (
                                                            formatPrice(selectedMaterial.purchaseCost)
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-300 font-mono text-green-400">
                                                        {selectedMaterial.priceStatus === 'consultar' ? (
                                                            <span className="text-yellow-400 italic">Consultar</span>
                                                        ) : (
                                                            `${formatPrice(selectedMaterial.costPerUnit)} / ${selectedMaterial.unit}`
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleEdit(selectedMaterial)}
                                                                className="text-blue-400 hover:text-blue-300 p-1 transition-colors"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(selectedMaterial.id)}
                                                                className="text-red-400 hover:text-red-300 p-1 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        // Ungrouped items
                                        return (
                                            <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 text-white font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {item.name}
                                                        {item.supplierUrl && (
                                                            <div
                                                                className={`w-2 h-2 rounded-full ${item.lastUpdated ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}
                                                                title={item.lastUpdated ? `Actualizado: ${new Date(item.lastUpdated).toLocaleString(undefined, { hour12: false })}` : "Error de sincronización"}
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-300">
                                                    <span className="bg-white/10 px-2 py-1 rounded text-xs">
                                                        {item.type?.name || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-300">
                                                    {item.gender === 'MALE' && <span className="text-blue-400">Masculino</span>}
                                                    {item.gender === 'FEMALE' && <span className="text-pink-400">Femenino</span>}
                                                    {item.gender === 'UNISEX' && <span className="text-purple-400">Unisex</span>}
                                                    {!item.gender && <span className="text-gray-500">-</span>}
                                                </td>
                                                <td className="px-6 py-4 text-gray-300">
                                                    {item.supplier}
                                                </td>
                                                <td className="px-6 py-4 text-gray-300">
                                                    {item.purchaseQuantity} {item.unit}
                                                </td>
                                                <td className="px-6 py-4 text-gray-300">
                                                    {item.priceStatus === 'consultar' ? (
                                                        <span className="text-yellow-400 italic">Consultar</span>
                                                    ) : (
                                                        formatPrice(item.purchaseCost)
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-300 font-mono text-green-400">
                                                    {item.priceStatus === 'consultar' ? (
                                                        <span className="text-yellow-400 italic">Consultar</span>
                                                    ) : (
                                                        `${formatPrice(item.costPerUnit)} / ${item.unit}`
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="text-blue-400 hover:text-blue-300 p-1 transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="text-red-400 hover:text-red-300 p-1 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/20">
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                    <span>Filas por página:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="bg-gray-900 border border-white/10 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white [&>option]:bg-gray-900"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>
                                <span>Total de {allItems.length} fila(s).</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-400">
                                    Página {currentPage} de {totalPages || 1}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="p-1 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modal Material */}
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

                            {/* Type Field */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Tipo</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.typeId}
                                    onChange={e => setFormData({ ...formData, typeId: e.target.value })}
                                >
                                    <option value="">Seleccionar Tipo</option>
                                    {materialTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Supplier Field */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Proveedor</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.supplier}
                                    onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                                    placeholder="Ej: Van Rossum"
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

            {/* Modal Types Management */}
            {showTypeModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setShowTypeModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-white mb-4">
                            Gestionar Tipos de Insumos
                        </h2>

                        <form onSubmit={handleCreateType} className="flex gap-2 mb-6">
                            <input
                                type="text"
                                className="flex-1 px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                value={newTypeName}
                                onChange={e => setNewTypeName(e.target.value)}
                                placeholder="Nuevo tipo (ej: Esencia)"
                            />
                            <button
                                type="submit"
                                disabled={!newTypeName.trim()}
                                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </form>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {materialTypes.map(type => (
                                <div key={type.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                    <span className="text-white">{type.name}</span>
                                    <button
                                        onClick={() => handleDeleteType(type.id)}
                                        className="text-red-400 hover:text-red-300 p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {materialTypes.length === 0 && (
                                <p className="text-gray-500 text-center py-4">No hay tipos creados.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
