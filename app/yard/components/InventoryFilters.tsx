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
        <div className="px-4 pb-3 border-t border-gray-200">
            {/* Categories */}
            <div className="mb-3">
                <h4 className="text-xs font-medium text-gray-500 mb-2">Category</h4>
                <div className="flex flex-wrap gap-2">
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
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                                selectedCategories.has(category)
                                    ? getCategoryColor(category) + ' ring-2 ring-offset-2 ring-gray-500'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {capitalize(category)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rarities */}
            <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">Rarity</h4>
                <div className="flex flex-wrap gap-2">
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
                                className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                                    selectedRarities.has(rarity)
                                        ? getRarityColor(rarity) + ' ring-2 ring-offset-2 ring-gray-500'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {capitalize(rarity)}
                            </button>
                        ))}
                </div>
            </div>
        </div>
    );
} 