"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit, startAfter } from "firebase/firestore";
import { db } from "../firebase/firebase";
import Link from "next/link"; // Import Link for navigation

interface Recipe {
    id: string;
    recipeTitle: string;
    cookingDifficulty: string;
    cuisineType: string;
    cookingTime: string;
    diet: string[];
}

const Recipes = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [lastVisible, setLastVisible] = useState<any>(null); // Tracks the last document for pagination
    const [loading, setLoading] = useState(false);

    const fetchRecipes = async (loadMore = false) => {
        setLoading(true);

        try {
            const recipesRef = collection(db, "recipes");
            const recipesQuery = loadMore
                ? query(recipesRef, orderBy("createdAt", "desc"), startAfter(lastVisible), limit(20))
                : query(recipesRef, orderBy("createdAt", "desc"), limit(20));

            const querySnapshot = await getDocs(recipesQuery);
            const fetchedRecipes: Recipe[] = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Recipe),
            }));

            setRecipes((prevRecipes) => (loadMore ? [...prevRecipes, ...fetchedRecipes] : fetchedRecipes));
            setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]); // Update the last document
        } catch (error) {
            console.error("Error fetching recipes:", error);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchRecipes(); // Initial fetch
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
                <h1 className="text-2xl font-bold text-center mb-6">My Recipes</h1>
                <ul className="space-y-4">
                    {recipes.map((recipe) => (
                        <li
                            key={recipe.id}
                            className="border border-gray-300 rounded-md p-4 shadow-sm bg-gray-50 hover:bg-gray-100"
                        >
                            <Link href={`/recipe/${recipe.id}`} className="block">
                                <h2 className="text-xl font-semibold">{recipe.recipeTitle || "Untitled Recipe"}</h2>
                                <p className="flex items-center">
                                    <span className="mr-2">🍲</span>
                                    <strong>Diet:&nbsp;</strong>
                                    {recipe.diet && recipe.diet.length > 0
                                        ? recipe.diet.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")
                                        : "Not specified"}
                                </p>
                                <p className="flex items-center">
                                    <span className="mr-2">🍽️</span>
                                    <strong>Cuisine:&nbsp;</strong>
                                    {recipe.cuisineType
                                        ? recipe.cuisineType.charAt(0).toUpperCase() + recipe.cuisineType.slice(1)
                                        : "Unknown"}
                                </p>
                                <p className="flex items-center">
                                    <span className="mr-2">⏲️</span>
                                    <strong>Cooking Time:&nbsp;</strong>
                                    {recipe.cookingTime || "Not specified"}
                                </p>
                                <p className="flex items-center">
                                    <span className="mr-2">🧩</span>
                                    <strong>Difficulty:&nbsp;</strong>
                                    {recipe.cookingDifficulty
                                        ? recipe.cookingDifficulty.charAt(0).toUpperCase() + recipe.cookingDifficulty.slice(1)
                                        : "Unknown"}
                                </p>
                            </Link>
                        </li>
                    ))}
                </ul>
                {recipes.length > 0 && (
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => fetchRecipes(true)} // Load more recipes
                            disabled={loading}
                            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {loading ? "Loading..." : "Load More"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Recipes;
