import React, { useEffect, useState } from "react";
import Link from "next/link"; // Import Link from next/link
import { db } from "../firebase/firebase"; // Import Firestore db
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore"; // Firestore methods
import { useAuth } from "../context/AuthContext"; // Import the AuthContext hook

interface Recipe {
  recipeTitle: string;
  id: string; // Firebase document ID
  createdAt: any; // Add the createdAt field to sort by it
}

export const RecipeList = () => {
  const { user } = useAuth(); // Get the currently authenticated user
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [newRecipeIndex, setNewRecipeIndex] = useState<number | null>(null); // Track the index of the new recipe for animation

  useEffect(() => {
    if (!user) return; // If no user is authenticated, do not fetch recipes

    // Function to fetch recipes from Firestore
    const fetchRecipes = () => {
      try {
        const recipeCollection = collection(db, "recipes");
        const q = query(
          recipeCollection,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"), // Sort by createdAt in descending order
          limit(20) // Limit to the first 20 recipes
        );

        // Setting up a real-time listener
        const unsubscribe = onSnapshot(q, (recipeSnapshot) => {
          const recipeList = recipeSnapshot.docs.map((doc) => ({
            id: doc.id,
            recipeTitle: doc.data().recipeTitle, // Ensure 'recipeTitle' exists in your documents
            createdAt: doc.data().createdAt, // Include the createdAt field
          })) as Recipe[];

          setRecipes(recipeList); // Update state with the fetched recipes

          // Set newRecipeIndex to highlight the new recipe
          setNewRecipeIndex(0); // You can adjust this logic based on which recipe is considered "new"

          // Reset the new recipe index after animation (500ms for example)
          setTimeout(() => setNewRecipeIndex(null), 500);
        });

        // Cleanup listener on component unmount
        return unsubscribe;
      } catch (error) {
        console.error("Error fetching recipes: ", error);
      }
    };

    // Fetch recipes on mount and listen for real-time updates
    const unsubscribe = fetchRecipes();

    // Clean up the listener when the component is unmounted
    return () => {
      if (unsubscribe) {
        unsubscribe(); // Unsubscribe when component unmounts
      }
    };
  }, [user]); // Depend on 'user' to refetch recipes when the user changes

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-gray-600 text-sm font-semibold pb-2 border-b">
          Pinned Recipes
        </h2>
        
          {recipes.slice(0, 2).map((recipe, index) => (
            <Link
              key={recipe.id}
              href={`/recipe/${recipe.id}`} // Navigate to /recipe/{recipeId}
            >
              <div
                className={`block bg-yellow-200 p-3 mt-2 rounded-md cursor-pointer hover:bg-yellow-300 ${newRecipeIndex === index ? 'animate-flash' : ''}`}
              >
                {recipe.recipeTitle}
              </div>
            </Link>
          ))}
      
      </div>

      <div>
        <h2 className="text-gray-600 text-sm font-semibold pb-2 border-b">
          Recently Saved Recipes
        </h2>
        
          {recipes.slice(2).map((recipe, index) => (
            <Link
              key={recipe.id}
              href={`/recipe/${recipe.id}`} // Navigate to /recipe/{recipeId}
            >
              <div
                className={`block bg-pink-200 p-3 mt-2 rounded-md cursor-pointer hover:bg-pink-300 ${newRecipeIndex === index + 2 ? 'animate-flash' : ''}`}
              >
                {recipe.recipeTitle}
              </div>
            </Link>
          ))}
       
      </div>
    </div>
  );
};
