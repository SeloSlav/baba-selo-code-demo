import React, { useState, useMemo, useRef } from 'react';
import { UserInventoryItem, Rarity } from '../types';
import { format } from 'date-fns';
import Image from 'next/image';
import { Timestamp } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faChevronDown, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface UserInventoryProps {
    items: UserInventoryItem[];
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

export const UserInventory: React.FC<UserInventoryProps> = ({ items }) => {
    const [selectedRarities, setSelectedRarities] = useState<Set<Rarity>>(new Set());
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Update the categories array to include all possible categories
    const categories = [...new Set([...items.map(item => item.category), 'food', 'toy', 'accessory', 'Olive Oil'])];

    // Filter items
    const filteredItems = useMemo(() => {
        let filtered = [...items];

        // Apply rarity filter if any rarities are selected
        if (selectedRarities.size > 0) {
            filtered = filtered.filter(item => selectedRarities.has(item.rarity));
        }

        // Apply category filter if any categories are selected
        if (selectedCategories.size > 0) {
            filtered = filtered.filter(item => selectedCategories.has(item.category));
        }

        // If no category filters are applied, sort Olive Oil items to the top
        if (selectedCategories.size === 0) {
            filtered.sort((a, b) => {
                // First prioritize Olive Oil category
                if (a.category === 'Olive Oil' && b.category !== 'Olive Oil') return -1;
                if (a.category !== 'Olive Oil' && b.category === 'Olive Oil') return 1;
                
                // Then sort by purchase date (newest first)
                const dateA = a.purchasedAt instanceof Timestamp ? 
                    a.purchasedAt.toDate().getTime() : 
                    a.purchasedAt.getTime();
                const dateB = b.purchasedAt instanceof Timestamp ? 
                    b.purchasedAt.toDate().getTime() : 
                    b.purchasedAt.getTime();
                return dateB - dateA;
            });
        }

        return filtered;
    }, [items, selectedRarities, selectedCategories]);

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

    // Get active filters count
    const activeFiltersCount = selectedRarities.size + selectedCategories.size;

    // Add scroll functions
    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300; // Adjust this value to control scroll distance
            const newScrollPosition = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            scrollContainerRef.current.scrollTo({
                left: newScrollPosition,
                behavior: 'smooth'
            });
        }
    };

    if (items.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <p className="text-gray-500">Your inventory is empty. Purchase some goodies!</p>
            </div>
        );
    }

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
                            <span className="font-semibold">Filter Inventory</span>
                            {(selectedRarities.size + selectedCategories.size) > 0 && (
                                <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                    {selectedRarities.size + selectedCategories.size} active
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
                            {categories.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3">Filter by Category</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {categories.map((category) => (
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
                            )}

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
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Grid with Scroll Arrows */}
            <div className="mt-4 flex-1 relative group">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black bg-opacity-20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-opacity-30"
                    aria-label="Scroll left"
                >
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black bg-opacity-20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-opacity-30"
                    aria-label="Scroll right"
                >
                    <FontAwesomeIcon icon={faChevronRight} />
                </button>

                <div className="bg-white rounded-3xl border border-gray-300 p-6">
                    <div 
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto pb-4 custom-scrollbar gap-4 snap-x snap-mandatory"
                    >
                        {filteredItems.map((item) => {
                            const purchaseDate = item.purchasedAt instanceof Timestamp ? 
                                item.purchasedAt.toDate() : 
                                item.purchasedAt;
                            
                            return (
                                <div 
                                    key={`${item.id}-${purchaseDate.getTime()}`}
                                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow flex-shrink-0 w-[280px] snap-start"
                                >
                                    <div className="flex flex-col">
                                        <div className="relative h-40 w-full">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                                onError={(e) => {
                                                    const imgElement = e.target as HTMLImageElement;
                                                    const parent = imgElement.parentElement;
                                                    if (parent) {
                                                        parent.classList.add('bg-gray-100', 'flex', 'items-center', 'justify-center');
                                                        parent.innerHTML = `
                                                            <div class="text-gray-400 text-center">
                                                                <div class="text-2xl">🎁</div>
                                                            </div>
                                                        `;
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="p-4">
                                            <div className="mb-2">
                                                <h3 className="font-semibold mb-2">{item.name}</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRarityColor(item.rarity)}`}>
                                                        {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
                                                    </span>
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                                                        {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* No results message */}
                    {filteredItems.length === 0 && (
                        <div className="text-center py-8 bg-white rounded-xl shadow-md">
                            <p className="text-gray-500">No items match your filters. Try adjusting your selection.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}; 