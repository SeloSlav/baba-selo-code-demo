import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpoon } from '@fortawesome/free-solid-svg-icons';
import { Goodie, Rarity } from '../types';
import Image from 'next/image';

interface MarketplaceListProps {
    goodies: Goodie[];
    onPurchase: (goodie: Goodie) => void;
}

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
    const sortedGoodies = useMemo(() => {
        return [...goodies]
            .filter(goodie => !goodie.hidden)
            .sort((a, b) => a.cost - b.cost);
    }, [goodies]);

    return (
        <div className="flex flex-col h-full">
            <div className="mt-4 flex-1 overflow-y-auto pr-6">
                <div className="bg-white rounded-3xl border border-gray-300 p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {sortedGoodies
                            .map((goodie) => (
                                <div 
                                    key={goodie.id}
                                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                                >
                                    <div className="relative h-56 w-full">
                                        <Image
                                            src={goodie.imageUrl}
                                            alt={goodie.name}
                                            fill
                                            className="object-cover"
                                            onError={(e) => {
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
                                    <div className="p-6 flex flex-col flex-grow">
                                        <div>
                                            <h3 className="text-xl font-semibold mb-2">{goodie.name}</h3>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRarityColor(goodie.rarity)}`}>
                                                    {goodie.rarity.charAt(0).toUpperCase() + goodie.rarity.slice(1)}
                                                </span>
                                                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-600">
                                                    Discount Code
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-6">{goodie.description}</p>
                                        </div>
                                        <div className="mt-auto pt-6 border-t border-gray-200">
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
                                </div>
                            ))}
                    </div>

                    {/* No results message */}
                    {sortedGoodies.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl shadow-md">
                            <p className="text-gray-500">No discount codes available yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}; 