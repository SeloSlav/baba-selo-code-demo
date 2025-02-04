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

  const searchRecipes = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredRecipes(recipes);
      return;
    }

    const searchTerms = term.toLowerCase().split(" ").filter(t => t);
    
    const filtered = recipes.filter(recipe => {
      const searchableFields = [
        recipe.recipeTitle,
        recipe.cookingDifficulty,
        recipe.cuisineType,
        recipe.cookingTime,
        recipe.recipeSummary,
        ...(recipe.diet || [])
      ].map(field => (field || "").toLowerCase());

      // Check if all search terms match at least one field
      return searchTerms.every(term =>
        searchableFields.some(field => field.includes(term))
      );
    });

    setFilteredRecipes(filtered);
  };

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
    <div className="min-h-screen bg-gray-100">
      {/* Fixed Header Section */}
      <div className="sticky top-0 bg-gray-100 pt-8 pb-4 px-4 z-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">My recipes</h1>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => searchRecipes(e.target.value)}
                placeholder="Search recipes by title, cuisine, difficulty, diet, description..."
                className="w-full px-4 py-3 pl-12 pr-10 rounded-full border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => searchRecipes("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="absolute left-4 right-4 mt-2 text-sm text-gray-500">
                Found {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div className="px-4 overflow-y-auto">
        <div className="max-w-6xl mx-auto pt-4">
          {filteredRecipes.length === 0 && searchTerm ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 mb-4">No recipes found matching "{searchTerm}"</p>
              <p className="text-gray-500">Try adjusting your search terms or clear the search</p>
            </div>
          ) : (
            <>
              {/* Pinned Recipes Section */}
              {pinnedRecipes.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">📌 Pinned Recipes</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pinnedRecipes.map((recipe) => (
                      <div key={recipe.id} className="relative group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        {/* Desktop-only full card link */}
                        <div className="hidden md:block">
                          <Link href={`/recipe/${recipe.id}`} className="absolute inset-0 z-10" />
                        </div>

                        {/* Image Section - Clickable on both mobile and desktop */}
                        <Link href={`/recipe/${recipe.id}`} className="block relative w-full h-48">
                          {recipe.imageURL ? (
                            <Image
                              src={recipe.imageURL}
                              alt={recipe.recipeTitle}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              priority={!loadingMore}
                              quality={75}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-4xl">🍳</span>
                            </div>
                          )}
                        </Link>
                        
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            {/* Title - Clickable on both mobile and desktop */}
                            <Link 
                              href={`/recipe/${recipe.id}`} 
                              className="block flex-1"
                            >
                              <h2 className="text-xl font-semibold line-clamp-1">
                                {recipe.recipeTitle || "Untitled Recipe"}
                              </h2>
                            </Link>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setMenuOpen(menuOpen === recipe.id ? null : recipe.id);
                              }}
                              className="relative p-1.5 rounded-full hover:bg-gray-100 transition-colors z-50 pointer-events-auto"
                            >
                              <FontAwesomeIcon 
                                icon={faEllipsisVertical} 
                                className="w-4 h-4 text-gray-400" 
                              />
                            </button>
                          </div>

                          {menuOpen === recipe.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setMenuOpen(null)}
                              />
                              <div 
                                className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg z-50 pointer-events-auto"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handlePinToggle(recipe.id, !!recipe.pinned);
                                    }}
                                    disabled={loadingPinAction === recipe.id}
                                    className="w-full px-4 py-2 text-sm flex items-center hover:bg-gray-100 transition-colors disabled:opacity-50"
                                  >
                                    {loadingPinAction === recipe.id ? (
                                      <>
                                        <div className="w-4 h-4 mr-3">
                                          <div className="w-full h-full border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        <span>{recipe.pinned ? 'Unpinning...' : 'Pinning...'}</span>
                                      </>
                                    ) : (
                                      <>
                                        <FontAwesomeIcon 
                                          icon={faThumbtack} 
                                          className={`w-4 h-4 mr-3 ${recipe.pinned ? 'text-yellow-500' : 'text-[#5d5d5d]'}`}
                                        />
                                        <span>{recipe.pinned ? 'Unpin recipe' : 'Pin recipe'}</span>
                                      </>
                                    )}
                                  </button>

                                  <div className="border-t border-gray-100" />
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDelete(recipe.id, recipe.recipeTitle);
                                    }}
                                    className="w-full px-4 py-2 text-sm flex items-center text-red-600 hover:bg-gray-100 transition-colors"
                                  >
                                    <FontAwesomeIcon icon={faTrashCan} className="w-4 h-4 mr-3" />
                                    <span>Delete recipe</span>
                                  </button>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Non-clickable content on mobile */}
                          <div className="md:pointer-events-auto pointer-events-none">
                            {recipe.recipeSummary && (
                              <>
                                <meta name="recipe-summary" content={recipe.recipeSummary} />
                                <p className="text-gray-600 mb-3 line-clamp-2">
                                  {recipe.recipeSummary}
                                </p>
                              </>
                            )}
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center text-gray-600">
                                <span className="mr-2">🍲</span>
                                <span className="line-clamp-1">
                                  {recipe.diet && recipe.diet.length > 0
                                    ? recipe.diet.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")
                                    : "Not specified"}
                                </span>
                              </div>
                              
                              <div className="flex items-center text-gray-600">
                                <span className="mr-2">🍽️</span>
                                <span>{recipe.cuisineType ? recipe.cuisineType.charAt(0).toUpperCase() + recipe.cuisineType.slice(1) : "Unknown"}</span>
                              </div>
                              
                              <div className="flex items-center text-gray-600">
                                <span className="mr-2">⏲️</span>
                                <span>{recipe.cookingTime || "Not specified"}</span>
                              </div>
                              
                              <div className="flex items-center text-gray-600">
                                <span className="mr-2">🧩</span>
                                <span>{recipe.cookingDifficulty ? recipe.cookingDifficulty.charAt(0).toUpperCase() + recipe.cookingDifficulty.slice(1) : "Unknown"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Recipes Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">🍳 All Recipes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {unpinnedRecipes.map((recipe) => (
                    <div key={recipe.id} className="relative group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      {/* Desktop-only full card link */}
                      <div className="hidden md:block">
                        <Link href={`/recipe/${recipe.id}`} className="absolute inset-0 z-10" />
                      </div>

                      {/* Image Section - Clickable on both mobile and desktop */}
                      <Link href={`/recipe/${recipe.id}`} className="block relative w-full h-48">
                        {recipe.imageURL ? (
                          <Image
                            src={recipe.imageURL}
                            alt={recipe.recipeTitle}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority={!loadingMore}
                            quality={75}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-4xl">🍳</span>
                          </div>
                        )}
                      </Link>
                      
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          {/* Title - Clickable on both mobile and desktop */}
                          <Link 
                            href={`/recipe/${recipe.id}`} 
                            className="block flex-1"
                          >
                            <h2 className="text-xl font-semibold line-clamp-1">
                              {recipe.recipeTitle || "Untitled Recipe"}
                            </h2>
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setMenuOpen(menuOpen === recipe.id ? null : recipe.id);
                            }}
                            className="relative p-1.5 rounded-full hover:bg-gray-100 transition-colors z-50 pointer-events-auto"
                          >
                            <FontAwesomeIcon 
                              icon={faEllipsisVertical} 
                              className="w-4 h-4 text-gray-400" 
                            />
                          </button>
                        </div>

                        {menuOpen === recipe.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setMenuOpen(null)}
                            />
                            <div 
                              className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg z-50 pointer-events-auto"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePinToggle(recipe.id, !!recipe.pinned);
                                  }}
                                  disabled={loadingPinAction === recipe.id}
                                  className="w-full px-4 py-2 text-sm flex items-center hover:bg-gray-100 transition-colors disabled:opacity-50"
                                >
                                  {loadingPinAction === recipe.id ? (
                                    <>
                                      <div className="w-4 h-4 mr-3">
                                        <div className="w-full h-full border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                      </div>
                                      <span>{recipe.pinned ? 'Unpinning...' : 'Pinning...'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <FontAwesomeIcon 
                                        icon={faThumbtack} 
                                        className={`w-4 h-4 mr-3 ${recipe.pinned ? 'text-yellow-500' : 'text-[#5d5d5d]'}`}
                                      />
                                      <span>{recipe.pinned ? 'Unpin recipe' : 'Pin recipe'}</span>
                                    </>
                                  )}
                                </button>

                                <div className="border-t border-gray-100" />
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDelete(recipe.id, recipe.recipeTitle);
                                  }}
                                  className="w-full px-4 py-2 text-sm flex items-center text-red-600 hover:bg-gray-100 transition-colors"
                                >
                                  <FontAwesomeIcon icon={faTrashCan} className="w-4 h-4 mr-3" />
                                  <span>Delete recipe</span>
                                </button>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Non-clickable content on mobile */}
                        <div className="md:pointer-events-auto pointer-events-none">
                          {recipe.recipeSummary && (
                            <>
                              <meta name="recipe-summary" content={recipe.recipeSummary} />
                              <p className="text-gray-600 mb-3 line-clamp-2">
                                {recipe.recipeSummary}
                              </p>
                            </>
                          )}
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-600">
                              <span className="mr-2">🍲</span>
                              <span className="line-clamp-1">
                                {recipe.diet && recipe.diet.length > 0
                                  ? recipe.diet.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")
                                  : "Not specified"}
                              </span>
                            </div>
                            
                            <div className="flex items-center text-gray-600">
                              <span className="mr-2">🍽️</span>
                              <span>{recipe.cuisineType ? recipe.cuisineType.charAt(0).toUpperCase() + recipe.cuisineType.slice(1) : "Unknown"}</span>
                            </div>
                            
                            <div className="flex items-center text-gray-600">
                              <span className="mr-2">⏲️</span>
                              <span>{recipe.cookingTime || "Not specified"}</span>
                            </div>
                            
                            <div className="flex items-center text-gray-600">
                              <span className="mr-2">🧩</span>
                              <span>{recipe.cookingDifficulty ? recipe.cookingDifficulty.charAt(0).toUpperCase() + recipe.cookingDifficulty.slice(1) : "Unknown"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Load More Button */}
              {!searchTerm && recipes.length > 0 && (
                <div className="flex justify-center mt-8 pb-8">
                  <button
                    onClick={() => fetchRecipes(true)}
                    disabled={loadingMore}
                    className="bg-black text-white px-6 py-3 rounded-full hover:bg-[#212121] transition-colors disabled:bg-gray-400 flex items-center space-x-2"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      "Load More Recipes"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recipes;
