"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '../firebase/firebase';
import { SidebarLayout } from '../components/SidebarLayout';
import { collection, query, orderBy, getDocs, getCountFromServer, doc, updateDoc, arrayUnion, Timestamp, increment, getDoc, startAfter, limit, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { usePoints } from '../context/PointsContext';
import { Recipe } from '../recipe/types';
import { SearchBar } from '../components/SearchBar';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeCardSkeleton } from '../components/RecipeCardSkeleton';

const POINTS_FOR_LIKE = 50; // Points awarded when someone likes your recipe

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
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();
  const { showPointsToast } = usePoints();
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const lastVisibleRef = useRef<any>(null);
  const prevSearchTermRef = useRef(searchTerm);
  lastVisibleRef.current = lastVisible;

  const RECIPES_PER_PAGE = 12;

  const isRecipeComplete = (recipe: Recipe) => {
    return recipe.recipeSummary && 
           recipe.imageURL; // Simplified conditions to just require summary and image
  };

  const fetchRecipes = useCallback(async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setIsPageLoading(true);
      }

      const cursor = loadMore ? lastVisibleRef.current : null;

      // Create a query for recipes, ordered by creation date
      const recipesQuery = cursor
        ? query(
            collection(db, "recipes"),
            orderBy("createdAt", "desc"),
            startAfter(cursor),
            limit(RECIPES_PER_PAGE)
          )
        : query(
            collection(db, "recipes"),
            orderBy("createdAt", "desc"),
            limit(RECIPES_PER_PAGE)
          );

      // Use getCountFromServer - 1000x cheaper than fetching all docs
      const countQuery = query(collection(db, "recipes"));

      const [recipeDocs, countSnapshot] = await Promise.all([
        getDocs(recipesQuery),
        getCountFromServer(countQuery)
      ]);

      setTotalRecipes(countSnapshot.data().count);

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
      const userIds = new Set(fetchedRecipes.map(recipe => recipe.userId).filter(Boolean));
      
      let userMap = new Map();
      if (userIds.size > 0) {
        const usersQuery = query(
          collection(db, "users"),
          where("__name__", "in", Array.from(userIds))
        );
        const userDocs = await getDocs(usersQuery);
        userDocs.docs.forEach(doc => {
          userMap.set(doc.id, doc.data().username);
        });
      }

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
        setIsPageLoading(false);
      }
    }
  }, []);

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
  }, [fetchRecipes]);

  useEffect(() => {
    if (user) fetchCurrentUsername();
  }, [user]);

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
      if (recipe.userId && recipe.userId !== user.uid) {
        try {
          const spoonRef = doc(db, "users", recipe.userId, "spoonPoints", "points");
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
        } catch (pointsError) {
          console.error("Error awarding points:", pointsError);
          // Don't throw the error since the like was still successful
        }
      }
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const searchRecipes = useCallback(async (searchTerms: string[]) => {
    if (!user) return;
    setIsSearching(true);
    
    try {
      const recipesQuery = query(
        collection(db, "recipes"),
        where("recipeSummary", "!=", ""),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(recipesQuery);

      // Filter out recipes without images first
      const allRecipes = querySnapshot.docs
        .map(d => {
          const data = d.data() as RecipeDocument;
          return {
            id: d.id,
            ...data,
            username: 'Anonymous Chef',
            likes: data.likes || []
          };
        })
        .filter(recipe => recipe.imageURL);

      // Fetch only users for these recipes (Firestore "in" limit is 30)
      const userIds = [...new Set(allRecipes.map(r => r.userId).filter(Boolean))];
      const userMap = new Map<string, string>();
      for (let i = 0; i < userIds.length; i += 30) {
        const batch = userIds.slice(i, i + 30);
        const usersQuery = query(
          collection(db, "users"),
          where("__name__", "in", batch)
        );
        const userDocs = await getDocs(usersQuery);
        userDocs.docs.forEach(d => userMap.set(d.id, d.data().username || ""));
      }

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
  }, [user]);

  // Debounced search effect - only refetch when user clears search (avoids infinite loop + double fetch on mount)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchTerm.trim()) {
        const hadSearchTerm = prevSearchTermRef.current.trim() !== "";
        prevSearchTermRef.current = searchTerm;
        if (hadSearchTerm) fetchRecipes();
        return;
      }
      prevSearchTermRef.current = searchTerm;
      const terms = searchTerm.toLowerCase().split(" ");
      searchRecipes(terms);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchRecipes, searchRecipes]);

  // Remove the old searchRecipes function and filteredRecipes constant
  const displayedRecipes = searchTerm ? recipes : recipes;

  // Intersection observer for infinite scroll
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasMore && !loadingMore && !searchTerm && !isPageLoading) {
          fetchRecipes(true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(currentRef);
    return () => observer.unobserve(currentRef);
  }, [hasMore, loadingMore, searchTerm, isPageLoading, fetchRecipes]);

  return (
    <SidebarLayout>
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Sticky header */}
      <div className="sticky top-0 bg-amber-50/95 backdrop-blur-sm z-10 py-4 -mx-4 px-4 shadow-sm border-b border-amber-100">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Explore Recipes</h1>
          <SearchBar 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm}
            isLoading={isSearching}
            isPageLoading={isPageLoading}
            resultCount={displayedRecipes.length}
            totalCount={totalRecipes}
            isExplorePage={true}
          />
        </div>
      </div>

      {/* Content */}
      <div className="mt-8">
        {isPageLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <RecipeCardSkeleton key={n} />
            ))}
          </div>
        ) : displayedRecipes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedRecipes.map((recipe, index) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe}
                  onLike={handleLike}
                  currentUser={user}
                  showUsername={true}
                  priority={index < 6}
                />
              ))}
              {loadingMore && [1, 2, 3].map((n) => (
                <RecipeCardSkeleton key={`skeleton-${n}`} />
              ))}
            </div>

            {/* Infinite scroll trigger */}
            {!searchTerm && hasMore && (
              <div 
                ref={loadMoreRef} 
                className="h-20 flex items-center justify-center mt-8"
                style={{ minHeight: '100px' }}
              >
                <div className="w-full h-full" />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🤔</div>
            <h3 className="text-xl font-semibold mb-2">No recipes found</h3>
            <p className="text-amber-800/70">
              Try adjusting your search or check back later for new recipes
            </p>
          </div>
        )}
      </div>
    </div>
    </SidebarLayout>
  );
} 