import React from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { UserInventoryItem } from '../../marketplace/types';
import { getRarityColor, getCategoryColor } from '../utils/colors';
import { capitalize } from '../utils/helpers';

interface ItemDetailModalProps {
    selectedItem: UserInventoryItem | null;
    closeModal: () => void;
    onUseItem: (item: UserInventoryItem) => void;
}

export default function ItemDetailModal({ selectedItem, closeModal, onUseItem }: ItemDetailModalProps) {
    if (!selectedItem) return null;

    const isPlaceable = selectedItem.category.toLowerCase() === 'food' || selectedItem.category.toLowerCase() === 'toy';

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
        >
            <div 
                className="bg-white rounded-2xl w-full max-w-sm shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative p-4">
                    <button 
                        onClick={closeModal}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <FontAwesomeIcon icon={faXmark} className="text-xl" />
                    </button>

                    <div className="flex items-start gap-4 mb-4">
                        <div className="relative h-20 w-20 flex-shrink-0">
                            <Image
                                src={selectedItem.imageUrl}
                                alt={selectedItem.name}
                                fill
                                className="object-cover rounded-lg"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold mb-2">{selectedItem.name}</h3>
                            <div className="flex flex-wrap gap-2">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(selectedItem.rarity)}`}>
                                    {capitalize(selectedItem.rarity)}
                                </span>
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedItem.category)}`}>
                                    {capitalize(selectedItem.category)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-6">{selectedItem.description}</p>

                    {isPlaceable ? (
                        <button
                            onClick={() => onUseItem(selectedItem)}
                            className="w-full px-4 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                        >
                            Place {selectedItem.category}
                        </button>
                    ) : (
                        <button
                            disabled
                            className="w-full px-4 py-3 bg-gray-100 text-gray-400 rounded-xl font-medium cursor-not-allowed"
                        >
                            Cannot Place Accessories
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
} 