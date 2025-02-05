"use client";

import { useEffect, useState, useRef } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  doc,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import Link from "next/link"; // Import Link for navigation
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faXmark, faEllipsisVertical, faThumbtack, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { getAuth } from "firebase/auth";
import { useDeleteRecipe } from "../context/DeleteRecipeContext";
import { SearchBar } from '../components/SearchBar';
import { RecipeCard } from '../components/RecipeCard';
import { Recipe } from '../recipe/types';

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

const Recipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [loadingPinAction, setLoadingPinAction] = useState<string | null>(null);
  const auth = getAuth();
  const { showDeletePopup } = useDeleteRecipe();
  const user = auth.currentUser;
  const menuRef = useRef<HTMLDivElement>(null);

  const RECIPES_PER_PAGE = 12;

  // Split recipes into pinned and unpinned
  const pinnedRecipes = filteredRecipes.filter(recipe => recipe.pinned);
  const unpinnedRecipes = filteredRecipes.filter(recipe => !recipe.pinned);

  const handlePinToggle = async (recipeId: string, currentPinned: boolean) => {
    try {
      setLoadingPinAction(recipeId);
      const recipeRef = doc(db, "recipes", recipeId);
      await updateDoc(recipeRef, {
        pinned: !currentPinned
      });
      
      // Update local state
      const updatedRecipes = recipes.map(recipe =>
        recipe.id === recipeId ? { ...recipe, pinned: !currentPinned } : recipe
      );
      setRecipes(updatedRecipes);
      setFilteredRecipes(updatedRecipes);
      setMenuOpen(null);
    } catch (error) {
      console.error("Error toggling pin:", error);
    } finally {
      setLoadingPinAction(null);
    }
  };

  const handleDelete = async (recipeId: string, recipeTitle: string) => {
    showDeletePopup(recipeId, recipeTitle, async () => {
      try {
        await deleteDoc(doc(db, "recipes", recipeId));
        const updatedRecipes = recipes.filter(recipe => recipe.id !== recipeId);
        setRecipes(updatedRecipes);
        setFilteredRecipes(updatedRecipes);
        setMenuOpen(null);
      } catch (error) {
        console.error("Error deleting recipe:", error);
      }
    });
  };

  // Update search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRecipes(recipes);
      return;
    }

    const searchTerms = searchTerm.toLowerCase().split(" ");
    const filtered = recipes.filter((recipe) => {
      const searchableFields = [
        recipe.recipeTitle?.toLowerCase() || "",
        recipe.cuisineType?.toLowerCase() || "",
        recipe.cookingDifficulty?.toLowerCase() || "",
        recipe.cookingTime?.toLowerCase() || "",
        recipe.recipeSummary?.toLowerCase() || "",
        ...(recipe.diet?.map(d => d.toLowerCase()) || []),
        ...(recipe.ingredients?.map(i => i.toLowerCase()) || []),
      ];

      return searchTerms.every((term) =>
        searchableFields.some((field) => field.includes(term))
      );
    });

    setFilteredRecipes(filtered);
  }, [searchTerm, recipes]);

  const fetchRecipes = async (loadMore = false) => {
    if (!user) return; // Don't fetch if no user is logged in
    
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const recipesRef = collection(db, "recipes");
      let recipesQuery;
      
      if (loadMore && lastVisible) {
        recipesQuery = query(
          recipesRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(RECIPES_PER_PAGE)
        );
      } else {
        recipesQuery = query(
          recipesRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(RECIPES_PER_PAGE)
        );
      }

      const querySnapshot = await getDocs(recipesQuery);
      const fetchedRecipes = querySnapshot.docs.map((doc) => {
        const data = doc.data() as RecipeDocument;
        return {
          id: doc.id,
          ...data,
          pinned: data.pinned || false,
          userId: data.userId || "",
        };
      }) as Recipe[];

      // Update lastVisible for pagination
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastDoc);
      setHasMore(querySnapshot.docs.length === RECIPES_PER_PAGE);

      if (loadMore) {
        const newRecipes = [...recipes, ...fetchedRecipes];
        setRecipes(newRecipes);
        setFilteredRecipes(newRecipes);
      } else {
        setRecipes(fetchedRecipes);
        setFilteredRecipes(fetchedRecipes);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }

    if (loadMore) {
      setLoadingMore(false);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes(); // Initial fetch
  }, []);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1) Show the loading indicator if we are loading AND have no recipes yet.
  if (loading && recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <img src="/baba-removebg.png" alt="Baba" className="w-32 h-32 mb-6" />
        <div className="typing-indicator flex space-x-2">
          <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
          <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
          <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
        </div>
      </div>
    );
  }

  // 2) Once recipes are loaded (or we're loading more recipes), show the list.
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Sticky header */}
      <div className="sticky top-0 bg-white z-10 py-4 -mx-4 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">My Recipes</h1>
          <SearchBar 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
          />
        </div>
      </div>

      {/* Content with top padding to account for sticky header */}
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
        ) : filteredRecipes.length > 0 ? (
          <>
            <div>
              {/* Pinned Recipes */}
              <div className="mb-8">
                <h2 className="text-gray-600 text-sm font-semibold pb-2 border-b">
                  📌 Pinned Recipes
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                  {pinnedRecipes.map((recipe) => (
                    <div key={recipe.id} className="relative">
                      <RecipeCard 
                        key={recipe.id} 
                        recipe={recipe}
                        showMenu={true}
                        onMenuClick={(id) => setMenuOpen(id)}
                      />
                      {menuOpen === recipe.id && (
                        <div ref={menuRef} className="absolute right-2 top-2 bg-white rounded-lg shadow-lg py-2 z-50">
                          <button
                            onClick={() => handlePinToggle(recipe.id, recipe.pinned || false)}
                            disabled={loadingPinAction === recipe.id}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                          >
                            <FontAwesomeIcon 
                              icon={faThumbtack} 
                              className={`transform transition-all duration-300 ${
                                recipe.pinned ? 'rotate-[45deg] scale-110' : 'hover:scale-110'
                              }`}
                            />
                            {loadingPinAction === recipe.id ? (
                              <span className="flex items-center">
                                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                                {recipe.pinned ? 'Unpinning...' : 'Pinning...'}
                              </span>
                            ) : (
                              <span>{recipe.pinned ? 'Unpin Recipe' : 'Pin Recipe'}</span>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(recipe.id, recipe.recipeTitle)}
                            className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                            <span>Delete Recipe</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* All Recipes */}
              <div>
                <h2 className="text-gray-600 text-sm font-semibold pb-2 border-b">
                  🍳 All Recipes
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                  {unpinnedRecipes.map((recipe) => (
                    <div key={recipe.id} className="relative">
                      <RecipeCard 
                        key={recipe.id} 
                        recipe={recipe}
                        showMenu={true}
                        onMenuClick={(id) => setMenuOpen(id)}
                      />
                      {menuOpen === recipe.id && (
                        <div ref={menuRef} className="absolute right-2 top-2 bg-white rounded-lg shadow-lg py-2 z-50">
                          <button
                            onClick={() => handlePinToggle(recipe.id, recipe.pinned || false)}
                            disabled={loadingPinAction === recipe.id}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                          >
                            <FontAwesomeIcon 
                              icon={faThumbtack} 
                              className={`transform transition-all duration-300 ${
                                recipe.pinned ? 'rotate-[45deg] scale-110' : 'hover:scale-110'
                              }`}
                            />
                            {loadingPinAction === recipe.id ? (
                              <span className="flex items-center">
                                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                                {recipe.pinned ? 'Unpinning...' : 'Pinning...'}
                              </span>
                            ) : (
                              <span>{recipe.pinned ? 'Unpin Recipe' : 'Pin Recipe'}</span>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(recipe.id, recipe.recipeTitle)}
                            className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                            <span>Delete Recipe</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Load More Button */}
            {!searchTerm && hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => fetchRecipes(true)}
                  disabled={loadingMore}
                  className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Loading...
                    </div>
                  ) : (
                    'Load More Recipes'
                  )}
                </button>
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
};

export default Recipes;
