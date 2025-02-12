"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, Timestamp, onSnapshot, writeBatch, increment } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { UserInventoryItem } from '../marketplace/types';
import { PlacedItem, CatHistoryEntry, Cat, CatVisit } from './types';
import { usePoints } from '../context/PointsContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCat, faQuestionCircle, faMusic, faVolumeXmark } from '@fortawesome/free-solid-svg-icons';

// Components
import DesktopMessage from './components/DesktopMessage';
import YardBackground from './components/YardBackground';
import ItemDetailModal from './components/ItemDetailModal';
import InventoryMenu from './components/InventoryMenu';
import CatHistoryMenu from './components/CatHistoryMenu';
import HelpDialog from './components/HelpDialog';

// Constants
const FOOD_EXPIRATION_TIME = 1000 * 60 * 60; // 1 hour
const CAT_CHECK_INTERVAL = 1000 * 30; // Check for cats every 30 seconds
const BASE_CAT_PROBABILITY = 0.1; // 10% base chance per check
const TOY_MULTIPLIER = 0.05; // Each toy adds 5% chance

// Music configuration
const YARD_MUSIC = {
    STRAY_CAT_SERENADE: {
        id: 'stray_cat_serenade',
        path: '/stray_cat_serenade.mp3',
        title: 'Stray Cat Serenade',
        defaultVolume: 1.0
    },
    STRAY_CAT_SERENADE_2: {
        id: 'stray_cat_serenade_2',
        path: '/stray_cat_serenade2.mp3',
        title: 'Stray Cat Serenade II',
        defaultVolume: 1.0
    }
} as const;

// Visit capacity by rarity
const VISIT_CAPACITY = {
    common: 1,
    uncommon: 3,
    rare: 5,
    epic: 10,
    legendary: 20
} as const;

