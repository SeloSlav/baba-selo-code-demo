import React, { useState } from 'react';
import Image from 'next/image';
import { UserInventoryItem } from '../../marketplace/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { createPortal } from 'react-dom';

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
    placedItems?: Array<{
        id: string;
        locationId: string;
        imageUrl: string;
        name: string;
    }>;
}

export default function YardBackground({ 
    isPlacementMode,
    selectedItem,
    onLocationSelect,
    onCancelPlacement,
    placedItems = []
}: YardBackgroundProps) {
    const [isImageLoading, setIsImageLoading] = useState(true);

    // Placement Instructions Portal
    const renderPlacementInstructions = () => {
        if (!isPlacementMode || !selectedItem) return null;
        
        return createPortal(
            <div 
                style={{
                    position: 'fixed',
                    top: '20px',
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
            <div className="absolute inset-0 pointer-events-none">
                {placedItems.map(item => {
                    const location = PLACEMENT_LOCATIONS.find(loc => loc.id === item.locationId);
                    if (!location) return null;

                    return (
                        <div
                            key={item.id}
                            style={{
                                position: 'absolute',
                                left: location.x,
                                top: location.y,
                                transform: 'translate(-50%, -50%)'
                            }}
                            className="w-16 h-16 relative"
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
                                    onClick={() => onLocationSelect(location.id)}
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

                    {/* Cancel Button - Absolute positioned at the bottom right */}
                    <button
                        onClick={onCancelPlacement}
                        className="absolute bottom-8 right-8 bg-white rounded-full w-12 h-12 shadow-xl hover:bg-gray-100 transition-colors flex items-center justify-center"
                        style={{ zIndex: 9999 }}
                    >
                        <FontAwesomeIcon icon={faXmark} className="text-xl text-gray-600" />
                    </button>
                </>
            )}

            {/* Render the portal for placement instructions */}
            {renderPlacementInstructions()}
        </div>
    );
} 