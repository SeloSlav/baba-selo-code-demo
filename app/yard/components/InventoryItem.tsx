import React from 'react';
import Image from 'next/image';
import { UserInventoryItem } from '../../marketplace/types';
import { getRarityColor, getCategoryColor } from '../utils/colors';
import { capitalize } from '../utils/helpers';

interface InventoryItemProps {
    item: UserInventoryItem;
    index: number;
    onClick: (item: UserInventoryItem) => void;
}

export default function InventoryItem({ item, index, onClick }: InventoryItemProps) {
    return (
        <div 
            key={`${item.id}-${index}`}
            className="flex-shrink-0 w-28 bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow active:scale-95"
            onClick={() => onClick(item)}
        >
            <div className="relative h-28 w-28">
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
            <div className="p-2">
                <p className="text-xs font-medium truncate mb-1.5">{item.name}</p>
                <div className="flex flex-col gap-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getRarityColor(item.rarity)}`}>
                        {capitalize(item.rarity)}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(item.category)}`}>
                        {capitalize(item.category)}
                    </span>
                </div>
            </div>
        </div>
    );
} 