export default function Yard() {
    const { user } = useAuth();
    const { showPointsToast } = usePoints();
    const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<UserInventoryItem | null>(null);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set());
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [isPlacementMode, setIsPlacementMode] = useState(false);
    const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
    const [isCatHistoryOpen, setIsCatHistoryOpen] = useState(false);
    const [catHistory, setCatHistory] = useState<CatHistoryEntry[]>([]);
    const [unreadCatVisits, setUnreadCatVisits] = useState<number>(0);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isMusicPlaying, setIsMusicPlaying] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentSong, setCurrentSong] = useState<keyof typeof YARD_MUSIC>('STRAY_CAT_SERENADE');

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

    // Fetch placed items and set up real-time listener for cat history
    useEffect(() => {
        if (!user) return;

        const fetchPlacedItems = async () => {
            try {
                const yardRef = doc(db, `users/${user.uid}/yard/items`);
                const yardDoc = await getDoc(yardRef);

                if (yardDoc.exists()) {
                    setPlacedItems(yardDoc.data()?.items || []);
                } else {
                    await setDoc(yardRef, { items: [] });
                }
            } catch (error) {
                console.error('Error fetching placed items:', error);
            }
        };

        // Set up real-time listener for cat history and placed items
        const unsubscribeHistory = onSnapshot(
            doc(db, `users/${user.uid}/yard/catHistory`),
            (doc) => {
                if (doc.exists()) {
                    const historyData = doc.data()?.history || [];
                    const processedHistory = historyData.map((entry: any) => ({
                        ...entry,
                        visit: {
                            ...entry.visit,
                            timestamp: entry.visit.timestamp.toDate()
                        }
                    }));
                    setCatHistory(processedHistory);
                    
                    // Count unread visits
                    const unreadCount = processedHistory.filter(
                        (entry: CatHistoryEntry) => !entry.visit.read
                    ).length;
                    setUnreadCatVisits(unreadCount);
                }
            }
        );

        // Add real-time listener for yard items to catch updates from the cloud function
        const unsubscribeYard = onSnapshot(
            doc(db, `users/${user.uid}/yard/items`),
            (doc) => {
                if (doc.exists()) {
                    setPlacedItems(doc.data()?.items || []);
                }
            }
        );

        fetchPlacedItems();
        return () => {
            unsubscribeHistory();
            unsubscribeYard();
        };
    }, [user]);

    // Check for expired food items
    useEffect(() => {
        if (!user) return;

        const checkExpiredFood = async () => {
            const now = new Date();
            let updatedItems = [...placedItems];
            let needsUpdate = false;

            // Check for expired food
            updatedItems = updatedItems.filter(item => {
                if (item.locationId.startsWith('food')) {
                    return item.remainingVisits && item.remainingVisits > 0;
                }
                return true;
            });

            if (updatedItems.length !== placedItems.length) {
                needsUpdate = true;
            }

            if (needsUpdate) {
                const yardRef = doc(db, `users/${user.uid}/yard/items`);
                await updateDoc(yardRef, { items: updatedItems });
                setPlacedItems(updatedItems);
            }
        };

        const interval = setInterval(checkExpiredFood, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [user, placedItems]);

    // Function to handle cat visit response
    const handleCatVisitResponse = (visitedFood: Array<{
        id: string;
        remainingVisits: number;
        removed: boolean;
    }>) => {
        setPlacedItems(prev => {
            const updated = [...prev];
            visitedFood.forEach(food => {
                const index = updated.findIndex(item => item.id === food.id);
                if (index !== -1) {
                    if (food.removed) {
                        // Remove the item if it has been consumed
                        updated.splice(index, 1);
                    } else {
                        // Update remaining visits
                        updated[index] = {
                            ...updated[index],
                            remainingVisits: food.remainingVisits
                        };
                    }
                }
            });
            return updated;
        });
    };

    // Function to mark visits as read
    const handleMarkVisitsRead = async () => {
        if (!user || !catHistory.length) return;

        try {
            const historyRef = doc(db, `users/${user.uid}/yard/catHistory`);
            const updatedHistory = catHistory.map(entry => ({
                ...entry,
                visit: {
                    ...entry.visit,
                    read: true,
                    timestamp: Timestamp.fromDate(entry.visit.timestamp)
                }
            }));

            await updateDoc(historyRef, {
                history: updatedHistory
            });
        } catch (error) {
            console.error('Error marking visits as read:', error);
        }
    };

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
            const now = new Date();
            // Create new placed item
            const newPlacedItem: PlacedItem = {
                id: `${selectedItem.id}-${Date.now()}`,
                locationId,
                imageUrl: selectedItem.imageUrl,
                name: selectedItem.name,
                placedAt: now,
                rarity: selectedItem.rarity,
                ...(locationId.startsWith('food') ? {
                    maxVisits: VISIT_CAPACITY[selectedItem.rarity as keyof typeof VISIT_CAPACITY],
                    remainingVisits: VISIT_CAPACITY[selectedItem.rarity as keyof typeof VISIT_CAPACITY]
                } : {})
            };

            // Get current inventory
            const userInventoryRef = doc(db, `users/${user.uid}/inventory/items`);
            const inventoryDoc = await getDoc(userInventoryRef);
            const currentItems = inventoryDoc.data()?.items || [];

            // Find the index of the first matching item
            const itemIndex = currentItems.findIndex(item => 
                item.id === selectedItem.id && 
                item.name === selectedItem.name && 
                item.rarity === selectedItem.rarity
            );

            if (itemIndex === -1) {
                console.error('Item not found in inventory');
                return;
            }

            // Remove only one instance of the item
            const updatedItems = [...currentItems];
            updatedItems.splice(itemIndex, 1);

            // Update Firestore with both changes in a batch
            const batch = writeBatch(db);
            
            // Update yard with new item
            const yardRef = doc(db, `users/${user.uid}/yard/items`);
            batch.update(yardRef, {
                items: arrayUnion({
                    ...newPlacedItem,
                    placedAt: Timestamp.fromDate(newPlacedItem.placedAt)
                })
            });

            // Update inventory with removed item
            batch.update(userInventoryRef, {
                items: updatedItems
            });

            await batch.commit();

            // Update local state
            setPlacedItems(prev => [...prev, newPlacedItem]);
            setInventory(updatedItems);
            
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

            // Find the original item in the database
            const originalItemId = item.id.split('-')[0]; // Remove the timestamp part
            const userInventoryRef = doc(db, `users/${user.uid}/inventory/items`);
            const inventoryDoc = await getDoc(userInventoryRef);
            const allItems = inventoryDoc.data()?.items || [];
            let originalItem = allItems.find(i => i.id === originalItemId);

            // If not found in inventory, search in goodies collection
            if (!originalItem) {
                const goodiesRef = collection(db, 'goodies');
                const q = query(goodiesRef, where('name', '==', item.name));
                const goodiesSnapshot = await getDocs(q);
                
                if (!goodiesSnapshot.empty) {
                    const goodieDoc = goodiesSnapshot.docs[0];
                    const goodieData = goodieDoc.data();
                    originalItem = {
                        id: originalItemId,
                        name: goodieData.name,
                        imageUrl: goodieData.imageUrl,
                        description: goodieData.description,
                        category: goodieData.category,
                        rarity: goodieData.rarity,
                        cost: goodieData.cost,
                        purchasedAt: new Date()
                    };
                } else {
                    console.error('Item not found in goodies collection');
                    return;
                }
            }

            // Add original item back to inventory in Firestore
            await updateDoc(userInventoryRef, {
                items: arrayUnion(originalItem)
            });

            // Remove item from yard in Firestore
            const yardRef = doc(db, `users/${user.uid}/yard/items`);
            await updateDoc(yardRef, {
                items: arrayRemove(item)
            });

            // Update local state with the original item
            setInventory(prev => [...prev, originalItem]);
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

    // Initialize audio and fetch initial preferences
    useEffect(() => {
        const initializeAudio = async () => {
            if (!user) return;

            // Randomly select a song on initial load
            if (!audioRef.current) {
                const songs = Object.keys(YARD_MUSIC) as (keyof typeof YARD_MUSIC)[];
                const randomSong = songs[Math.floor(Math.random() * songs.length)];
                setCurrentSong(randomSong);
                
                audioRef.current = new Audio(YARD_MUSIC[randomSong].path);
                audioRef.current.loop = true;
                audioRef.current.volume = YARD_MUSIC[randomSong].defaultVolume;
            }

            try {
                const soundPrefRef = doc(db, 'soundPreference', user.uid);
                const prefDoc = await getDoc(soundPrefRef);
                
                // Start session tracking
                await setDoc(soundPrefRef, {
                    userId: user.uid,
                    sessionStart: Timestamp.now(),
                    sessions: increment(1)
                }, { merge: true });

                // Always try to play music immediately
                try {
                    await audioRef.current.play();
                    recordMusicEvent('music_on');
                } catch (error) {
                    console.log('Audio autoplay prevented:', error);
                    setIsMusicPlaying(false);
                    recordMusicEvent('autoplay_prevented');
                }
            } catch (error) {
                console.error('Error initializing audio:', error);
            }
        };

        initializeAudio();

        return () => {
            if (audioRef.current) {
                const playbackTime = audioRef.current.currentTime;
                audioRef.current.pause();
                audioRef.current = null;
                
                // Record session end
                if (user) {
                    const soundPrefRef = doc(db, 'soundPreference', user.uid);
                    setDoc(soundPrefRef, {
                        lastSessionEnd: Timestamp.now(),
                        totalTimeInYard: increment(Date.now() - sessionStartTime)
                    }, { merge: true }).catch(console.error);
                    
                    // Record music stop if it was playing
                    if (isMusicPlaying) {
                        recordMusicEvent('music_off', playbackTime);
                    }
                }
            }
        };
    }, [user]);

    // Record music-related events with enhanced tracking
    const recordMusicEvent = async (eventType: string, duration?: number) => {
        if (!user) return;

        try {
            const soundPrefRef = doc(db, 'musicAnalytics', user.uid);
            const now = Timestamp.now();
            
            // Create event data with all required fields
            const eventData = {
                timestamp: now,
                eventType,
                songId: YARD_MUSIC[currentSong].id,
                songTitle: YARD_MUSIC[currentSong].title,
                duration: duration || 0,
                context: {
                    timeOfDay: new Date().getHours(),
                    dayOfWeek: new Date().getDay(),
                    hasActiveCats: catHistory.some(entry => 
                        entry.visit.timestamp > new Date(Date.now() - 5 * 60 * 1000)
                    ),
                    activeFood: placedItems.filter(item => 
                        item.locationId.startsWith('food') && 
                        item.remainingVisits && 
                        item.remainingVisits > 0
                    ).length,
                    activeToys: placedItems.filter(item => 
                        item.locationId.startsWith('toy')
                    ).length
                }
            };

            // Create song stats update with all required fields
            const songStatsUpdate = {
                totalPlays: increment(eventType === 'music_on' ? 1 : 0),
                totalStops: increment(eventType === 'music_off' ? 1 : 0),
                totalPlayDuration: increment(duration || 0),
                averagePlayDuration: duration || 0,
                lastPlayed: eventType === 'music_on' ? now : null
            };

            await setDoc(soundPrefRef, {
                userId: user.uid,
                lastUpdated: now,
                events: arrayUnion(eventData),
                songStats: {
                    [YARD_MUSIC[currentSong].id]: songStatsUpdate
                }
            }, { merge: true });
        } catch (error) {
            console.error('Error recording music event:', error);
        }
    };

    // Handle music toggle with enhanced tracking
    const handleMusicToggle = async () => {
        if (!user) return;

        const newState = !isMusicPlaying;
        setIsMusicPlaying(newState);

        if (audioRef.current) {
            if (newState) {
                audioRef.current.play();
                recordMusicEvent('music_on');
            } else {
                const playbackTime = audioRef.current.currentTime;
                audioRef.current.pause();
                recordMusicEvent('music_off', playbackTime);
            }
        }
    };

    // Track initial page load time for session duration calculation
    const sessionStartTime = useMemo(() => Date.now(), []);

    return (
        <div className="fixed inset-0 overflow-hidden [orientation:portrait]">
            {/* Menu Icons */}
            <div className="fixed top-4 left-16 z-30 flex items-center gap-2">
                <button
                    onClick={() => {
                        setIsCatHistoryOpen(!isCatHistoryOpen);
                        if (!isCatHistoryOpen) {
                            handleMarkVisitsRead();
                        }
                    }}
                    className="relative p-2 rounded-md hover:bg-gray-200 bg-white"
                >
                    <FontAwesomeIcon icon={faCat} className="text-[#5d5d5d]" />
                    {unreadCatVisits > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                            {unreadCatVisits}
                        </div>
                    )}
                </button>
                <button
                    onClick={() => setIsHelpOpen(true)}
                    className="relative p-2 rounded-md hover:bg-gray-200 bg-white"
                    title="How to Play"
                >
                    <FontAwesomeIcon 
                        icon={faQuestionCircle} 
                        className="text-[#5d5d5d]" 
                    />
                </button>
                <button
                    onClick={handleMusicToggle}
                    className="relative p-2 rounded-md hover:bg-gray-200 bg-white"
                    title={isMusicPlaying ? "Turn music off" : "Turn music on"}
                >
                    <FontAwesomeIcon 
                        icon={isMusicPlaying ? faMusic : faVolumeXmark}
                        className="text-[#5d5d5d]" 
                    />
                </button>
            </div>

            <YardBackground
                isPlacementMode={isPlacementMode}
                selectedItem={selectedItem}
                onLocationSelect={handleLocationSelect}
                onCancelPlacement={handleCancelPlacement}
                onItemReturn={handleItemReturn}
                placedItems={placedItems}
                userId={user?.uid || ''}
                setPlacedItems={setPlacedItems}
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

            <HelpDialog isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
            <CatHistoryMenu
                isOpen={isCatHistoryOpen}
                setIsOpen={setIsCatHistoryOpen}
                history={catHistory}
            />
        </div>
    );
} 