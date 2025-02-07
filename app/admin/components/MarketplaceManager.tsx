import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Goodie } from '../../marketplace/types';
import { isAdmin } from '../../config/admin';

interface EditableGoodie extends Goodie {
    docId: string;
}

interface MarketplaceManagerProps {
    user: any;
    showPointsToast: (points: number, message: string) => void;
}

const MarketplaceManager: React.FC<MarketplaceManagerProps> = ({ user, showPointsToast }) => {
    const [loading, setLoading] = useState(false);
    const [goodies, setGoodies] = useState<EditableGoodie[]>([]);
    const [editingGoodie, setEditingGoodie] = useState<EditableGoodie | null>(null);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set());
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    const RARITY_ORDER = {
        'common': 0,
        'uncommon': 1,
        'rare': 2,
        'epic': 3,
        'legendary': 4
    };

    const getRarityColor = (rarity: string): string => {
        switch (rarity) {
            case 'common':
                return 'bg-gray-100 text-gray-600';
            case 'uncommon':
                return 'bg-green-100 text-green-600';
            case 'rare':
                return 'bg-blue-100 text-blue-600';
            case 'epic':
                return 'bg-purple-100 text-purple-600';
            case 'legendary':
                return 'bg-yellow-100 text-yellow-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getCategoryColor = (category: string): string => {
        switch (category) {
            case 'food':
                return 'bg-orange-100 text-orange-600';
            case 'toy':
                return 'bg-indigo-100 text-indigo-600';
            case 'accessory':
                return 'bg-pink-100 text-pink-600';
            case 'Olive Oil':
                return 'bg-green-100 text-green-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    // Fetch existing goodies
    useEffect(() => {
        const fetchGoodies = async () => {
            if (!user) return;
            const adminCheck = await isAdmin(user.uid);
            if (!adminCheck) return;

            try {
                const goodiesSnapshot = await getDocs(collection(db, 'goodies'));
                const goodiesData = goodiesSnapshot.docs.map(doc => ({
                    docId: doc.id,
                    ...doc.data()
                })) as EditableGoodie[];
                setGoodies(goodiesData);
            } catch (error) {
                console.error('Error fetching goodies:', error);
                showPointsToast(0, 'Failed to fetch goodies');
            }
        };

        fetchGoodies();
    }, [user, showPointsToast]);

    const handleUpdateGoodie = async (goodie: EditableGoodie) => {
        if (!user) return;
        const adminCheck = await isAdmin(user.uid);
        if (!adminCheck) return;
        
        try {
            setLoading(true);
            const goodieRef = doc(db, 'goodies', goodie.docId);
            
            // Remove docId before updating
            const { docId, ...updateData } = goodie;
            await updateDoc(goodieRef, updateData);

            // Update local state
            setGoodies(prev => prev.map(g => 
                g.docId === goodie.docId ? goodie : g
            ));
            
            showPointsToast(0, `Updated ${goodie.name} successfully!`);
            setEditingGoodie(null);
        } catch (error) {
            console.error('Error updating goodie:', error);
            showPointsToast(0, 'Failed to update goodie');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGoodie = async (docId: string) => {
        if (!user) return;
        const adminCheck = await isAdmin(user.uid);
        if (!adminCheck) return;
        
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            setLoading(true);
            await deleteDoc(doc(db, 'goodies', docId));
            setGoodies(prev => prev.filter(g => g.docId !== docId));
            showPointsToast(0, 'Item deleted successfully!');
        } catch (error) {
            console.error('Error deleting goodie:', error);
            showPointsToast(0, 'Failed to delete item');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGoodie = async (goodie: EditableGoodie) => {
        if (!user) return;
        const adminCheck = await isAdmin(user.uid);
        if (!adminCheck) return;
        
        try {
            setLoading(true);
            // Remove docId before creating
            const { docId, ...createData } = goodie;
            
            // Add to Firestore
            const goodiesCollection = collection(db, 'goodies');
            const docRef = await addDoc(goodiesCollection, createData);
            
            // Add to local state with the new docId
            const newGoodie = { ...goodie, docId: docRef.id };
            setGoodies(prev => [...prev, newGoodie]);
            
            showPointsToast(0, `Created ${goodie.name} successfully!`);
            setEditingGoodie(null);
        } catch (error) {
            console.error('Error creating goodie:', error);
            showPointsToast(0, 'Failed to create goodie');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateAISuggestion = async () => {
        if (!editingGoodie) return;

        try {
            setGeneratingAI(true);
            const response = await fetch('/api/generateGoodie', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    category: editingGoodie.category,
                    rarity: editingGoodie.rarity,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate suggestion');
            }

            const data = await response.json();
            
            // Update the form with AI suggestions while keeping the category and rarity
            setEditingGoodie(prev => ({
                ...prev!,
                name: data.name,
                description: data.description,
                cost: data.cost,
                imageUrl: data.imageUrl,
            }));

            showPointsToast(0, 'AI suggestion generated! Review and create if you like it.');
        } catch (error) {
            console.error('Error generating AI suggestion:', error);
            showPointsToast(0, 'Failed to generate AI suggestion');
        } finally {
            setGeneratingAI(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Marketplace Management</h2>
            </div>

            {/* New Item Form */}
            <div className="mb-8 border-b pb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Add New Item</h3>
                    {!editingGoodie?.docId && (
                        <button
                            onClick={() => setEditingGoodie({
                                docId: 'new',
                                name: '',
                                description: '',
                                cost: 0,
                                rarity: 'common',
                                category: 'food',
                                imageUrl: ''
                            } as EditableGoodie)}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Show Form
                        </button>
                    )}
                </div>

                {editingGoodie?.docId === 'new' && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        {/* Category, Rarity, and AI Button */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select
                                    value={editingGoodie.category}
                                    onChange={e => setEditingGoodie({
                                        ...editingGoodie,
                                        category: e.target.value as any
                                    })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="food">Food</option>
                                    <option value="toy">Toy</option>
                                    <option value="accessory">Accessory</option>
                                    <option value="Olive Oil">Olive Oil</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Rarity</label>
                                <select
                                    value={editingGoodie.rarity}
                                    onChange={e => setEditingGoodie({
                                        ...editingGoodie,
                                        rarity: e.target.value as any
                                    })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="common">Common</option>
                                    <option value="uncommon">Uncommon</option>
                                    <option value="rare">Rare</option>
                                    <option value="epic">Epic</option>
                                    <option value="legendary">Legendary</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleGenerateAISuggestion}
                                    disabled={generatingAI}
                                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {generatingAI ? (
                                        <>
                                            <LoadingSpinner />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>✨</span>
                                            <span>Get AI Suggestion</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Name and Image URL */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editingGoodie.name}
                                    onChange={e => setEditingGoodie({
                                        ...editingGoodie,
                                        name: e.target.value
                                    })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="Item name..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Image URL</label>
                                <input
                                    type="text"
                                    value={editingGoodie.imageUrl}
                                    onChange={e => setEditingGoodie({
                                        ...editingGoodie,
                                        imageUrl: e.target.value
                                    })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="/marketplace/item.jpg"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={editingGoodie.description}
                                onChange={e => setEditingGoodie({
                                    ...editingGoodie,
                                    description: e.target.value
                                })}
                                className="w-full px-3 py-2 border rounded-lg"
                                rows={3}
                                placeholder="Item description..."
                            />
                        </div>

                        {/* Cost */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Cost (spoons)</label>
                            <input
                                type="number"
                                value={editingGoodie.cost || ''}
                                onChange={e => setEditingGoodie({
                                    ...editingGoodie,
                                    cost: e.target.value === '' ? 0 : parseInt(e.target.value)
                                })}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="0"
                                min="0"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setEditingGoodie(null)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleCreateGoodie(editingGoodie)}
                                disabled={loading}
                                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                {loading ? <LoadingSpinner /> : 'Create Item'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Existing Items Grid */}
            <div>
                <h3 className="text-lg font-medium mb-4">Current Items</h3>
                
                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-md mb-6">
                    <button
                        onClick={() => setIsFiltersOpen(prev => !prev)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">🔍</span>
                            <span className="font-semibold">Filter & Sort</span>
                            {(selectedRarities.size + selectedCategories.size + (sortOrder === 'desc' ? 1 : 0)) > 0 && (
                                <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                    {selectedRarities.size + selectedCategories.size + (sortOrder === 'desc' ? 1 : 0)} active
                                </span>
                            )}
                        </div>
                        <span className={`text-gray-500 transition-transform duration-200 ${isFiltersOpen ? 'rotate-180' : ''}`}>
                            ▼
                        </span>
                    </button>

                    <div className={`border-t border-gray-100 overflow-hidden transition-all duration-200 ${
                        isFiltersOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                        <div className="p-6 space-y-6">
                            {/* Category Filter */}
                            <div>
                                <h3 className="font-semibold mb-3">Filter by Category</h3>
                                <div className="flex flex-wrap gap-3">
                                    {['food', 'toy', 'accessory', 'Olive Oil'].map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => {
                                                setSelectedCategories(prev => {
                                                    const newSet = new Set(prev);
                                                    if (newSet.has(category)) {
                                                        newSet.delete(category);
                                                    } else {
                                                        newSet.add(category);
                                                    }
                                                    return newSet;
                                                });
                                            }}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                                                ${selectedCategories.has(category)
                                                    ? getCategoryColor(category) + ' ring-2 ring-offset-2 ring-gray-500'
                                                    : 'bg-gray-100 text-gray-500 hover:' + getCategoryColor(category).replace('bg-', '')
                                                }
                                                transform hover:scale-105 active:scale-95`}
                                        >
                                            {category.charAt(0).toUpperCase() + category.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Rarity Filter */}
                            <div>
                                <h3 className="font-semibold mb-3">Filter by Rarity</h3>
                                <div className="flex flex-wrap gap-3">
                                    {Object.keys(RARITY_ORDER).map((rarity) => (
                                        <button
                                            key={rarity}
                                            onClick={() => {
                                                setSelectedRarities(prev => {
                                                    const newSet = new Set(prev);
                                                    if (newSet.has(rarity)) {
                                                        newSet.delete(rarity);
                                                    } else {
                                                        newSet.add(rarity);
                                                    }
                                                    return newSet;
                                                });
                                            }}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                                                ${selectedRarities.has(rarity)
                                                    ? getRarityColor(rarity) + ' ring-2 ring-offset-2 ring-gray-500'
                                                    : 'bg-gray-100 text-gray-500 hover:' + getRarityColor(rarity).replace('bg-', '')
                                                }
                                                transform hover:scale-105 active:scale-95`}
                                        >
                                            {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Sort */}
                            <div>
                                <h3 className="font-semibold mb-3">Sort by Price</h3>
                                <button
                                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-200 text-sm transform hover:scale-105 active:scale-95"
                                >
                                    <span className="text-yellow-600">🥄</span>
                                    <span>Price: {sortOrder === 'asc' ? 'Low to High' : 'High to Low'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {goodies
                        .filter(goodie => selectedCategories.size === 0 || selectedCategories.has(goodie.category))
                        .filter(goodie => selectedRarities.size === 0 || selectedRarities.has(goodie.rarity))
                        .sort((a, b) => sortOrder === 'asc' ? a.cost - b.cost : b.cost - a.cost)
                        .map(goodie => (
                            <div key={goodie.docId} className="border rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow">
                                <div className="relative h-48 bg-gray-100">
                                    {goodie.imageUrl ? (
                                        <img
                                            src={goodie.imageUrl}
                                            alt={goodie.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/marketplace/placeholder.png';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <div className="text-center">
                                                <div className="text-4xl mb-2">🎁</div>
                                                <div className="text-sm">No image</div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <button
                                            onClick={() => setEditingGoodie(goodie)}
                                            className="p-2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-lg transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteGoodie(goodie.docId)}
                                            className="p-2 bg-red-600 bg-opacity-50 hover:bg-opacity-75 text-white rounded-lg transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h4 className="text-lg font-semibold mb-2">{goodie.name}</h4>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRarityColor(goodie.rarity)}`}>
                                            {goodie.rarity.charAt(0).toUpperCase() + goodie.rarity.slice(1)}
                                        </span>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(goodie.category)}`}>
                                            {goodie.category.charAt(0).toUpperCase() + goodie.category.slice(1)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">{goodie.description}</p>
                                    <div className="flex items-center text-yellow-600">
                                        <span className="mr-2">🥄</span>
                                        <span className="font-bold text-lg">{goodie.cost}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default MarketplaceManager;