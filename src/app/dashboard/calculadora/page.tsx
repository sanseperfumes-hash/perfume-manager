'use client';

import { useState, useEffect } from 'react';
import { Plus, Save, Calculator as CalculatorIcon, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

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

    useEffect(() => {
        if (availableMaterials.length > 0 && ingredients.length === 0) {
            const defaults = [];

            // Helper to find material
            const findMat = (namePart: string) => availableMaterials.find(m => m.name.toLowerCase().includes(namePart.toLowerCase()));

            const alcohol = findMat('Alcohol');
            if (alcohol) defaults.push({ materialId: alcohol.id, quantity: 80 });

            const caja = findMat('Caja');
            if (caja) defaults.push({ materialId: caja.id, quantity: 1 });

            const etiquetas = findMat('Etiquetas');
            if (etiquetas) defaults.push({ materialId: etiquetas.id, quantity: 1 });

            const frascoM = findMat('Frasco masculino') || findMat('Frascos masculinos');
            if (frascoM) defaults.push({ materialId: frascoM.id, quantity: 1 });

            const frascoF = findMat('Frascos Femeninos');
            if (frascoF) defaults.push({ materialId: frascoF.id, quantity: 1 });

            if (defaults.length > 0) {
                setIngredients(defaults);
            }
        }
    }, [availableMaterials]);

    const isEssence = (material: any) => {
        if (!material) return false;
        // Check if type name is 'Esencia' (we might need to populate type or check ID)
        // Or check if name contains 'Esencia'
        // The material object from API has `type` relation included?
        // Based on `fetchMaterials` in Insumos page, it does.
        // Let's assume `type` object is present or we check name.
        return material.type?.name === 'Esencia' || material.name.toLowerCase().includes('esencia');
    };

    const addIngredient = () => {
        if (availableMaterials.length === 0) return;
        const defaultMat = availableMaterials[0];
        const defaultQty = isEssence(defaultMat) ? 15 : 1;
        setIngredients([...ingredients, { materialId: defaultMat.id, quantity: defaultQty }]);
    };

    const updateIngredient = (index: number, field: keyof ProductIngredient, value: string | number) => {
        const newIngredients = [...ingredients];
        if (field === 'quantity') {
            newIngredients[index].quantity = Number(value);
        } else {
            const newMaterialId = String(value);
            newIngredients[index].materialId = newMaterialId;

            // Auto-set quantity to 15 if switching to an Essence
            const newMaterial = availableMaterials.find(m => m.id === newMaterialId);
            if (isEssence(newMaterial)) {
                newIngredients[index].quantity = 15;
            }
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

            <div className="space-y-8 pb-40">
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
                                className="w-full px-4 py-2 bg-gray-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-gray-900"
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
                                    className="w-full px-4 py-2 bg-gray-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-gray-900"
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

                                const cost = selectedMaterial ? selectedMaterial.costPerUnit * ingredient.quantity : 0;

                                return (
                                    <div key={index} className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-black/20 p-3 rounded-lg border border-white/5">
                                        <div className="flex-1 flex gap-2 min-w-0">
                                            <select
                                                value={ingredient.materialId}
                                                onChange={(e) => updateIngredient(index, 'materialId', e.target.value)}
                                                className="flex-1 bg-gray-900 border border-white/10 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white [&>option]:bg-gray-900 min-w-0 text-sm truncate"
                                            >
                                                {availableMaterials.map((m) => {
                                                    const genderLabel = m.gender === 'MALE' ? '(M)' : m.gender === 'FEMALE' ? '(F)' : m.gender === 'UNISEX' ? '(U)' : '';
                                                    const fullGender = m.gender ? `(${m.gender})` : '';
                                                    const showExtraInfo = !m.name.includes(m.gender || 'XYZ') && !m.name.includes(m.purchaseQuantity.toString());

                                                    const label = showExtraInfo
                                                        ? `${m.name} ${fullGender} (${m.purchaseQuantity}${m.unit}) ${genderLabel} (${formatPrice(m.costPerUnit)}/${m.unit})`
                                                        : `${m.name} ${genderLabel} (${formatPrice(m.costPerUnit)}/${m.unit})`;

                                                    return (
                                                        <option key={m.id} value={m.id}>
                                                            {label}
                                                        </option>
                                                    );
                                                })}
                                            </select>

                                            {variants.length > 1 && (
                                                <select
                                                    value={ingredient.materialId}
                                                    onChange={(e) => updateIngredient(index, 'materialId', e.target.value)}
                                                    className="w-20 bg-gray-900 text-white text-xs rounded border border-white/10 focus:ring-purple-500 [&>option]:bg-gray-900 shrink-0"
                                                >
                                                    {variants.map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.purchaseQuantity}g
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <input
                                                type="number"
                                                value={ingredient.quantity}
                                                onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                                                className="w-16 bg-white/5 rounded px-2 py-1 text-right text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                min="0"
                                            />
                                            <span className="text-gray-400 text-xs w-6">{selectedMaterial?.unit}</span>
                                        </div>

                                        <div className="w-24 text-right font-mono text-gray-300 text-sm shrink-0">
                                            {formatPrice(cost)}
                                        </div>

                                        <button
                                            onClick={() => removeIngredient(index)}
                                            className="text-red-400 hover:text-red-300 p-1 shrink-0"
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

            {/* Fixed Bottom Summary Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-white/10 p-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-8 text-sm">
                        <div className="flex flex-col">
                            <span className="text-gray-400">Costo Materia Prima</span>
                            <span className="font-mono text-xl text-white">{formatPrice(totalCost)}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-gray-400 mb-1">Margen (%)</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="500"
                                    value={profitMargin}
                                    onChange={(e) => setProfitMargin(Number(e.target.value))}
                                    className="w-24 accent-purple-500"
                                />
                                <input
                                    type="number"
                                    min="0"
                                    value={profitMargin}
                                    onChange={(e) => setProfitMargin(Number(e.target.value))}
                                    className="w-14 bg-black/20 border border-white/10 rounded px-1 py-0.5 text-white text-right focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-gray-400">Ganancia Neta</span>
                            <span className="font-mono text-xl text-green-400">+{formatPrice(totalCost * (profitMargin / 100))}</span>
                        </div>

                        <div className="flex flex-col pl-8 border-l border-white/10">
                            <span className="text-gray-400">Precio Final</span>
                            <span className="font-bold text-2xl text-white">{formatPrice(finalPrice)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveProduct}
                        className="bg-white text-purple-900 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg whitespace-nowrap"
                    >
                        <Save className="w-5 h-5" />
                        Guardar Producto
                    </button>
                </div>
            </div>

            {/* Modal for New Type */}
            {
                showTypeModal && (
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
                )
            }
        </div >
    );
}
