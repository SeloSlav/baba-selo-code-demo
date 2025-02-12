import React, { useState } from 'react';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { Cat } from '../../yard/types';

const INITIAL_CATS: Omit<Cat, 'id'>[] = [
    {
        name: "Whiskers",
        description: "A curious common cat who loves any kind of food.",
        imageUrl: "/cats/common-cat-1.jpg",
        rarity: "common",
        spoonMultiplier: 25.0  // Base multiplier for common cats
    },
    {
        name: "Mittens",
        description: "A playful common cat with white paws.",
        imageUrl: "/cats/common-cat-2.jpg",
        rarity: "common",
        spoonMultiplier: 25.0  // Base multiplier for common cats
    },
    {
        name: "Shadow",
        description: "A mysterious uncommon black cat.",
        imageUrl: "/cats/uncommon-cat-1.jpg",
        rarity: "uncommon",
        spoonMultiplier: 35.0  // Base multiplier for uncommon cats
    },
    {
        name: "Luna",
        description: "An elegant uncommon cat with a crescent mark.",
        imageUrl: "/cats/uncommon-cat-2.jpg",
        rarity: "uncommon",
        spoonMultiplier: 35.0  // Base multiplier for uncommon cats
    },
    {
        name: "Sushi",
        description: "A rare cat who's particularly fond of fish.",
        imageUrl: "/cats/rare-cat-1.jpg",
        rarity: "rare",
        spoonMultiplier: 50.0  // Base multiplier for rare cats
    },
    {
        name: "Pixel",
        description: "A rare digital-looking cat.",
        imageUrl: "/cats/rare-cat-2.jpg",
        rarity: "rare",
        spoonMultiplier: 50.0  // Base multiplier for rare cats
    },
    {
        name: "Galaxy",
        description: "An epic cat with fur that sparkles like stars.",
        imageUrl: "/cats/epic-cat-1.jpg",
        rarity: "epic",
        spoonMultiplier: 75.0  // Base multiplier for epic cats
    },
    {
        name: "Phoenix",
        description: "An epic cat with fiery red fur.",
        imageUrl: "/cats/epic-cat-2.jpg",
        rarity: "epic",
        spoonMultiplier: 75.0  // Base multiplier for epic cats
    },
    {
        name: "King Midas",
        description: "A legendary golden cat who brings great fortune.",
        imageUrl: "/cats/legendary-cat-1.jpg",
        rarity: "legendary",
        spoonMultiplier: 100.0  // Base multiplier for legendary cats
    },
    {
        name: "Ancient One",
        description: "A legendary cat who's lived for a thousand years.",
        imageUrl: "/cats/legendary-cat-2.jpg",
        rarity: "legendary",
        spoonMultiplier: 100.0  // Base multiplier for legendary cats
    }
];

export default function CatInitializer() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const handleInitialize = async () => {
        try {
            setStatus('loading');
            setError(null);

            const catsRef = collection(db, 'cats');

            // Add each cat to the collection
            for (const cat of INITIAL_CATS) {
                const catDoc = doc(catsRef); // Let Firestore generate the ID
                await setDoc(catDoc, {
                    ...cat,
                    id: catDoc.id
                });
            }

            setStatus('success');
        } catch (err) {
            console.error('Error initializing cats:', err);
            setStatus('error');
            setError(err.message);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Initialize Cats Collection</h2>
            <p className="text-gray-600 mb-4">
                This will create the initial set of cats in the Firebase collection.
                Only run this once when setting up the game for the first time.
            </p>

            <button
                onClick={handleInitialize}
                disabled={status === 'loading'}
                className={`px-4 py-2 rounded-lg ${
                    status === 'loading'
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-800'
                }`}
            >
                {status === 'loading' ? 'Initializing...' : 'Initialize Cats'}
            </button>

            {status === 'success' && (
                <p className="mt-4 text-green-600">
                    Successfully initialized cats collection!
                </p>
            )}

            {status === 'error' && (
                <p className="mt-4 text-red-600">
                    Error: {error}
                </p>
            )}
        </div>
    );
} 