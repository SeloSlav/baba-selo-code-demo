"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { UserInventoryItem } from '../marketplace/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Timestamp } from 'firebase/firestore';

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

const getRarityColor = (rarity: string): string => {
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
        default:
            return 'bg-gray-100 text-gray-600';
    }
};

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const RARITY_ORDER = {
    'rare': 2,
    'epic': 3,
    'legendary': 4,
    'uncommon': 1,
    'common': 0
};

export default function Yard() {
    const { user } = useAuth();
    const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<UserInventoryItem | null>(null);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set());
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    // Handle PWA install prompt
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowInstallBanner(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setShowInstallBanner(false);
        }
        setDeferredPrompt(null);
    };

    // Fetch user's inventory
    useEffect(() => {
        const fetchInventory = async () => {
            if (!user) return;
            
            try {
                const userInventoryRef = doc(db, `users/${user.uid}/inventory/items`);
                const userInventoryDoc = await getDoc(userInventoryRef);
                
                if (userInventoryDoc.exists()) {
                    // Filter out Olive Oil items
                    const items = userInventoryDoc.data()?.items || [];
                    const filteredItems = items.filter(item => item.category !== 'Olive Oil');
                    setInventory(filteredItems);
                }
            } catch (error) {
                console.error('Error fetching inventory:', error);
            }
        };

        fetchInventory();
    }, [user]);

    const handleItemClick = (item: UserInventoryItem) => {
        setSelectedItem(item);
    };

    const closeModal = () => {
        setSelectedItem(null);
    };

    const filteredInventory = useMemo(() => {
        let filtered = inventory.filter(item => {
            if (selectedRarities.size > 0 && !selectedRarities.has(item.rarity)) return false;
            if (selectedCategories.size > 0 && !selectedCategories.has(item.category)) return false;
            return true;
        });

        // Sort by purchase date (newest first) if no filters are applied
        if (selectedRarities.size === 0 && selectedCategories.size === 0) {
            filtered.sort((a, b) => {
                const dateA = a.purchasedAt instanceof Timestamp ? 
                    a.purchasedAt.toDate().getTime() : 
                    a.purchasedAt.getTime();
                const dateB = b.purchasedAt instanceof Timestamp ? 
                    b.purchasedAt.toDate().getTime() : 
                    b.purchasedAt.getTime();
                return dateB - dateA; // Sort in descending order (newest first)
            });
        }

        return filtered;
    }, [inventory, selectedRarities, selectedCategories]);

    const availableCategories = useMemo(() => {
        const categories = new Set(inventory.map(item => item.category));
        return Array.from(categories);
    }, [inventory]);

    const availableRarities = useMemo(() => {
        const rarities = new Set(inventory.map(item => item.rarity));
        return Array.from(rarities);
    }, [inventory]);

    return (
        <div className="fixed inset-0 overflow-hidden [orientation:portrait]">
            {/* Install Banner */}
            {showInstallBanner && (
                <div className="fixed top-0 left-0 right-0 bg-black text-white z-50 shadow-lg">
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                            <span className="text-lg">📱</span>
                            <span className="text-sm font-medium">Add to Home Screen for the best experience!</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowInstallBanner(false)}
                                className="text-white/60 hover:text-white px-2 py-1 text-sm"
                            >
                                Later
                            </button>
                            <button
                                onClick={handleInstallClick}
                                className="bg-white text-black px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 active:bg-gray-200"
                            >
                                Install
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Background Image - Full size with horizontal scroll */}
            <div className={`relative h-screen w-screen overflow-x-auto custom-scrollbar ${showInstallBanner ? 'mt-12' : ''}`}>
                <div className="absolute inset-0">
                    <Image
                        src="/yard_mobile.png"
                        alt="Your Yard"
                        fill
                        className="object-contain object-top md:hidden"
                        priority
                        quality={100}
                        sizes="100vw"
                    />
                    <Image
                        src="/yard.png"
                        alt="Your Yard"
                        fill
                        className="hidden md:block object-cover"
                        priority
                        quality={100}
                        sizes="100vw"
                    />
                </div>
            </div>

            {/* Desktop optimization message */}
            <div className="hidden md:flex fixed inset-0 items-center justify-center bg-black bg-opacity-70 z-50">
                <div className="bg-white rounded-3xl p-8 max-w-lg mx-4 text-center shadow-2xl transform transition-all duration-300 hover:scale-105">
                    <div className="text-4xl mb-4">📱</div>
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Best Experienced on Mobile</h2>
                    <p className="text-gray-600 mb-6">
                        The Yard game is optimized for mobile play. Visit{' '}
                        <a 
                            href="https://babaselo.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition-colors underline"
                        >
                            babaselo.com
                        </a>
                        {' '}on your phone for the optimal gaming experience!
                    </p>
                </div>
            </div>

            {/* Item Detail Modal */}
            {selectedItem && (
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

                            <button
                                onClick={() => {
                                    // Handle item use here
                                    closeModal();
                                }}
                                className="w-full px-4 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                            >
                                Use This Item
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Inventory Menu - Fixed at bottom with pull-up bar */}
            <div className={`fixed bottom-0 left-0 right-0 transition-transform duration-300 ease-in-out transform md:hidden ${
                isInventoryOpen ? 'translate-y-0' : 'translate-y-[calc(100%-102px)]'
            }`}>
                {/* Pull-up bar */}
                <div 
                    className="bg-white bg-opacity-95 backdrop-blur-sm border-t border-gray-200 rounded-t-xl"
                >
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
                    )}
                </div>

                {/* Inventory content */}
                <div className="bg-white bg-opacity-95 shadow-lg backdrop-blur-sm">
                    <div className="p-4">
                        <div className="overflow-x-auto pb-2 custom-scrollbar">
                            <div className="flex gap-3 px-2 min-w-full">
                                {filteredInventory.map((item, index) => (
                                    <div 
                                        key={`${item.id}-${index}`}
                                        className="flex-shrink-0 w-28 bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow active:scale-95"
                                        onClick={() => handleItemClick(item)}
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
        </div>
    );
} 