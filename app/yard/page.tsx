"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { UserInventoryItem } from '../marketplace/types';
import { Timestamp } from 'firebase/firestore';

// Components
import DesktopMessage from './components/DesktopMessage';
import YardBackground from './components/YardBackground';
import ItemDetailModal from './components/ItemDetailModal';
import InventoryMenu from './components/InventoryMenu';

interface PlacedItem {
    id: string;
    locationId: string;
    imageUrl: string;
    name: string;
}

export default function Yard() {
    const { user } = useAuth();
    const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<UserInventoryItem | null>(null);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set());
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [isPlacementMode, setIsPlacementMode] = useState(false);
    const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);

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

    // Fetch placed items
    useEffect(() => {
        const fetchPlacedItems = async () => {
            if (!user) return;

            try {
                const yardRef = doc(db, `users/${user.uid}/yard/items`);
                const yardDoc = await getDoc(yardRef);

                if (yardDoc.exists()) {
                    setPlacedItems(yardDoc.data()?.items || []);
                } else {
                    // Initialize yard document if it doesn't exist
                    await setDoc(yardRef, { items: [] });
                }
            } catch (error) {
                console.error('Error fetching placed items:', error);
            }
        };

        fetchPlacedItems();
    }, [user]);

    const handleItemClick = (item: UserInventoryItem) => {
        setSelectedItem(item);
    };

    const closeModal = () => {
        setSelectedItem(null);
        setIsPlacementMode(false);
    };

    const handleUseItem = (item: UserInventoryItem) => {
        if (item.category.toLowerCase() === 'food' || item.category.toLowerCase() === 'toy') {
            setIsPlacementMode(true);
            setSelectedItem(item);
            setIsInventoryOpen(false);
            setIsFiltersOpen(false);
        }
    };

    const handleLocationSelect = async (locationId: string) => {
        if (!user || !selectedItem) return;

        try {
            // Create new placed item
            const newPlacedItem: PlacedItem = {
                id: `${selectedItem.id}-${Date.now()}`,
                locationId,
                imageUrl: selectedItem.imageUrl,
                name: selectedItem.name
            };

            // Update Firestore
            const yardRef = doc(db, `users/${user.uid}/yard/items`);
            await updateDoc(yardRef, {
                items: arrayUnion(newPlacedItem)
            });

            // Remove item from inventory in Firestore
            const userInventoryRef = doc(db, `users/${user.uid}/inventory/items`);
            await updateDoc(userInventoryRef, {
                items: arrayRemove(selectedItem)
            });

            // Update local state
            setPlacedItems(prev => [...prev, newPlacedItem]);
            setInventory(prev => prev.filter(item => item.id !== selectedItem.id));
            
            // Reset placement mode
            setSelectedItem(null);
            setIsPlacementMode(false);
        } catch (error) {
            console.error('Error placing item:', error);
        }
    };

    const handleCancelPlacement = () => {
        setIsPlacementMode(false);
        setSelectedItem(null);
        setIsInventoryOpen(true);
    };

    const handleItemReturn = async (item: PlacedItem) => {
        if (!user) return;

        try {
            // For food items, we just remove them from the yard
            if (item.locationId.startsWith('food')) {
                const yardRef = doc(db, `users/${user.uid}/yard/items`);
                await updateDoc(yardRef, {
                    items: arrayRemove(item)
                });
                setPlacedItems(prev => prev.filter(i => i.id !== item.id));
                return;
            }

            // For toys, we return them to inventory
            const inventoryItem: UserInventoryItem = {
                id: item.id.split('-')[0], // Remove the timestamp part
                name: item.name,
                imageUrl: item.imageUrl,
                category: 'toy',
                rarity: 'common',
                description: '',
                purchasedAt: new Date(),
                cost: 0
            };

            // Add item back to inventory in Firestore
            const userInventoryRef = doc(db, `users/${user.uid}/inventory/items`);
            await updateDoc(userInventoryRef, {
                items: arrayUnion(inventoryItem)
            });

            // Remove item from yard in Firestore
            const yardRef = doc(db, `users/${user.uid}/yard/items`);
            await updateDoc(yardRef, {
                items: arrayRemove(item)
            });

            // Update local state
            setInventory(prev => [...prev, inventoryItem]);
            setPlacedItems(prev => prev.filter(i => i.id !== item.id));
        } catch (error) {
            console.error('Error handling item:', error);
        }
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
            <YardBackground
                isPlacementMode={isPlacementMode}
                selectedItem={selectedItem}
                onLocationSelect={handleLocationSelect}
                onCancelPlacement={handleCancelPlacement}
                onItemReturn={handleItemReturn}
                placedItems={placedItems}
            />

            <DesktopMessage />

            {selectedItem && !isPlacementMode && (
                <ItemDetailModal
                    selectedItem={selectedItem}
                    closeModal={closeModal}
                    onUseItem={handleUseItem}
                />
            )}

            <InventoryMenu
                isInventoryOpen={isInventoryOpen}
                setIsInventoryOpen={setIsInventoryOpen}
                isFiltersOpen={isFiltersOpen}
                setIsFiltersOpen={setIsFiltersOpen}
                filteredInventory={filteredInventory}
                inventory={inventory}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                selectedRarities={selectedRarities}
                setSelectedRarities={setSelectedRarities}
                availableCategories={availableCategories}
                availableRarities={availableRarities}
                onItemClick={handleItemClick}
            />
        </div>
    );
} 