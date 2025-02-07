"use client";

import { useEffect, useState, useRef } from 'react';
import { db } from '../firebase/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, arrayUnion, arrayRemove, Timestamp, increment, getDoc, startAfter, limit, where } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faHeart } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { usePoints } from '../context/PointsContext';
import { Recipe } from '../recipe/types';
import Link from 'next/link';
import Image from 'next/image';
import { SearchBar } from '../components/SearchBar';
import { RecipeCard } from '../components/RecipeCard';
import { SpoonPointSystem } from '../lib/spoonPoints';

const POINTS_FOR_LIKE = 50; // Points awarded when someone likes your recipe

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f6f7f8" offset="0%" />
      <stop stop-color="#edeef1" offset="50%" />
      <stop stop-color="#f6f7f8" offset="100%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f6f7f8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite" />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

// Add type for Firestore document data
interface RecipeDocument {
  recipeTitle: string;
  recipeContent: string;
  cuisineType: string;
  cookingDifficulty: string;
  cookingTime: string;
  diet: string[];
  directions: string[];
  ingredients: string[];
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
  lastPinnedAt?: string;
  userId: string;
  likes?: string[];
  createdAt: any;
}

export default function ExplorePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();
  const { showPointsToast } = usePoints();
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const RECIPES_PER_PAGE = 12;

  const isRecipeComplete = (recipe: Recipe) => {
    return recipe.recipeSummary && 
           recipe.imageURL; // Simplified conditions to just require summary and image
  };

  const fetchRecipes = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      // Create a query for all recipes, ordered by completeness and creation date
      let recipesQuery = query(
        collection(db, "recipes"),
        orderBy("createdAt", "desc"),
        limit(RECIPES_PER_PAGE)
      );

      if (loadMore && lastVisible) {
        recipesQuery = query(
          collection(db, "recipes"),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(RECIPES_PER_PAGE)
        );
      }

      // Get total count of all recipes
      const totalCountQuery = query(collection(db, "recipes"));
      
      // Run both queries in parallel
      const [recipeDocs, totalSnapshot] = await Promise.all([
        getDocs(recipesQuery),
        getDocs(totalCountQuery)
      ]);
      
      setTotalRecipes(totalSnapshot.size);

      // Process all recipes
      const fetchedRecipes = recipeDocs.docs.map(doc => {
        const data = doc.data() as RecipeDocument;
        return {
          id: doc.id,
          ...data,
          username: 'Anonymous Chef', // We'll update this later
          likes: data.likes || []
        };
      });

      // Get usernames for all recipes
      const userIds = new Set(fetchedRecipes.map(recipe => recipe.userId));
      const usersQuery = query(
        collection(db, "users"),
        where("__name__", "in", Array.from(userIds))
      );
      const userDocs = await getDocs(usersQuery);
      const userMap = new Map();
      userDocs.docs.forEach(doc => {
        userMap.set(doc.id, doc.data().username);
      });

      // Update usernames and sort recipes by completeness and creation date
      const recipesWithUsernames = fetchedRecipes
        .map(recipe => ({
          ...recipe,
          username: userMap.get(recipe.userId) || 'Anonymous Chef'
        }))
        .sort((a, b) => {
          // First sort by completeness
          const aComplete = isRecipeComplete(a);
          const bComplete = isRecipeComplete(b);
          if (aComplete !== bComplete) {
            return aComplete ? -1 : 1;
          }
          // Then sort by creation date (newest first)
          return b.createdAt?.toDate?.() - a.createdAt?.toDate?.() || 0;
        });

      // Update lastVisible for pagination
      const lastDoc = recipeDocs.docs[recipeDocs.docs.length - 1];
      setLastVisible(lastDoc);
      setHasMore(recipeDocs.docs.length === RECIPES_PER_PAGE);

      if (loadMore) {
        setRecipes(prev => [...prev, ...recipesWithUsernames]);
      } else {
        setRecipes(recipesWithUsernames);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      if (loadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const fetchCurrentUsername = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setCurrentUsername(userDoc.data().username || 'Anonymous Chef');
      }
    } catch (error) {
      console.error("Error fetching username:", error);
    }
  };

  useEffect(() => {
    fetchRecipes();
    fetchCurrentUsername();
  }, []);

  const handleLike = async (recipe: Recipe) => {
    if (!user) return;

    try {
      const recipeRef = doc(db, "recipes", recipe.id);
      const currentLikes = recipe.likes || [];
      const hasLiked = currentLikes.includes(user.uid);
      
      // If already liked, do nothing
      if (hasLiked) {
        return;
      }

      // Like (one-way action)
      await updateDoc(recipeRef, {
        likes: arrayUnion(user.uid)
      });
      setRecipes(prev => prev.map(r => 
        r.id === recipe.id 
          ? { ...r, likes: [...(r.likes || []), user.uid] }
          : r
      ));

      // Award points to recipe owner if it's not their own recipe
      if (recipe.userId !== user.uid) {
        const spoonRef = doc(db, "spoonPoints", recipe.userId);
        const transaction = {
          actionType: "RECIPE_SAVED_BY_OTHER",
          points: POINTS_FOR_LIKE,
          timestamp: Timestamp.now(),
          targetId: recipe.id,
          details: `Recipe "${recipe.recipeTitle}" liked by @${currentUsername}`
        };

        await updateDoc(spoonRef, {
          totalPoints: increment(POINTS_FOR_LIKE),
          transactions: arrayUnion(transaction)
        });
      }
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  // Update search function to use the same optimized querying
  const searchRecipes = async (searchTerms: string[]) => {
    if (!user) return;
    setIsSearching(true);
    
    try {
      const recipesQuery = query(
        collection(db, "recipes"),
        where("recipeSummary", "!=", ""),
        orderBy("createdAt", "desc")
      );

      const [querySnapshot, userDocs] = await Promise.all([
        getDocs(recipesQuery),
        getDocs(query(collection(db, "users")))
      ]);

      // Filter out recipes without images first
      const allRecipes = querySnapshot.docs
        .map(doc => {
          const data = doc.data() as RecipeDocument;
          return {
            id: doc.id,
            ...data,
            username: 'Anonymous Chef',
            likes: data.likes || []
          };
        })
        .filter(recipe => recipe.imageURL);

      // Get usernames
      const userMap = new Map();
      userDocs.docs.forEach(doc => {
        userMap.set(doc.id, doc.data().username);
      });

      // Update usernames and perform search filtering
      const filtered = allRecipes
        .map(recipe => ({
          ...recipe,
          username: userMap.get(recipe.userId) || 'Anonymous Chef'
        }))
        .filter((recipe) => {
          const diets = Array.isArray(recipe.diet) ? recipe.diet : [];
          const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
          
          const searchableFields = [
            recipe.recipeTitle?.toLowerCase() || "",
            recipe.username?.toLowerCase() || "",
            recipe.cuisineType?.toLowerCase() || "",
            recipe.cookingDifficulty?.toLowerCase() || "",
            recipe.cookingTime?.toLowerCase() || "",
            recipe.recipeSummary?.toLowerCase() || "",
            ...diets.map(d => d.toLowerCase()),
            ...ingredients.map(i => i.toLowerCase()),
          ].filter(Boolean);

          return searchTerms.every((term) =>
            searchableFields.some((field) => field.includes(term))
          );
        });

      setRecipes(filtered);
      setHasMore(false);
    } catch (error) {
      console.error("Error searching recipes:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Add debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (!searchTerm.trim()) {
        fetchRecipes(); // Reset to paginated view
        return;
      }

      const searchTerms = searchTerm.toLowerCase().split(" ");
      searchRecipes(searchTerms);
    }, 300); // 300ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Remove the old searchRecipes function and filteredRecipes constant
  const displayedRecipes = searchTerm ? recipes : recipes;

  // Add intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loadingMore && !searchTerm) {
          fetchRecipes(true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loadingMore, searchTerm, fetchRecipes]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Sticky header */}
      <div className="sticky top-0 bg-white z-10 py-4 -mx-4 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Explore Recipes</h1>
          <SearchBar 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm}
            isLoading={isSearching}
            resultCount={displayedRecipes.length}
            totalCount={totalRecipes}
            isExplorePage={true}
          />
        </div>
      </div>

      {/* Content */}
      <div className="mt-8">
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
        ) : displayedRecipes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedRecipes.map((recipe) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe}
                  onLike={handleLike}
                  currentUser={user}
                  showUsername={true}
                />
              ))}
            </div>

            {/* Infinite scroll trigger */}
            {!searchTerm && hasMore && (
              <div 
                ref={loadMoreRef} 
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
    </div>
  );
} 