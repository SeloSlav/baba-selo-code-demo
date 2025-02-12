import React, { useState } from 'react';
import Image from 'next/image';
import { UserInventoryItem } from '../../marketplace/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { createPortal } from 'react-dom';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

interface PlacementLocation {
    id: string;
    type: 'food' | 'toy';
    x: string;
    y: string;
}

const PLACEMENT_LOCATIONS: PlacementLocation[] = [
    { id: 'food1', type: 'food', x: '50%', y: '77%' },
    { id: 'toy1', type: 'toy', x: '30%', y: '77%' },
    { id: 'toy2', type: 'toy', x: '45%', y: '65%' },
    { id: 'toy3', type: 'toy', x: '55%', y: '29%' },
    { id: 'toy4', type: 'toy', x: '65%', y: '58%' },
    { id: 'toy5', type: 'toy', x: '70%', y: '73%' },
];

interface YardBackgroundProps {
    isPlacementMode: boolean;
    selectedItem: UserInventoryItem | null;
    onLocationSelect: (locationId: string) => void;
    onCancelPlacement: () => void;
    onItemReturn: (item: { id: string; locationId: string; imageUrl: string; name: string; }) => void;
    placedItems?: Array<{
        id: string;
        locationId: string;
        imageUrl: string;
        name: string;
    }>;
    userId: string;
    setPlacedItems: React.Dispatch<React.SetStateAction<Array<{
        id: string;
        locationId: string;
        imageUrl: string;
        name: string;
    }>>>;
}

