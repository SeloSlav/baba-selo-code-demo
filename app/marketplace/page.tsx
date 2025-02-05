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

// List of admin UIDs who can initialize the marketplace
const ADMIN_UIDS = ['B9E3AdsEAYSrcfl4yPcT1XqyIfC2'];

export default function Marketplace() {
    const [state, setState] = useState<MarketplaceState>({
        goodies: [],
        userInventory: [],
        loading: true,
        error: null
    });
    const [initializing, setInitializing] = useState(false);
    const [adminPoints, setAdminPoints] = useState<string>('');
    const { user } = useAuth();
    const { showPointsToast } = usePoints();

    const handleUploadGoodies = async () => {
        if (!user || !ADMIN_UIDS.includes(user.uid)) return;
        
        try {
            setInitializing(true);
            const goodiesCollection = collection(db, 'goodies');
            
            const items = [
                {
                    name: "Basic Cat Kibble",
                    description: "Standard grain-free kibble made with real salmon. A reliable everyday meal for your feline friend.",
                    cost: 250,
                    rarity: 'common',
                    imageUrl: '/marketplace/premium-kibble.jpg',
                    category: 'food'
                },
                {
                    name: "Imported Tuna Feast",
                    description: "Premium wild-caught tuna from the Mediterranean Sea, prepared with a special blend of seasonings.",
                    cost: 500,
                    rarity: 'uncommon',
                    imageUrl: '/marketplace/tuna-feast.jpg',
                    category: 'food'
                },
                {
                    name: "Aged Wagyu Tartare",
                    description: "Rare Japanese A5 wagyu beef, aged to perfection and prepared with truffle essence. A delicacy few cats have tasted.",
                    cost: 1200,
                    rarity: 'rare',
                    imageUrl: '/marketplace/wagyu.jpg',
                    category: 'food'
                },
                {
                    name: "Celestial Sashimi Platter",
                    description: "An ethereal arrangement of the rarest deep-sea delicacies, garnished with edible stardust and moonlight-infused herbs.",
                    cost: 2800,
                    rarity: 'epic',
                    imageUrl: '/marketplace/sashimi.jpg',
                    category: 'food'
                },
                {
                    name: "Emperor's Caviar Feast",
                    description: "The most exquisite Beluga caviar, sourced from ancient Caspian sturgeon. Reserved for cats of the highest nobility.",
                    cost: 5000,
                    rarity: 'legendary',
                    imageUrl: '/marketplace/caviar.jpg',
                    category: 'food'
                },
                {
                    name: "Advanced Laser Pointer",
                    description: "Smart laser toy with AI-driven movement patterns and multiple play modes. A step above ordinary toys.",
                    cost: 400,
                    rarity: 'uncommon',
                    imageUrl: '/marketplace/laser-toy.jpg',
                    category: 'toy'
                },
                {
                    name: "Simple Catnip Mouse",
                    description: "A basic but reliable mouse toy with organic catnip filling. Every cat's starter toy.",
                    cost: 200,
                    rarity: 'common',
                    imageUrl: '/marketplace/catnip-mouse.jpg',
                    category: 'toy'
                },
                {
                    name: "Mystic Feather Wand",
                    description: "Crafted with enchanted phoenix feathers, this wand emanates an otherworldly energy that cats find irresistible.",
                    cost: 1000,
                    rarity: 'rare',
                    imageUrl: '/marketplace/feather-wand.jpg',
                    category: 'toy'
                },
                {
                    name: "Celestial Water Fountain",
                    description: "A masterpiece of crystal artistry that channels the energy of moonlight to purify water. Glows with an ethereal light.",
                    cost: 2500,
                    rarity: 'epic',
                    imageUrl: '/marketplace/crystal-fountain.jpg',
                    category: 'accessory'
                },
                {
                    name: "Royal Heated Throne",
                    description: "A majestic heated bed crafted for feline royalty, with enchanted memory foam and temperature-sensing crystals.",
                    cost: 1500,
                    rarity: 'rare',
                    imageUrl: '/marketplace/heated-bed.jpg',
                    category: 'accessory'
                },
                {
                    name: "Divine Golden Collar",
                    description: "Forged by celestial artisans using gold from fallen stars and diamonds from the heart of ancient mountains. The ultimate symbol of feline divinity.",
                    cost: 7500,
                    rarity: 'legendary',
                    imageUrl: '/marketplace/golden-collar.jpg',
                    category: 'accessory'
                }
            ];

            // Delete all existing goodies first
            const existingGoodies = await getDocs(goodiesCollection);
            const deletePromises = existingGoodies.docs.map(doc => 
                deleteDoc(doc.ref)
            );
            await Promise.all(deletePromises);

            // Add all items
            const addPromises = items.map(item => 
                addDoc(goodiesCollection, item)
            );
            await Promise.all(addPromises);

            showPointsToast(0, 'Goodies uploaded successfully! 🎉');
            
            // Refresh the goodies list
            const goodiesSnapshot = await getDocs(collection(db, 'goodies'));
            const goodies = goodiesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Goodie[];
            
            setState(prev => ({
                ...prev,
                goodies
            }));

        } catch (error) {
            console.error('Error uploading goodies:', error);
            showPointsToast(0, 'Failed to upload goodies');
        } finally {
            setInitializing(false);
        }
    };

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
                    cost: -goodie.cost,
                    itemName: goodie.name,
                    rarity: goodie.rarity
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

    const handleSetPoints = async () => {
        if (!user || !ADMIN_UIDS.includes(user.uid)) return;
        
        const value = parseInt(adminPoints);
        if (!isNaN(value)) {
            const userPointsRef = doc(db, 'spoonPoints', user.uid);
            await updateDoc(userPointsRef, {
                totalPoints: value
            });
            showPointsToast(0, `Points set to ${value}`);
            setAdminPoints(''); // Clear input after setting
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
                
                {/* Admin buttons */}
                {user && ADMIN_UIDS.includes(user.uid) && (
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={handleUploadGoodies}
                                disabled={initializing}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {initializing ? 'Uploading...' : 'Upload Goodies'}
                            </button>
                            <input
                                type="number"
                                value={adminPoints}
                                onChange={(e) => setAdminPoints(e.target.value)}
                                placeholder="Set points..."
                                className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                                onClick={handleSetPoints}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Set Points
                            </button>
                        </div>
                    </div>
                )}
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