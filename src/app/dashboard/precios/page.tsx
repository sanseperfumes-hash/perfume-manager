'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Tag, ShoppingCart, Trash2, Edit2, Plus, X, Save, Filter, Scale, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/utils';

interface MaterialType {
    id: string;
    name: string;
}

interface Material {
    id: string;
    name: string;
    costPerUnit: number;
    purchaseQuantity: number;
    unit: string;
    type?: MaterialType;
}

interface ProductIngredient {
    materialId: string;
    quantityUsed: number;
    material: Material;
}

interface ProductType {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    cost: number;
    finalPrice: number;
    profitMargin: number;
    gender: string;
    type?: ProductType;
    ingredients: ProductIngredient[];
}

export default function PriceListPage() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [productTypes, setProductTypes] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

    // Filters
    const [genderFilter, setGenderFilter] = useState<string>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [gramsFilter, setGramsFilter] = useState<string>('ALL');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Edit Modal State
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editForm, setEditForm] = useState<{
        profitMargin: number;
        ingredients: { materialId: string; quantityUsed: number }[];
    } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [productsRes, materialsRes, typesRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/materials'),
                fetch('/api/product-types')
            ]);

            const productsData = await productsRes.json();
            const materialsData = await materialsRes.json();
            // Handle potential error if product-types endpoint doesn't exist yet or fails
            const typesData = typesRes.ok ? await typesRes.json() : [];

            setProducts(productsData);
            setMaterials(materialsData);
            setProductTypes(typesData);
        } catch (error) {
            console.error('Error fetching data:', error);
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

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchData(); // Refresh list
            } else {
                const data = await res.json();
                alert(data.error || 'Error al eliminar el producto');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error al eliminar el producto');
        }
    };

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
        setEditForm({
            profitMargin: product.profitMargin,
            ingredients: product.ingredients.map(i => ({
                materialId: i.materialId,
                quantityUsed: i.quantityUsed
            }))
        });
    };

    const handleSaveEdit = async () => {
        if (!editingProduct || !editForm) return;

        try {
            const res = await fetch(`/api/products/${editingProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profitMargin: editForm.profitMargin,
                    ingredients: editForm.ingredients
                })
            });

            if (res.ok) {
                setEditingProduct(null);
                setEditForm(null);
                fetchData(); // Refresh list
            } else {
                alert('Error al actualizar el producto');
            }
        } catch (error) {
            console.error('Error updating product:', error);
            alert('Error al actualizar el producto');
        }
    };

    const updateIngredientQuantity = (index: number, quantity: number) => {
        if (!editForm) return;
        const newIngredients = [...editForm.ingredients];
        newIngredients[index].quantityUsed = quantity;
        setEditForm({ ...editForm, ingredients: newIngredients });
    };

    const removeIngredient = (index: number) => {
        if (!editForm) return;
        const newIngredients = editForm.ingredients.filter((_, i) => i !== index);
        setEditForm({ ...editForm, ingredients: newIngredients });
    };

    const addIngredient = () => {
        if (!editForm || materials.length === 0) return;
        // Default to first material
        setEditForm({
            ...editForm,
            ingredients: [...editForm.ingredients, { materialId: materials[0].id, quantityUsed: 1 }]
        });
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

    // Helper to clean product name
    const getCleanName = (name: string) => {
        // Remove "Perfume " prefix (case insensitive)
        let clean = name.replace(/^Perfume\s+/i, '');
        // Remove gender indicators like (M), (F), (Unisex)
        clean = clean.replace(/\s*\([MF]\)|\s*\(Unisex\)/gi, '');
        // Remove size indicators like (30g), (100g)
        clean = clean.replace(/\s*\(\d+g\)/gi, '');
        return clean.trim();
    };

    // Helper to get essence purchase quantity
    const getEssenceQuantity = (ingredients: ProductIngredient[]) => {
        // Find ingredient that is of type 'Esencia' or has 'Esencia' in name if type is missing
        const essence = ingredients.find(i =>
            i.material.type?.name === 'Esencia' ||
            i.material.name.toLowerCase().includes('esencia') ||
            // Fallback: assume it's the one that is not alcohol, bottle, box, label
            (!i.material.name.toLowerCase().includes('alcohol') &&
                !i.material.name.toLowerCase().includes('frasco') &&
                !i.material.name.toLowerCase().includes('caja') &&
                !i.material.name.toLowerCase().includes('etiqueta'))
        );
        return essence ? essence.material.purchaseQuantity : 0;
    };

    // Get unique gram quantities for filter
    const availableGrams = Array.from(new Set(products.map(p => getEssenceQuantity(p.ingredients)))).sort((a, b) => a - b);

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGender = genderFilter === 'ALL' || p.gender === genderFilter;

        let matchesType = true;
        if (typeFilter !== 'ALL') {
            if (typeFilter === 'NONE') {
                matchesType = !p.type;
            } else {
                // Check if the selected filter is "Perfume"
                const selectedType = productTypes.find(t => t.id === typeFilter);
                if (selectedType?.name === 'Perfume') {
                    // Match if type ID matches OR if type is null (default is Perfume)
                    matchesType = p.type?.id === typeFilter || !p.type;
                } else {
                    matchesType = p.type?.id === typeFilter;
                }
            }
        }

        const matchesGrams = gramsFilter === 'ALL' || getEssenceQuantity(p.ingredients).toString() === gramsFilter;

        return matchesSearch && matchesGender && matchesType && matchesGrams;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Helper to get material name for edit form
    const getMaterialName = (id: string) => materials.find(m => m.id === id)?.name || 'Desconocido';
    const getMaterialUnit = (id: string) => materials.find(m => m.id === id)?.unit || '';

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

            {/* Filters Bar */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-xl mb-6 flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1); // Reset page on search
                        }}
                    />
                </div>

                {/* Gender Filter */}
                <div className="w-full md:w-40">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                            value={genderFilter}
                            onChange={(e) => {
                                setGenderFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                        >
                            <option value="ALL" className="bg-gray-900">Género</option>
                            <option value="MALE" className="bg-gray-900">Masculino</option>
                            <option value="FEMALE" className="bg-gray-900">Femenino</option>
                            <option value="UNISEX" className="bg-gray-900">Unisex</option>
                        </select>
                    </div>
                </div>

                {/* Type Filter */}
                <div className="w-full md:w-40">
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                        >
                            <option value="ALL" className="bg-gray-900">Tipo</option>
                            {productTypes.map(type => (
                                <option key={type.id} value={type.id} className="bg-gray-900">{type.name}</option>
                            ))}
                            <option value="NONE" className="bg-gray-900">Sin Tipo</option>
                        </select>
                    </div>
                </div>

                {/* Grams Filter */}
                <div className="w-full md:w-40">
                    <div className="relative">
                        <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                            value={gramsFilter}
                            onChange={(e) => {
                                setGramsFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                        >
                            <option value="ALL" className="bg-gray-900">Gramos</option>
                            {availableGrams.map(g => (
                                <option key={g} value={g.toString()} className="bg-gray-900">{g}g</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center text-purple-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-black/40 text-gray-400 text-xs uppercase tracking-wider border-b border-white/10">
                                        <th className="w-12 px-6 py-4">
                                            <div className="w-4 h-4" />
                                        </th>
                                        <th className="px-6 py-4 font-medium">Esencia</th>
                                        <th className="px-6 py-4 font-medium text-center">Gramos Esencia</th>
                                        <th className="px-6 py-4 font-medium">Género</th>
                                        <th className="px-6 py-4 font-medium">Tipo</th>
                                        <th className="px-6 py-4 font-medium">Costo</th>
                                        <th className="px-6 py-4 font-medium">Margen</th>
                                        <th className="px-6 py-4 font-medium text-right">Precio Venta</th>
                                        <th className="px-6 py-4 font-medium text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {paginatedProducts.map((product) => {
                                        const isSelected = selectedProducts.has(product.id);
                                        const essenceGrams = getEssenceQuantity(product.ingredients);

                                        return (
                                            <tr
                                                key={product.id}
                                                className={`transition-colors ${isSelected ? 'bg-purple-500/10 hover:bg-purple-500/20' : 'hover:bg-white/5'}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleProductSelection(product.id)}
                                                        className="w-4 h-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500 bg-gray-800"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-white font-medium text-sm">
                                                    {getCleanName(product.name)}
                                                </td>
                                                <td className="px-6 py-4 text-gray-400 text-sm text-center">
                                                    {essenceGrams > 0 ? `${essenceGrams}g` : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${product.gender === 'MALE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            product.gender === 'FEMALE' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                                                                product.gender === 'UNISEX' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                        }`}>
                                                        {product.gender === 'MALE' ? 'Masculino' :
                                                            product.gender === 'FEMALE' ? 'Femenino' :
                                                                product.gender === 'UNISEX' ? 'Unisex' : 'Otro'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-400 text-sm">
                                                    {product.type?.name || 'Perfume'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-400 text-sm font-mono">
                                                    {formatPrice(product.cost)}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded text-xs font-medium border border-purple-500/20">
                                                        {product.profitMargin}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-green-400 font-bold font-mono">
                                                        {formatPrice(product.finalPrice)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {user?.role !== 'VIEWER' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEditClick(product)}
                                                                    className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors"
                                                                    title="Editar producto"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteProduct(product.id)}
                                                                    className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors"
                                                                    title="Eliminar producto"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                                No se encontraron productos.
                                            </td>
                                        </tr>
                                    )}
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
                                        className="bg-gray-900 border border-white/10 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500 text-white [&>option]:bg-gray-900"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>
                                <span>Total de {filteredProducts.length} fila(s).</span>
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

            {/* Edit Modal */}
            {editingProduct && editForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
                            <h2 className="text-xl font-bold text-white">Editar Producto: {getCleanName(editingProduct.name)}</h2>
                            <button
                                onClick={() => setEditingProduct(null)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Profit Margin */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Margen de Ganancia (%)</label>
                                <input
                                    type="number"
                                    value={editForm.profitMargin}
                                    onChange={(e) => setEditForm({ ...editForm, profitMargin: Number(e.target.value) })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Ingredients */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-sm font-medium text-gray-400">Insumos y Cantidades</label>
                                    <button
                                        onClick={addIngredient}
                                        className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded hover:bg-purple-500/30 transition-colors flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Agregar Insumo
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {editForm.ingredients.map((ing, index) => (
                                        <div key={index} className="flex gap-3 items-center bg-white/5 p-3 rounded-lg border border-white/5">
                                            <div className="flex-1">
                                                <select
                                                    value={ing.materialId}
                                                    onChange={(e) => {
                                                        const newIngs = [...editForm.ingredients];
                                                        newIngs[index].materialId = e.target.value;
                                                        setEditForm({ ...editForm, ingredients: newIngs });
                                                    }}
                                                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                >
                                                    {materials.map(m => (
                                                        <option key={m.id} value={m.id} className="bg-gray-900">
                                                            {m.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-24 flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={ing.quantityUsed}
                                                    onChange={(e) => updateIngredientQuantity(index, Number(e.target.value))}
                                                    className="w-full bg-black/20 border border-white/10 rounded px-2 py-2 text-sm text-white text-right focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                />
                                                <span className="text-xs text-gray-500 w-8">
                                                    {getMaterialUnit(ing.materialId)}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => removeIngredient(index)}
                                                className="text-red-400 hover:bg-red-500/10 p-2 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 bg-gray-900 z-10">
                            <button
                                onClick={() => setEditingProduct(null)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-purple-500/20 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
