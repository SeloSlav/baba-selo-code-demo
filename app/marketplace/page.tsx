"use client";

import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, Timestamp, getDoc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { Goodie, UserInventoryItem, MarketplaceState } from './types';
import { MarketplaceList } from './components/MarketplaceList';
import { UserInventory } from './components/UserInventory';
import { SpoonPointSystem } from '../lib/spoonPoints';
import { usePoints } from '../context/PointsContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function Marketplace() {
    const [state, setState] = useState<MarketplaceState>({
        goodies: [],
        userInventory: [],
        loading: true,
        error: null
    });
    const { user } = useAuth();
    const { showPointsToast } = usePoints();

    useEffect(() => {
        const fetchMarketplaceData = async () => {
            if (!user) return;

            try {
                // Fetch goodies
                const goodiesSnapshot = await getDocs(collection(db, 'goodies'));
                const goodies = goodiesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Goodie[];

                // Fetch user's inventory
                const userInventoryRef = doc(db, `users/${user.uid}/inventory/items`);
                const userInventoryDoc = await getDoc(userInventoryRef);
                
                let inventory: UserInventoryItem[] = [];
                
                if (userInventoryDoc.exists()) {
                    inventory = userInventoryDoc.data()?.items || [];
                } else {
                    // Create empty inventory for new users
                    await setDoc(userInventoryRef, { items: [] });
                }

                setState(prev => ({
                    ...prev,
                    goodies,
                    userInventory: inventory,
                    loading: false
                }));
            } catch (error) {
                console.error('Error fetching marketplace data:', error);
                setState(prev => ({
                    ...prev,
                    error: 'Failed to load marketplace data',
                    loading: false
                }));
            }
        };

        fetchMarketplaceData();
    }, [user]);

    const handlePurchase = async (goodie: Goodie) => {
        if (!user) return;

        try {
            // Get current points
            const userPointsRef = doc(db, 'spoonPoints', user.uid);
            const userPointsDoc = await getDoc(userPointsRef);
            const currentPoints = userPointsDoc.data()?.totalPoints || 0;

            // Check if user has enough points
            if (currentPoints < goodie.cost) {
                showPointsToast(
                    0,
                    `Not enough spoons! You need ${goodie.cost} spoons but have ${currentPoints}.`
                );
                return;
            }

            // Only check for existing items if it's not a food item
            if (goodie.category !== 'food') {
                const existingItems = state.userInventory.filter(item => item.id === goodie.id);
                if (existingItems.length > 0) {
                    showPointsToast(
                        0,
                        'You already own this item! Only food items can be purchased multiple times.'
                    );
                    return;
                }
            }

            // Attempt to deduct points
            const pointsResult = await SpoonPointSystem.awardPoints(
                user.uid,
                'MARKETPLACE_PURCHASE',
                `purchase-${goodie.id}-${Date.now()}`,
                {
                    cost: -Math.abs(goodie.cost),
                    itemName: goodie.name,
                    rarity: goodie.rarity,
                    details: `Purchased ${goodie.name}`
                }
            );

            if (pointsResult.success) {
                // Prepare the new item
                const purchaseTime = new Date();
                const newItem = {
                    ...goodie,
                    purchasedAt: Timestamp.fromDate(purchaseTime)
                };

                // Get reference to user's inventory document
                const userInventoryRef = doc(db, `users/${user.uid}/inventory/items`);
                
                try {
                    // Try to update existing inventory
                    await updateDoc(userInventoryRef, {
                        items: arrayUnion(newItem)
                    });
                } catch (error) {
                    // If document doesn't exist, create it
                    if (error.code === 'not-found') {
                        await setDoc(userInventoryRef, {
                            items: [newItem]
                        });
                    } else {
                        throw error; // Re-throw if it's a different error
                    }
                }

                // Update local state
                setState(prev => ({
                    ...prev,
                    userInventory: [
                        ...prev.userInventory,
                        { ...goodie, purchasedAt: purchaseTime }
                    ]
                }));

                // Show a special purchase confirmation toast
                const rarityEmoji = {
                    common: '📦',
                    uncommon: '🎁',
                    rare: '✨',
                    epic: '🌟',
                    legendary: '👑'
                }[goodie.rarity] || '🛍️';

                showPointsToast(
                    -goodie.cost,
                    `${rarityEmoji} Purchased ${goodie.name}! (-${goodie.cost} spoons)`
                );
            } else {
                showPointsToast(
                    0,
                    'Not enough spoons to make this purchase!'
                );
            }
        } catch (error) {
            console.error('Error purchasing item:', error);
            showPointsToast(
                0,
                'Failed to complete purchase. Please try again.'
            );
        }
    };

    if (state.loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="text-red-500">{state.error}</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-2xl font-bold mb-4">Marketplace</h1>
                <p className="text-gray-600">Spend your hard-earned spoons on special goodies!</p>
            </div>

            {/* Mobile: Inventory first, Desktop: Side by side */}
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8">
                {/* Your Inventory - Shows first on mobile */}
                <div className="order-1 lg:order-2">
                    <div className="sticky top-4">
                        <h2 className="text-2xl font-semibold mb-6">Your Inventory</h2>
                        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 custom-scrollbar">
                            <UserInventory items={state.userInventory} />
                        </div>
                    </div>
                </div>

                {/* Available Items */}
                <div className="order-2 lg:order-1">
                    <h2 className="text-2xl font-semibold mb-6">Available Items</h2>
                    <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 custom-scrollbar">
                        <MarketplaceList 
                            goodies={state.goodies} 
                            onPurchase={handlePurchase}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
} 