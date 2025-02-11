import React from 'react';
import { getRarityColor, getCategoryColor, RARITY_ORDER } from '../utils/colors';
import { capitalize } from '../utils/helpers';

interface InventoryFiltersProps {
    availableCategories: string[];
    availableRarities: string[];
    selectedCategories: Set<string>;
    selectedRarities: Set<string>;
    setSelectedCategories: (callback: (prev: Set<string>) => Set<string>) => void;
    setSelectedRarities: (callback: (prev: Set<string>) => Set<string>) => void;
}

export default function InventoryFilters({
    availableCategories,
    availableRarities,
    selectedCategories,
    selectedRarities,
    setSelectedCategories,
    setSelectedRarities
}: InventoryFiltersProps) {
    return (
        <div className="p-6 space-y-6 border-t border-gray-200">
            {/* Categories */}
            <div>
                <h3 className="font-semibold mb-3">Filter by Category</h3>
                <div className="flex flex-wrap gap-3">
                    {availableCategories.map(category => (
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
                            {capitalize(category)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rarities */}
            <div>
                <h3 className="font-semibold mb-3">Filter by Rarity</h3>
                <div className="flex flex-wrap gap-3">
                    {Object.entries(RARITY_ORDER)
                        .sort(([,a], [,b]) => a - b)
                        .map(([rarity]) => (
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
                                        : rarity === 'rare'
                                            ? 'bg-gray-100 text-blue-600'
                                            : 'bg-gray-100 text-gray-500 hover:' + getRarityColor(rarity).replace('bg-', '')
                                    }
                                    transform hover:scale-105 active:scale-95`}
                            >
                                {capitalize(rarity)}
                            </button>
                        ))}
                </div>
            </div>
        </div>
    );
} 