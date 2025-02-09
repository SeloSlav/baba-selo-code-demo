"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, limit, startAfter, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Recipe } from '../recipe/types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RecipeCard } from '../components/RecipeCard';
import { SearchBar } from '../components/SearchBar';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { faPen, faUser, faCamera } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

interface UserProfileClientProps {
    userId: string;
    username: string;
}

interface FirestoreRecipeData {
    recipeTitle?: string;
    recipeContent?: string;
    cuisineType?: string;
    cookingDifficulty?: string;
    cookingTime?: string;
    diet?: string[];
    directions?: string[];
    ingredients?: string[];
    imageURL?: string;
    recipeSummary?: string;
    recipeNotes?: string;
    macroInfo?: {
        servings: number;
        total: {
            calories: number;
            proteins: number;
            carbs: number;
            fats: number;
        };
        per_serving: {
            calories: number;
            proteins: number;
            carbs: number;
            fats: number;
        };
    };
    dishPairings?: string;
    pinned?: boolean;
    lastPinnedAt?: any;
    userId?: string;
    likes?: string[];
    createdAt?: any;
}

export default function UserProfileClient({ userId, username }: UserProfileClientProps) {
    const { user } = useAuth();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [totalRecipes, setTotalRecipes] = useState(0);
    const [likeLoading, setLikeLoading] = useState<string | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [userBio, setUserBio] = useState<string>("");
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [editedBio, setEditedBio] = useState("");
    const [savingBio, setSavingBio] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const RECIPES_PER_PAGE = 12;

    const searchRecipes = async (searchTerms: string[]) => {
        setIsSearching(true);
        
        try {
            const recipesRef = collection(db, "recipes");
            let searchQuery = query(
                recipesRef,
                where("userId", "==", userId),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(searchQuery);
            const allRecipes = querySnapshot.docs.map(doc => {
                const data = doc.data() as FirestoreRecipeData;
                return {
                    id: doc.id,
                    ...data,
                    likes: Array.isArray(data.likes) ? data.likes : [],
                    pinned: Boolean(data.pinned),
                    createdAt: data.createdAt?.toDate() || new Date(),
                    username: username // Add username since it's required by Recipe type
                } as Recipe;
            });

            // Client-side filtering for complex search
            const filtered = allRecipes.filter((recipe) => {
                const searchableFields = [
                    recipe.recipeTitle?.toLowerCase() || "",
                    recipe.cuisineType?.toLowerCase() || "",
                    recipe.cookingDifficulty?.toLowerCase() || "",
                    recipe.cookingTime?.toLowerCase() || "",
                    recipe.recipeSummary?.toLowerCase() || "",
                    ...(Array.isArray(recipe.diet) ? recipe.diet.map(d => d.toLowerCase()) : []),
                    ...(Array.isArray(recipe.ingredients) ? recipe.ingredients.map(i => i.toLowerCase()) : [])
                ].filter(Boolean);

                return searchTerms.every((term) =>
                    searchableFields.some((field) => field.includes(term))
                );
            });

            setRecipes(filtered);
            setHasMore(false);
            setTotalRecipes(filtered.length);
        } catch (error) {
            console.error("Error searching recipes:", error);
            setError("Failed to search recipes");
        } finally {
            setIsSearching(false);
        }
    };

    const fetchRecipes = async (loadMore = false) => {
        if (loadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {
            // Get user bio
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
                setUserBio(userDoc.data().bio || "");
                setProfilePhoto(userDoc.data().profilePhoto || null);
            }

            // Get total count first
            const totalQuery = query(
                collection(db, "recipes"),
                where("userId", "==", userId)
            );
            const totalSnapshot = await getDocs(totalQuery);
            setTotalRecipes(totalSnapshot.size);

            // Then get paginated results
            const recipesRef = collection(db, "recipes");
            let recipesQuery;
            
            if (loadMore && lastVisible) {
                recipesQuery = query(
                    recipesRef,
                    where("userId", "==", userId),
                    orderBy("createdAt", "desc"),
                    startAfter(lastVisible),
                    limit(RECIPES_PER_PAGE)
                );
            } else {
                recipesQuery = query(
                    recipesRef,
                    where("userId", "==", userId),
                    orderBy("createdAt", "desc"),
                    limit(RECIPES_PER_PAGE)
                );
            }

            const querySnapshot = await getDocs(recipesQuery);
            const fetchedRecipes = querySnapshot.docs.map(doc => {
                const data = doc.data() as FirestoreRecipeData;
                return {
                    id: doc.id,
                    ...data,
                    likes: Array.isArray(data.likes) ? data.likes : [],
                    pinned: Boolean(data.pinned),
                    createdAt: data.createdAt?.toDate() || new Date(),
                    username: username // Add username since it's required by Recipe type
                } as Recipe;
            });

            // Update lastVisible for pagination
            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastVisible(lastDoc);

            // Update recipes state
            if (loadMore) {
                // Ensure we don't add duplicates when loading more
                setRecipes(prev => {
                    const existingIds = new Set(prev.map(r => r.id));
                    const newRecipes = fetchedRecipes.filter(r => !existingIds.has(r.id));
                    return [...prev, ...newRecipes];
                });
            } else {
                setRecipes(fetchedRecipes);
            }

            // Check if there are more recipes to load
            setHasMore(querySnapshot.docs.length === RECIPES_PER_PAGE);
        } catch (error) {
            console.error('Error fetching recipes:', error);
            setError('Failed to load recipes');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Infinite scroll observer
    const lastRecipeRef = useCallback((node: HTMLDivElement | null) => {
        if (loadingMore) return;
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !isSearching) {
                fetchRecipes(true);
            }
        });

        if (node) observerRef.current.observe(node);
    }, [loadingMore, hasMore, isSearching]);

    // Search effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (!searchTerm.trim()) {
                // Instead of fetching again, just show all recipes
                if (recipes.length === 0) {
                    fetchRecipes();
                }
                return;
            }

            const searchTerms = searchTerm.toLowerCase().split(" ");
            searchRecipes(searchTerms);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Initial fetch - make sure we have recipes loaded
    useEffect(() => {
        if (recipes.length === 0) {
            fetchRecipes();
        }
    }, [userId]);

    const handleLike = async (recipeId: string, currentLikes: string[]) => {
        if (!user) return;
        
        setLikeLoading(recipeId);
        try {
            const recipeRef = doc(db, 'recipes', recipeId);
            const isLiked = currentLikes.includes(user.uid);
            
            // Update Firestore
            await updateDoc(recipeRef, {
                likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
            });

            // Update local state
            setRecipes(prev => prev.map(recipe => {
                if (recipe.id === recipeId) {
                    const newLikes = isLiked
                        ? recipe.likes.filter(id => id !== user.uid)
                        : [...recipe.likes, user.uid];
                    return { ...recipe, likes: newLikes };
                }
                return recipe;
            }));
        } catch (error) {
            console.error('Error updating like:', error);
        } finally {
            setLikeLoading(null);
        }
    };

    const handleBioSubmit = async () => {
        if (!user || user.uid !== userId) return;
        
        setSavingBio(true);
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                bio: editedBio.trim()
            });
            setUserBio(editedBio.trim());
            setIsEditingBio(false);
        } catch (error) {
            console.error('Error updating bio:', error);
            setError('Failed to update bio');
        } finally {
            setSavingBio(false);
        }
    };

    const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || user.uid !== userId || !e.target.files?.[0]) return;
        
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        setUploadingPhoto(true);
        try {
            // Create a FormData object to send the file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', userId);

            // Send to your API endpoint
            const response = await fetch('/api/uploadProfilePhoto', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload photo');
            }

            const data = await response.json();
            
            // Update Firestore with the new photo URL
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                profilePhoto: data.photoUrl
            });

            setProfilePhoto(data.photoUrl);
        } catch (error) {
            console.error('Error uploading photo:', error);
            setError('Failed to upload photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Sticky header */}
            <div className="sticky top-0 bg-white z-10 py-4 -mx-4 px-4 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="relative group">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                {profilePhoto ? (
                                    <Image
                                        src={profilePhoto}
                                        alt={`${username}'s profile`}
                                        width={64}
                                        height={64}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <FontAwesomeIcon 
                                        icon={faUser} 
                                        className="text-gray-400 text-2xl"
                                    />
                                )}
                            </div>
                            {user?.uid === userId && (
                                <>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 bg-black rounded-full p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-800"
                                        aria-label="Upload profile photo"
                                    >
                                        {uploadingPhoto ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <FontAwesomeIcon icon={faCamera} className="text-xs" />
                                        )}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfilePhotoUpload}
                                        className="hidden"
                                    />
                                </>
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold mb-2">{username}'s Recipes</h1>
                            {userBio || user?.uid === userId ? (
                                <div className="relative group">
                                    {isEditingBio ? (
                                        <div className="flex items-center gap-2 mb-4">
                                            <textarea
                                                value={editedBio}
                                                onChange={(e) => setEditedBio(e.target.value)}
                                                placeholder="Add a bio..."
                                                className="w-full p-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                                rows={2}
                                            />
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={handleBioSubmit}
                                                    disabled={savingBio}
                                                    className="px-3 py-1 text-xs bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300"
                                                >
                                                    {savingBio ? (
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsEditingBio(false);
                                                        setEditedBio(userBio);
                                                    }}
                                                    className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <p className="text-gray-600 mb-4 text-sm pr-8">
                                                {userBio || (user?.uid === userId ? "Add a bio..." : "")}
                                            </p>
                                            {user?.uid === userId && (
                                                <button
                                                    onClick={() => {
                                                        setIsEditingBio(true);
                                                        setEditedBio(userBio);
                                                    }}
                                                    className="absolute top-0 right-0 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600 transition-all duration-200"
                                                    aria-label="Edit bio"
                                                >
                                                    <FontAwesomeIcon icon={faPen} className="text-sm" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>
                    <SearchBar
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        isLoading={isSearching}
                        resultCount={recipes.length}
                        totalCount={totalRecipes}
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="animate-pulse">
                            <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : recipes.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                        {recipes.map((recipe, index) => (
                            <div
                                key={recipe.id}
                                ref={index === recipes.length - 1 ? lastRecipeRef : null}
                                className="relative group"
                            >
                                <RecipeCard 
                                    recipe={recipe}
                                    onLike={() => handleLike(recipe.id, recipe.likes)}
                                    currentUser={user}
                                    showUsername={false}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Infinite scroll trigger */}
                    {!searchTerm && hasMore && (
                        <div 
                            ref={lastRecipeRef} 
                            className="h-20 flex items-center justify-center mt-8"
                            style={{ minHeight: '100px' }}
                        >
                            {loadingMore ? (
                                <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <div className="w-full h-full" />
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12">
                    <div className="text-4xl mb-4">🤔</div>
                    <h3 className="text-xl font-semibold mb-2">No recipes found</h3>
                    <p className="text-gray-600">
                        Try adjusting your search or check back later for new recipes
                    </p>
                </div>
            )}
        </div>
    );
} 