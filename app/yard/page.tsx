"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { UserInventoryItem } from '../marketplace/types';
import { Timestamp } from 'firebase/firestore';

// Components
import DesktopMessage from './components/DesktopMessage';
import YardBackground from './components/YardBackground';
import ItemDetailModal from './components/ItemDetailModal';
import InventoryMenu from './components/InventoryMenu';

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
            <YardBackground />

            <DesktopMessage />

            <ItemDetailModal
                selectedItem={selectedItem}
                closeModal={closeModal}
            />

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