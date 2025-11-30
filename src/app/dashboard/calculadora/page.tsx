'use client';

import { useState, useEffect } from 'react';
import { Plus, Save, Calculator as CalculatorIcon, Trash2 } from 'lucide-react';

interface ProductIngredient {
    materialId: string;
    quantity: number;
}

export default function CalculatorPage() {
    const [productName, setProductName] = useState('');
    const [ingredients, setIngredients] = useState<ProductIngredient[]>([]);
    const [profitMargin, setProfitMargin] = useState(50);
    const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [productTypes, setProductTypes] = useState<any[]>([]);
    const [selectedGender, setSelectedGender] = useState('UNISEX');
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const res = await fetch('/api/materials');
                const data = await res.json();
                setAvailableMaterials(data);
            } catch (error) {
                console.error('Error fetching materials:', error);
            } finally {
                setLoading(false);
            }
        };
        const fetchTypes = async () => {
            try {
                const res = await fetch('/api/product-types');
                const data = await res.json();
                setProductTypes(data);
            } catch (error) {
                console.error('Error fetching types:', error);
            }
        };
        fetchMaterials();
        fetchTypes();
    }, []);

    const handleCreateType = async () => {
        if (!newTypeName) return;
        try {
            const res = await fetch('/api/product-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTypeName }),
            });
            if (res.ok) {
                const newType = await res.json();
                setProductTypes([...productTypes, newType]);
                setSelectedTypeId(newType.id);
                setShowTypeModal(false);
                setNewTypeName('');
            }
        } catch (error) {
            console.error('Error creating type:', error);
        }
    };

    const addIngredient = () => {
        if (availableMaterials.length === 0) return;
        // Default to first material
        setIngredients([...ingredients, { materialId: availableMaterials[0].id, quantity: 1 }]);
    };

    const updateIngredient = (index: number, field: keyof ProductIngredient, value: string | number) => {
        const newIngredients = [...ingredients];
        if (field === 'quantity') {
            newIngredients[index].quantity = Number(value);
        } else {
            newIngredients[index].materialId = String(value);
        }
        setIngredients(newIngredients);
    };

    const removeIngredient = (index: number) => {
        const newIngredients = [...ingredients];
        newIngredients.splice(index, 1);
        setIngredients(newIngredients);
    };

    const calculateTotalCost = () => {
        return ingredients.reduce((total, ingredient) => {
            const material = availableMaterials.find((m) => m.id === ingredient.materialId);
            return total + (material ? material.costPerUnit * ingredient.quantity : 0);
        }, 0);
    };

    const totalCost = calculateTotalCost();
    const finalPrice = totalCost * (1 + profitMargin / 100);

    const handleSaveProduct = async () => {
        if (!productName || ingredients.length === 0) {
            alert('Por favor completa el nombre y agrega ingredientes.');
            return;
        }

        try {
            const payload = {
                name: productName,
                cost: totalCost,
                profitMargin,
                finalPrice,
                ingredients,
                gender: selectedGender,
                typeId: selectedTypeId || null
            };

            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                alert('Producto guardado exitosamente!');
                setProductName('');
                setIngredients([]);
                setSelectedGender('UNISEX');
                setSelectedTypeId('');
                // Optionally redirect to price list
            } else {
                alert('Error al guardar el producto');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error al guardar el producto');
        }
    };

    return (
        <div className="max-w-4xl mx-auto relative">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <CalculatorIcon className="w-8 h-8 text-purple-400" />
                    Armador de Productos
                </h1>
                <p className="text-gray-400 mt-2">Diseña tu producto y calcula su rentabilidad.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Builder */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Product Info */}
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-xl space-y-4">
                        <h2 className="text-xl font-semibold text-white mb-4">Información del Producto</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Nombre del Perfume</label>
                            <input
                                type="text"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                placeholder="Ej: Ocean Breeze 50ml"
                                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Género</label>
                                <select
                                    value={selectedGender}
                                    onChange={(e) => setSelectedGender(e.target.value)}
                                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-gray-900"
                                >
                                    <option value="MALE">Masculino</option>
                                    <option value="FEMALE">Femenino</option>
                                    <option value="UNISEX">Unisex</option>
                                    <option value="OTHER">Otro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedTypeId}
                                        onChange={(e) => setSelectedTypeId(e.target.value)}
                                        className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-gray-900"
                                    >
                                        <option value="">Seleccionar Tipo...</option>
                                        {productTypes.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setShowTypeModal(true)}
                                        className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                                        title="Crear nuevo tipo"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ingredients */}
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-white">Composición</h2>
                            <button
                                onClick={addIngredient}
                                disabled={availableMaterials.length === 0}
                                className="text-sm bg-purple-600/20 text-purple-300 px-3 py-1 rounded-lg hover:bg-purple-600/30 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" /> Agregar Insumo
                            </button>
                        </div>

                        <div className="space-y-3">
                            {loading ? (
                                <p className="text-gray-500 text-center py-4">Cargando insumos...</p>
                            ) : ingredients.length === 0 ? (
                                <p className="text-gray-500 text-center py-4 italic">
                                    {availableMaterials.length === 0
                                        ? "No hay insumos disponibles. Ve a la sección 'Insumos' para agregar."
                                        : "Agrega insumos para calcular el costo"}
                                </p>
                            ) : (
                                ingredients.map((ingredient, index) => {
                                    const selectedMaterial = availableMaterials.find((m) => m.id === ingredient.materialId);

                                    // Find all variants for this group if it has a groupName
                                    const variants = selectedMaterial?.groupName
                                        ? availableMaterials.filter(m => m.groupName === selectedMaterial.groupName)
                                        : [selectedMaterial];

                                    // Unique groups for the main dropdown
                                    // We need to filter availableMaterials to only show one per group (e.g. the first one) for the main selector
                                    // But doing this efficiently inside the map is tricky.
                                    // Better to prepare a "uniqueMaterials" list in state or memo.
                                    // For now, let's just show all, but if I select one, I can switch size.

                                    const cost = selectedMaterial ? selectedMaterial.costPerUnit * ingredient.quantity : 0;

                                    return (
                                        <div key={index} className="flex items-center gap-4 bg-black/20 p-3 rounded-lg border border-white/5">
                                            <div className="flex-1 flex gap-2">
                                                <select
                                                    value={ingredient.materialId}
                                                    onChange={(e) => updateIngredient(index, 'materialId', e.target.value)}
                                                    className="flex-1 bg-transparent text-white border-none focus:ring-0 cursor-pointer [&>option]:bg-gray-900"
                                                >
                                                    {availableMaterials.map((m) => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.name} (${m.costPerUnit.toFixed(2)}/{m.unit})
                                                        </option>
                                                    ))}
                                                </select>

                                                {/* Size Selector if variants exist */}
                                                {variants.length > 1 && (
                                                    <select
                                                        value={ingredient.materialId}
                                                        onChange={(e) => updateIngredient(index, 'materialId', e.target.value)}
                                                        className="w-24 bg-white/5 text-white text-sm rounded border border-white/10 focus:ring-purple-500 [&>option]:bg-gray-900"
                                                    >
                                                        {variants.map(v => (
                                                            <option key={v.id} value={v.id}>
                                                                {v.purchaseQuantity}g
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 w-32">
                                                <input
                                                    type="number"
                                                    value={ingredient.quantity}
                                                    onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                                                    className="w-20 bg-white/5 rounded px-2 py-1 text-right text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                    min="0"
                                                />
                                                <span className="text-gray-400 text-sm">{selectedMaterial?.unit}</span>
                                            </div>

                                            <div className="w-24 text-right font-mono text-gray-300">
                                                ${cost.toFixed(2)}
                                            </div>

                                            <button
                                                onClick={() => removeIngredient(index)}
                                                className="text-red-400 hover:text-red-300 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-xl sticky top-8">
                        <h2 className="text-xl font-bold text-white mb-6">Resumen de Costos</h2>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-gray-300">
                                <span>Costo Materia Prima</span>
                                <span className="font-mono">${totalCost.toFixed(2)}</span>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Margen de Ganancia (%)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="500"
                                        value={profitMargin}
                                        onChange={(e) => setProfitMargin(Number(e.target.value))}
                                        className="flex-1 accent-purple-500"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        value={profitMargin}
                                        onChange={(e) => setProfitMargin(Number(e.target.value))}
                                        className="w-16 bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-right focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                    <span className="text-gray-400">%</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-gray-300 pt-2">
                                <span>Ganancia Neta</span>
                                <span className="font-mono text-green-400">+${(totalCost * (profitMargin / 100)).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="bg-black/30 p-4 rounded-lg border border-white/10 text-center">
                            <p className="text-gray-400 text-sm mb-1">Precio Final Sugerido</p>
                            <p className="text-4xl font-bold text-white">${finalPrice.toFixed(2)}</p>
                        </div>

                        <button
                            onClick={handleSaveProduct}
                            className="w-full mt-6 bg-white text-purple-900 font-bold py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-lg"
                        >
                            <Save className="w-5 h-5" />
                            Guardar Producto
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal for New Type */}
            {showTypeModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Crear Nuevo Tipo</h3>
                        <input
                            type="text"
                            value={newTypeName}
                            onChange={(e) => setNewTypeName(e.target.value)}
                            placeholder="Ej: Cítrico, Amaderado..."
                            className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none mb-4"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowTypeModal(false)}
                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateType}
                                className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium"
                            >
                                Crear
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
