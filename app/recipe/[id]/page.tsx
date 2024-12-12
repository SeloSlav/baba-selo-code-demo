"use client"; // This marks this file as a client component

import { useParams } from "next/navigation"; // Use useParams from next/navigation
import { db } from "../../firebase/firebase"; // Import Firestore db
import { doc, getDoc } from "firebase/firestore"; // Firestore methods
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faCheckCircle } from "@fortawesome/free-regular-svg-icons"; // Import FontAwesome icons

interface Recipe {
  recipeTitle: string;
  recipeContent: string;
  id: string;
  cuisineType: string;
  cookingDifficulty: string;
  cookingTime: string;
  diet: string[];
  directions: string[];
  ingredients: string[];
}

const RecipeDetails = () => {
  const [recipe, setRecipe] = useState<Recipe | null>(null); // State to store the recipe details
  const [checkedDirections, setCheckedDirections] = useState<boolean[]>([]); // Track checked directions
  const [checkedIngredients, setCheckedIngredients] = useState<boolean[]>([]); // Track checked ingredients
  const { id } = useParams(); // Use useParams to get route params

  useEffect(() => {
    if (!id) return; // If no id, do nothing

    const fetchRecipe = async () => {
      try {
        const recipeDocRef = doc(db, "recipes", id as string); // Reference to the specific recipe in Firestore
        const recipeDoc = await getDoc(recipeDocRef);

        if (recipeDoc.exists()) {
          const data = recipeDoc.data();
          
          // Safely handle missing data
          const directions = Array.isArray(data.directions) ? data.directions : []; // Default to empty array if directions is not valid
          const ingredients = Array.isArray(data.ingredients) ? data.ingredients : []; // Default to empty array if ingredients is not valid
          
          setRecipe({
            id: recipeDoc.id,
            recipeTitle: data.recipeTitle || "No title", // Fallback if title is missing
            recipeContent: data.recipeContent || "No content", // Fallback if content is missing
            cuisineType: data.cuisineType || "Unknown", // Fallback if cuisineType is missing
            cookingDifficulty: data.cookingDifficulty || "Unknown", // Fallback if difficulty is missing
            cookingTime: data.cookingTime || "Unknown", // Fallback if cookingTime is missing
            diet: data.diet || [], // Default to empty array if diet is missing
            directions: directions, // Safely use the directions
            ingredients: ingredients, // Safely use the ingredients
          });

          // Initialize the checkedDirections and checkedIngredients state based on the number of directions and ingredients
          setCheckedDirections(new Array(directions.length).fill(false));
          setCheckedIngredients(new Array(ingredients.length).fill(false));
        } else {
          console.log("No such recipe!");
        }
      } catch (error) {
        console.error("Error fetching recipe:", error);
      }
    };

    fetchRecipe();
  }, [id]); // Dependency on `id`

  // Function to toggle the checkmark for directions
  const toggleDirectionCheck = (index: number) => {
    const updatedCheckedDirections = [...checkedDirections];
    updatedCheckedDirections[index] = !updatedCheckedDirections[index];
    setCheckedDirections(updatedCheckedDirections);
  };

  // Function to toggle the checkmark for ingredients
  const toggleIngredientCheck = (index: number) => {
    const updatedCheckedIngredients = [...checkedIngredients];
    updatedCheckedIngredients[index] = !updatedCheckedIngredients[index];
    setCheckedIngredients(updatedCheckedIngredients);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {recipe ? (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-4">{recipe.recipeTitle}</h1>

          {/* Classification section */}
          <div className="mb-6 flex flex-wrap gap-4">
            {recipe.diet.length > 0 && (
              <div className="flex items-center bg-gray-100 border border-gray-300 shadow-sm rounded-full px-4 py-2">
                <span className="font-semibold mr-2">🍲</span>
                <span>{recipe.diet.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}</span> {/* Capitalize first letter */}
              </div>
            )}
            {recipe.cuisineType && (
              <div className="flex items-center bg-gray-100 border border-gray-300 shadow-sm rounded-full px-4 py-2">
                <span className="font-semibold mr-2">🍽️</span>
                <span>{recipe.cuisineType.charAt(0).toUpperCase() + recipe.cuisineType.slice(1)}</span> {/* Capitalize first letter */}
              </div>
            )}
            {recipe.cookingTime && (
              <div className="flex items-center bg-gray-100 border border-gray-300 shadow-sm rounded-full px-4 py-2">
                <span className="font-semibold mr-2">⏲️</span>
                <span>{recipe.cookingTime}</span>
              </div>
            )}
            {recipe.cookingDifficulty && (
              <div className="flex items-center bg-gray-100 border border-gray-300 shadow-sm rounded-full px-4 py-2">
                <span className="font-semibold mr-2">🧩</span>
                <span>{recipe.cookingDifficulty.charAt(0).toUpperCase() + recipe.cookingDifficulty.slice(1)}</span> {/* Capitalize first letter */}
              </div>
            )}
          </div>

          {/* Ingredients section */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Ingredients</h3>
            <ul className="list-none pl-6 space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className={`cursor-pointer flex items-center bg-gray-100 border border-gray-300 rounded-full px-3 py-2 ${checkedIngredients[index] ? "bg-gray-200 line-through text-gray-400" : ""
                    }`}
                  onClick={() => toggleIngredientCheck(index)} // Toggle checked state on click
                >
                  <FontAwesomeIcon
                    icon={checkedIngredients[index] ? faCheckCircle : faCircle} // Toggle between checked and unchecked circle
                    className={`mr-3 ${checkedIngredients[index] ? "text-green-500" : "text-gray-400"}`}
                  />
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          {/* Directions section */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Directions</h3>
            <ul className="list-none pl-6 space-y-2">
              {recipe.directions.map((direction, index) => (
                <li
                  key={index}
                  className={`cursor-pointer flex items-center bg-gray-100 border border-gray-300 rounded-full px-3 py-2 ${checkedDirections[index] ? "bg-gray-200 line-through text-gray-400" : "bg-gray-100"
                    }`}
                  onClick={() => toggleDirectionCheck(index)} // Toggle checked state on click
                >
                  <div className="flex items-center">
                    <FontAwesomeIcon
                      icon={checkedDirections[index] ? faCheckCircle : faCircle} // Toggle between checked and unchecked circle
                      className={`mr-3 ${checkedDirections[index] ? "text-green-500" : "text-gray-400"}`}
                    />
                    {direction}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="typing-indicator flex space-x-2 mt-4">
            <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
            <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
            <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeDetails;