export default function YardBackground({ 
    isPlacementMode,
    selectedItem,
    onLocationSelect,
    onCancelPlacement,
    onItemReturn,
    placedItems = [],
    userId,
    setPlacedItems
}: YardBackgroundProps) {
    const [isImageLoading, setIsImageLoading] = useState(true);
    const [itemToReturn, setItemToReturn] = useState<{
        id: string;
        locationId: string;
        imageUrl: string;
        name: string;
    } | null>(null);

    const [itemToReplace, setItemToReplace] = useState<{
        existingItem: {
            id: string;
            locationId: string;
            imageUrl: string;
            name: string;
        };
        newLocationId: string;
    } | null>(null);

    // Placement Instructions Portal
    const renderPlacementInstructions = () => {
        if (!isPlacementMode || !selectedItem) return null;
        
        return createPortal(
            <div 
                style={{
                    position: 'fixed',
                    top: '80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 99999,
                    background: '#000000',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    fontSize: '16px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none'
                }}
            >
                Select a location to place your {selectedItem.category.toLowerCase()}
            </div>,
            document.body
        );
    };

    const handleItemClick = (item: {
        id: string;
        locationId: string;
        imageUrl: string;
        name: string;
    }) => {
        if (!isPlacementMode) {
            setItemToReturn(item);
        }
    };

    const handleConfirmReturn = () => {
        if (itemToReturn) {
            onItemReturn(itemToReturn);
            setItemToReturn(null);
        }
    };

    const handleLocationClick = (locationId: string) => {
        // Check if there's already an item at this location
        const existingItem = placedItems?.find(item => item.locationId === locationId);
        
        if (existingItem) {
            setItemToReplace({
                existingItem,
                newLocationId: locationId
            });
        } else {
            onLocationSelect(locationId);
        }
    };

    const handleConfirmReplace = async () => {
        if (!itemToReplace || !selectedItem) return;

        // First return/remove the existing item
        if (!itemToReplace.existingItem.locationId.startsWith('food')) {
            // For toys, return to inventory first
            await onItemReturn(itemToReplace.existingItem);
        } else {
            // For food, just remove it
            const yardRef = doc(db, `users/${userId}/yard/items`);
            await updateDoc(yardRef, {
                items: arrayRemove(itemToReplace.existingItem)
            });
            setPlacedItems(prev => prev.filter(i => i.id !== itemToReplace.existingItem.id));
        }

        // Then place the new item
        onLocationSelect(itemToReplace.newLocationId);
        setItemToReplace(null);
    };

    const isFood = (locationId: string) => locationId.startsWith('food');

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-gray-100">
            {/* Loading State */}
            {isImageLoading && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <div className="text-gray-400">Loading yard...</div>
                </div>
            )}

            {/* Background Images Container */}
            <div className="absolute inset-0">
                {/* Mobile Yard */}
                <div className="relative w-full h-full flex items-center justify-center md:hidden">
                    <Image
                        src="/yard_mobile.png"
                        alt="Your Yard"
                        fill
                        className="object-contain"
                        priority
                        quality={75}
                        sizes="100vw"
                        onLoadingComplete={() => setIsImageLoading(false)}
                    />
                </div>

                {/* Desktop Yard */}
                <div className="relative w-full h-full hidden md:flex items-center justify-center">
                    <Image
                        src="/yard.png"
                        alt="Your Yard"
                        fill
                        className="object-contain"
                        priority
                        quality={75}
                        sizes="100vw"
                        onLoadingComplete={() => setIsImageLoading(false)}
                    />
                </div>
            </div>

            {/* Placed Items */}
            <div className="absolute inset-0">
                {placedItems.map((item, index) => {
                    const location = PLACEMENT_LOCATIONS.find(loc => loc.id === item.locationId);
                    if (!location) return null;

                    return (
                        <div
                            key={`${item.id}-${index}`}
                            onClick={() => handleItemClick(item)}
                            style={{
                                position: 'absolute',
                                left: location.x,
                                top: location.y,
                                transform: 'translate(-50%, -50%)'
                            }}
                            className="w-16 h-16 relative cursor-pointer hover:scale-110 transition-transform"
                        >
                            <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                className="object-contain"
                            />
                        </div>
                    );
                })}
            </div>

            {/* Placement Mode UI */}
            {isPlacementMode && selectedItem && (
                <>
                    {/* Main placement container */}
                    <div className="absolute inset-0" style={{ zIndex: 9998 }}>
                        {/* Semi-transparent overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-25" />

                        {/* Placement Locations */}
                        {PLACEMENT_LOCATIONS
                            .filter(location => {
                                if (selectedItem.category.toLowerCase() === 'food') {
                                    return location.type === 'food';
                                }
                                if (selectedItem.category.toLowerCase() === 'toy') {
                                    return location.type === 'toy';
                                }
                                return false;
                            })
                            .map(location => (
                                <button
                                    key={location.id}
                                    onClick={() => handleLocationClick(location.id)}
                                    style={{
                                        position: 'absolute',
                                        left: location.x,
                                        top: location.y,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                    className={`w-12 h-12 rounded-full ${
                                        location.type === 'food' 
                                            ? 'bg-red-500 bg-opacity-40 hover:bg-opacity-60' 
                                            : 'bg-blue-500 bg-opacity-40 hover:bg-opacity-60'
                                    } border-4 ${
                                        location.type === 'food'
                                            ? 'border-red-500 border-opacity-70'
                                            : 'border-blue-500 border-opacity-70'
                                    } transition-all duration-200 cursor-pointer animate-pulse shadow-lg`}
                                />
                            ))}
                    </div>

                    {/* Cancel Button */}
                    <button
                        onClick={onCancelPlacement}
                        className="absolute bottom-8 right-8 bg-white rounded-full w-12 h-12 shadow-xl hover:bg-gray-100 transition-colors flex items-center justify-center"
                        style={{ zIndex: 9999 }}
                    >
                        <FontAwesomeIcon icon={faXmark} className="text-xl text-gray-600" />
                    </button>
                </>
            )}

            {/* Return/Remove Confirmation Dialog */}
            {itemToReturn && createPortal(
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]"
                    onClick={() => setItemToReturn(null)}
                >
                    <div 
                        className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-2">
                            {isFood(itemToReturn.locationId) ? 'Remove Food' : 'Return Item'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {isFood(itemToReturn.locationId) 
                                ? `Are you sure you want to throw away this ${itemToReturn.name}? Once placed, food cannot be returned to storage.`
                                : `Do you want to return this ${itemToReturn.name} to your inventory?`
                            }
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setItemToReturn(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReturn}
                                className={`flex-1 px-4 py-2 rounded-xl transition-colors ${
                                    isFood(itemToReturn.locationId)
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-black hover:bg-gray-800 text-white'
                                }`}
                            >
                                {isFood(itemToReturn.locationId) ? 'Remove Food' : 'Return to Inventory'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Replace Item Confirmation Dialog */}
            {itemToReplace && selectedItem && createPortal(
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]"
                    onClick={() => setItemToReplace(null)}
                >
                    <div 
                        className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-2">
                            {isFood(itemToReplace.existingItem.locationId) ? 'Replace Food' : 'Replace Item'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {isFood(itemToReplace.existingItem.locationId)
                                ? `This will remove the ${itemToReplace.existingItem.name} and place your ${selectedItem.name} here. The existing food will be thrown away.`
                                : `This will return the ${itemToReplace.existingItem.name} to your inventory and place your ${selectedItem.name} here.`
                            }
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setItemToReplace(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReplace}
                                className={`flex-1 px-4 py-2 rounded-xl transition-colors ${
                                    isFood(itemToReplace.existingItem.locationId)
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-black hover:bg-gray-800 text-white'
                                }`}
                            >
                                Replace
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Render the portal for placement instructions */}
            {renderPlacementInstructions()}
        </div>
    );
} 