import React, { useEffect, useState } from "react";
import Link from "next/link"; // Import Link from next/link
import { db } from "../firebase/firebase"; // Import Firestore db
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore"; // Firestore methods
import { useAuth } from "../context/AuthContext"; // Import the AuthContext hook
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisH, faThumbtack, faTrashAlt } from "@fortawesome/free-solid-svg-icons";

interface Recipe {
  recipeTitle: string;
  id: string; // Firebase document ID
  createdAt: any; // Add the createdAt field to sort by it
  pinned: boolean; // Indicates if the recipe is pinned
}

export const RecipeList = () => {
  const { user } = useAuth(); // Get the currently authenticated user
  const [pinnedRecipes, setPinnedRecipes] = useState<Recipe[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [newRecipeIndex, setNewRecipeIndex] = useState<number | null>(null); // Track the index of the new recipe for animation
  const [menuOpen, setMenuOpen] = useState<string | null>(null); // Track which recipe's menu is open

  useEffect(() => {
    if (!user) return; // If no user is authenticated, do not fetch recipes

    // Fetch pinned recipes from Firestore
    const fetchPinnedRecipes = () => {
      const recipeCollection = collection(db, "recipes");
      const pinnedQuery = query(
        recipeCollection,
        where("userId", "==", user.uid),
        where("pinned", "==", true),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      const unsubscribe = onSnapshot(pinnedQuery, (snapshot) => {
        const pinnedRecipes = snapshot.docs.map((doc) => ({
          id: doc.id,
          recipeTitle: doc.data().recipeTitle,
          createdAt: doc.data().createdAt,
          pinned: doc.data().pinned,
        }));
        setPinnedRecipes(pinnedRecipes);
      });

      return unsubscribe;
    };

    // Fetch all recipes from Firestore
    const fetchRecipes = () => {
      const recipeCollection = collection(db, "recipes");
      const allQuery = query(
        recipeCollection,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      const unsubscribe = onSnapshot(allQuery, (snapshot) => {
        const allRecipes = snapshot.docs.map((doc) => ({
          id: doc.id,
          recipeTitle: doc.data().recipeTitle,
          createdAt: doc.data().createdAt,
          pinned: doc.data().pinned,
        }));

        // Filter out pinned recipes
        const nonPinnedRecipes = allRecipes.filter(
          (recipe) => !recipe.pinned
        );

        setRecipes(nonPinnedRecipes);
      });

      return unsubscribe;
    };

    const unsubscribePinned = fetchPinnedRecipes();
    const unsubscribeAll = fetchRecipes();

    return () => {
      unsubscribePinned();
      unsubscribeAll();
    };
  }, [user]);

  const handleMenuToggle = (id: string) => {
    setMenuOpen(menuOpen === id ? null : id);
  };

  const handlePinUnpin = async (id: string, isPinned: boolean) => {
    try {
      const recipeRef = doc(db, "recipes", id);
      await updateDoc(recipeRef, { pinned: !isPinned });
      setMenuOpen(null);
    } catch (error) {
      console.error("Error toggling pin: ", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const recipeRef = doc(db, "recipes", id);
      await deleteDoc(recipeRef);
      setPinnedRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
      setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
      setMenuOpen(null);
    } catch (error) {
      console.error("Error deleting recipe: ", error);
    }
  };

  const renderMenu = (id: string, isPinned: boolean) => (
    <div
      className="absolute right-0 z-40 bg-white rounded-3xl shadow-lg w-48 border border-gray-300 p-3"
    >
      <ul className="space-y-1">
        <li
          className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
          onClick={() => handlePinUnpin(id, isPinned)}
        >
          <FontAwesomeIcon
            icon={faThumbtack}
            className={`text-gray-600 mr-3 ${isPinned ? "text-yellow-500" : ""}`}
          />
          <span>{isPinned ? "Unpin" : "Pin"}</span>
        </li>
        <li
          className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer text-red-500"
          onClick={() => handleDelete(id)}
        >
          <FontAwesomeIcon icon={faTrashAlt} className="mr-3 text-red-500" />
          <span>Delete</span>
        </li>
      </ul>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-gray-600 text-sm font-semibold pb-2 border-b">
          Pinned Recipes
        </h2>
        {pinnedRecipes.map((recipe, index) => (
          <div
            key={recipe.id}
            className="relative group bg-yellow-200 p-3 mt-2 rounded-md hover:bg-yellow-300"
            onMouseLeave={() => setMenuOpen(null)}
          >
            <Link href={`/recipe/${recipe.id}`} passHref>
              <div className="block">
                <div className="flex justify-between items-center">
                  {recipe.recipeTitle}
                  <FontAwesomeIcon
                    icon={faEllipsisH}
                    className="ml-4 text-gray-500 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMenuToggle(recipe.id);
                    }}
                  />
                </div>
              </div>
            </Link>
            {menuOpen === recipe.id && renderMenu(recipe.id, recipe.pinned)}
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-gray-600 text-sm font-semibold pb-2 border-b">
          Recently Saved Recipes
        </h2>
        {recipes.map((recipe, index) => (
          <div
            key={recipe.id}
            className="relative group bg-pink-200 p-3 mt-2 rounded-md hover:bg-pink-300"
            onMouseLeave={() => setMenuOpen(null)}
          >
            <Link href={`/recipe/${recipe.id}`} passHref>
              <div className="block">
                <div className="flex justify-between items-center">
                  {recipe.recipeTitle}
                  <FontAwesomeIcon
                    icon={faEllipsisH}
                    className="ml-4 text-gray-500 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMenuToggle(recipe.id);
                    }}
                  />
                </div>
              </div>
            </Link>
            {menuOpen === recipe.id && renderMenu(recipe.id, recipe.pinned)}
          </div>
        ))}
      </div>

    </div>
  );
};
