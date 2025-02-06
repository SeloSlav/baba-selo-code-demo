import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpoon, faSort, faFilter, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Goodie, Rarity } from '../types';
import Image from 'next/image';

interface MarketplaceListProps {
    goodies: Goodie[];
    onPurchase: (goodie: Goodie) => void;
}

const RARITY_ORDER = {
    'common': 0,
    'uncommon': 1,
    'rare': 2,
    'epic': 3,
    'legendary': 4
};

const getRarityColor = (rarity: Rarity): string => {
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
    }
};

export const MarketplaceList: React.FC<MarketplaceListProps> = ({ goodies, onPurchase }) => {
    const [selectedRarities, setSelectedRarities] = useState<Set<Rarity>>(new Set());
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Filter and sort goodies
    const filteredGoodies = useMemo(() => {
        let filtered = [...goodies];

        // Apply rarity filter if any rarities are selected
        if (selectedRarities.size > 0) {
            filtered = filtered.filter(goodie => selectedRarities.has(goodie.rarity));
        }

        // Apply category filter if any categories are selected
        if (selectedCategories.size > 0) {
            filtered = filtered.filter(goodie => selectedCategories.has(goodie.category));
        }

        // Apply price sorting
        filtered.sort((a, b) => {
            return sortOrder === 'asc' ? a.cost - b.cost : b.cost - a.cost;
        });

        return filtered;
    }, [goodies, selectedRarities, selectedCategories, sortOrder]);

    const handleRarityToggle = (rarity: Rarity) => {
        setSelectedRarities(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rarity)) {
                newSet.delete(rarity);
            } else {
                newSet.add(rarity);
            }
            return newSet;
        });
    };

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    // Get active filters count
    const activeFiltersCount = selectedRarities.size + selectedCategories.size + (sortOrder === 'desc' ? 1 : 0);

    // Get unique categories from goodies
    const categories = [...new Set(goodies.map(g => g.category))];

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

    return (
        <div className="flex flex-col h-full">
            {/* Filters Section */}
            <div className="sticky top-0 bg-white z-10 mb-6">
                <div className="bg-white rounded-3xl shadow-lg border border-gray-300">
                    <button
                        onClick={() => setIsFiltersOpen(prev => !prev)}
                        className="w-full p-4 flex items-center justify-between rounded-t-3xl"
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

                    <div className={`border-t border-gray-200 overflow-hidden transition-all duration-200 ${
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
                                            onClick={() => handleCategoryToggle(category)}
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
                                            onClick={() => handleRarityToggle(rarity as Rarity)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                                                ${selectedRarities.has(rarity as Rarity)
                                                    ? getRarityColor(rarity as Rarity) + ' ring-2 ring-offset-2 ring-gray-500'
                                                    : rarity === 'rare'
                                                        ? 'bg-gray-100 text-blue-600'
                                                        : 'bg-gray-100 text-gray-500 hover:' + getRarityColor(rarity as Rarity).replace('bg-', '')
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
                                    onClick={toggleSortOrder}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-sm transform hover:scale-105 active:scale-95 transition-all duration-200"
                                >
                                    <FontAwesomeIcon icon={faSpoon} className="text-yellow-600" />
                                    <span className="text-gray-700">Price: {sortOrder === 'asc' ? 'Low to High' : 'High to Low'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Grid - Now in a separate scrollable container */}
            <div className="mt-4 flex-1 overflow-y-auto pr-6">
                <div className="bg-white rounded-3xl border border-gray-300 p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {filteredGoodies
                            .sort((a, b) => {
                                // If no filters are active, prioritize Olive Oil items
                                if (selectedRarities.size === 0 && selectedCategories.size === 0) {
                                    if (a.category === 'Olive Oil' && b.category !== 'Olive Oil') return -1;
                                    if (a.category !== 'Olive Oil' && b.category === 'Olive Oil') return 1;
                                }
                                // Then apply price sorting
                                return sortOrder === 'asc' ? a.cost - b.cost : b.cost - a.cost;
                            })
                            .map((goodie) => (
                                <div 
                                    key={goodie.id}
                                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    <div className="relative h-56 w-full">
                                        <Image
                                            src={goodie.imageUrl}
                                            alt={goodie.name}
                                            fill
                                            className="object-cover"
                                            onError={(e) => {
                                                // Use a colored background with an icon as fallback
                                                const imgElement = e.target as HTMLImageElement;
                                                const parent = imgElement.parentElement;
                                                if (parent) {
                                                    parent.classList.add('bg-gray-100', 'flex', 'items-center', 'justify-center');
                                                    parent.innerHTML = `
                                                        <div class="text-gray-400 text-center p-4">
                                                            <div class="text-4xl mb-2">🎁</div>
                                                            <div class="text-sm">Image coming soon</div>
                                                        </div>
                                                    `;
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="p-6">
                                        <div className="mb-3">
                                            <h3 className="text-xl font-semibold mb-2">{goodie.name}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRarityColor(goodie.rarity)}`}>
                                                    {goodie.rarity.charAt(0).toUpperCase() + goodie.rarity.slice(1)}
                                                </span>
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(goodie.category)}`}>
                                                    {goodie.category.charAt(0).toUpperCase() + goodie.category.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-6">{goodie.description}</p>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center text-yellow-600">
                                                <FontAwesomeIcon icon={faSpoon} className="mr-2 text-lg" />
                                                <span className="font-bold text-lg">{goodie.cost}</span>
                                            </div>
                                            <button
                                                onClick={() => onPurchase(goodie)}
                                                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                            >
                                                Purchase
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>

                    {/* No results message */}
                    {filteredGoodies.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl shadow-md">
                            <p className="text-gray-500">No items match your filters. Try adjusting your selection.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}; 