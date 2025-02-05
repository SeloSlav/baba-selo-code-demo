"use client";

import { useEffect, useState } from "react";
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

interface Recipe {
  id: string;
  recipeTitle: string;
  cookingDifficulty: string;
  cuisineType: string;
  cookingTime: string;
  diet: string[];
  imageURL?: string;
  recipeSummary?: string;
  pinned?: boolean;
  userId?: string;
}

const Recipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null); // Tracks the last document for pagination
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [loadingPinAction, setLoadingPinAction] = useState<string | null>(null);
  const auth = getAuth();
  const { showDeletePopup } = useDeleteRecipe();
  const user = auth.currentUser;

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
      const recipesQuery = loadMore
        ? query(
            recipesRef,
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            startAfter(lastVisible),
            limit(20)
          )
        : query(
            recipesRef,
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(20)
          );

      const querySnapshot = await getDocs(recipesQuery);
      const fetchedRecipes: Recipe[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Recipe),
        pinned: doc.data().pinned || false,
        userId: doc.data().userId || "",
      }));

      const newRecipes = loadMore 
        ? [...recipes, ...fetchedRecipes]
        : fetchedRecipes;
      
      setRecipes(newRecipes);
      setFilteredRecipes(newRecipes);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]); // Update the last document
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">My Recipes</h1>
        <SearchBar 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
        />
      </div>

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
        <div>
          {/* Pinned Recipes */}
          <div className="mb-8">
            <h2 className="text-gray-600 text-sm font-semibold pb-2 border-b">
              📌 Pinned Recipes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {pinnedRecipes.map((recipe) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe}
                  showMenu={true}
                  onMenuClick={(id) => setMenuOpen(id)}
                />
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
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe}
                  showMenu={true}
                  onMenuClick={(id) => setMenuOpen(id)}
                />
              ))}
            </div>
          </div>
        </div>
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
};

export default Recipes;
