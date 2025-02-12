import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { UserInventoryItem } from '../../marketplace/types';
import InventoryItem from './InventoryItem';
import InventoryFilters from './InventoryFilters';

interface InventoryMenuProps {
    isInventoryOpen: boolean;
    setIsInventoryOpen: (isOpen: boolean) => void;
    isFiltersOpen: boolean;
    setIsFiltersOpen: (isOpen: boolean) => void;
    filteredInventory: UserInventoryItem[];
    inventory: UserInventoryItem[];
    selectedCategories: Set<string>;
    setSelectedCategories: (callback: (prev: Set<string>) => Set<string>) => void;
    selectedRarities: Set<string>;
    setSelectedRarities: (callback: (prev: Set<string>) => Set<string>) => void;
    availableCategories: string[];
    availableRarities: string[];
    onItemClick: (item: UserInventoryItem) => void;
}

export default function InventoryMenu({
    isInventoryOpen,
    setIsInventoryOpen,
    isFiltersOpen,
    setIsFiltersOpen,
    filteredInventory,
    inventory,
    selectedCategories,
    setSelectedCategories,
    selectedRarities,
    setSelectedRarities,
    availableCategories,
    availableRarities,
    onItemClick
}: InventoryMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && 
                !menuRef.current.contains(event.target as Node) && 
                isInventoryOpen) {
                setIsInventoryOpen(false);
                setIsFiltersOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isInventoryOpen, setIsInventoryOpen, setIsFiltersOpen]);

    return (
        <div 
            ref={menuRef}
            className={`fixed bottom-0 left-0 right-0 transition-transform duration-300 ease-in-out transform md:hidden z-30 ${
            isInventoryOpen ? 'translate-y-0' : 'translate-y-[calc(100%-102px)]'
        }`}>
            {/* Pull-up bar */}
            <div className="bg-white bg-opacity-95 backdrop-blur-sm border-t border-gray-200 rounded-t-xl">
                <div 
                    className="cursor-pointer"
                    onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                >
                    <div className="flex items-center justify-center py-2 px-4">
                        <div className="w-12 h-1 bg-gray-300 rounded-full mb-2"></div>
                    </div>
                    <div className="flex items-center justify-between px-4 pb-2">
                        <span className="text-sm font-medium text-gray-600">Your Items ({filteredInventory.length})</span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isInventoryOpen) {
                                        setIsInventoryOpen(true);
                                    }
                                    setIsFiltersOpen(!isFiltersOpen);
                                }}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-colors ${
                                    isFiltersOpen 
                                        ? 'bg-black text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <span>Filter</span>
                                {(selectedRarities.size + selectedCategories.size) > 0 && (
                                    <span className="bg-white bg-opacity-20 text-xs px-1.5 py-0.5 rounded-full">
                                        {selectedRarities.size + selectedCategories.size}
                                    </span>
                                )}
                            </button>
                            <div className="w-px h-6 bg-gray-200"></div>
                            <button
                                onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                                className="p-1"
                            >
                                <FontAwesomeIcon 
                                    icon={faChevronUp} 
                                    className={`text-gray-400 transition-transform duration-300 ${isInventoryOpen ? 'rotate-180' : ''}`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                {isInventoryOpen && isFiltersOpen && (
                    <InventoryFilters
                        availableCategories={availableCategories}
                        availableRarities={availableRarities}
                        selectedCategories={selectedCategories}
                        selectedRarities={selectedRarities}
                        setSelectedCategories={setSelectedCategories}
                        setSelectedRarities={setSelectedRarities}
                    />
                )}
            </div>

            {/* Inventory content */}
            <div className="bg-white bg-opacity-95 shadow-lg backdrop-blur-sm">
                <div className="p-4">
                    <div className="overflow-x-auto pb-2 custom-scrollbar">
                        <div className="flex gap-3 px-2 min-w-full">
                            {filteredInventory.map((item, index) => (
                                <InventoryItem
                                    key={`${item.id}-${index}`}
                                    item={item}
                                    index={index}
                                    onClick={onItemClick}
                                />
                            ))}
                            {filteredInventory.length === 0 && (
                                <div className="flex-1 flex items-center justify-center py-4 text-gray-500">
                                    {inventory.length === 0 ? 'No items in inventory' : 'No items match the selected filters'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 