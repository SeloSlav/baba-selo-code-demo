import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase"; // Import Firestore db
import { collection, onSnapshot, query, where, orderBy, limit } from "firebase/firestore"; // Firestore methods
import { useAuth } from "../context/AuthContext"; // Import the AuthContext hook
import Link from 'next/link'; // Import Link from Next.js for navigation

interface Recipe {
  recipeTitle: string;
  id: string;
  createdAt: any;
}

export const RecipeList = () => {
  const { user } = useAuth(); // Get the currently authenticated user
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [newRecipeIndex, setNewRecipeIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchRecipes = () => {
      try {
        const recipeCollection = collection(db, "recipes");
        const q = query(
          recipeCollection,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(20)
        );

        const unsubscribe = onSnapshot(q, (recipeSnapshot) => {
          const recipeList = recipeSnapshot.docs.map((doc) => ({
            id: doc.id,
            recipeTitle: doc.data().recipeTitle,
            createdAt: doc.data().createdAt,
          })) as Recipe[];

          setRecipes(recipeList);
          setNewRecipeIndex(0);

          setTimeout(() => setNewRecipeIndex(null), 500);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error fetching recipes:", error);
      }
    };

    const unsubscribe = fetchRecipes();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-gray-600 text-sm font-semibold pb-2 border-b">
          Pinned Recipes
        </h2>

        <div className="space-y-2 mt-2">
          {recipes.slice(0, 2).map((recipe, index) => (
            <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
            <div
              key={recipe.id}
              className={`bg-yellow-200 p-3 mt-2 rounded-md cursor-pointer hover:bg-yellow-300 ${newRecipeIndex === index ? 'animate-flash' : ''}`}
            >
              {recipe.recipeTitle}
            </div>
            </Link>
          ))}
        </div>

      </div>

      <div>
        <h2 className="text-gray-600 text-sm font-semibold pb-2 border-b">
          Recently Saved Recipes
        </h2>
          {recipes.slice(2).map((recipe, index) => (
            <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
              <div
                className={`bg-pink-200 p-3 mt-2 rounded-md cursor-pointer hover:bg-pink-300 ${newRecipeIndex === index + 2 ? 'animate-flash' : ''}`}
              >
                {recipe.recipeTitle}
              </div>
            </Link>
          ))}
      </div>
      
    </div>
  );
};
