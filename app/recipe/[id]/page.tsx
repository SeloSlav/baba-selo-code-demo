"use client"; // This marks this file as a client component

import { useParams, useRouter } from "next/navigation"; // Use useParams and useRouter for navigation
import { db } from "../../firebase/firebase"; // Import Firestore db
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore"; // Firestore methods
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faCheckCircle, faTrashCan } from "@fortawesome/free-regular-svg-icons"; // Import FontAwesome icons
import { getAuth } from "firebase/auth"; // Import Firebase auth
import Image from "next/image";
import { RecipeChatBubble } from "../../components/RecipeChatBubble";

interface Recipe {
  recipeTitle: string;
  recipeContent: string;
  id: string;
  userId: string; // Add userId to track ownership
  cuisineType: string;
  cookingDifficulty: string;
  cookingTime: string;
  diet: string[];
  directions: string[];
  ingredients: string[];
  imageURL?: string; // Optional imageURL for the recipe image
}

const RecipeDetails = () => {
  const [recipe, setRecipe] = useState<Recipe | null>(null); // State to store the recipe details
  const [checkedDirections, setCheckedDirections] = useState<boolean[]>([]); // Track checked directions
  const [checkedIngredients, setCheckedIngredients] = useState<boolean[]>([]); // Track checked ingredients
  const [isOwner, setIsOwner] = useState(false); // Check if the current user owns the recipe
  const [loadingImage, setLoadingImage] = useState(false); // Loading state for image generation
  const { id } = useParams(); // Use useParams to get route params
  const router = useRouter(); // Use useRouter for redirection
  const auth = getAuth();

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
            userId: data.userId || "", // Track the userId
            cuisineType: data.cuisineType || "Unknown", // Fallback if cuisineType is missing
            cookingDifficulty: data.cookingDifficulty || "Unknown", // Fallback if difficulty is missing
            cookingTime: data.cookingTime || "Unknown", // Fallback if cookingTime is missing
            diet: data.diet || [], // Default to empty array if diet is missing
            directions: directions, // Safely use the directions
            ingredients: ingredients, // Safely use the ingredients
            imageURL: data.imageURL || "", // Handle optional imageURL
          });

          // Check if the current user is the owner of the recipe
          const currentUser = auth.currentUser;
          if (currentUser && currentUser.uid === data.userId) {
            setIsOwner(true);
          }

          // Initialize the checkedDirections and checkedIngredients state
          setCheckedDirections(new Array(directions.length).fill(false));
          setCheckedIngredients(new Array(ingredients.length).fill(false));
        } else {
          // console.log("No such recipe!");
        }
      } catch (error) {
        console.error("Error fetching recipe:", error);
      }
    };

    fetchRecipe();
  }, [id, auth]);

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

  // Function to delete the recipe
  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteDoc(doc(db, "recipes", id as string)); // Delete the recipe from Firestore
      router.push("/recipes"); // Redirect to the /recipes page
    } catch (error) {
      console.error("Error deleting recipe:", error);
    }
  };

  // Function to generate a new recipe image using DALL·E
  const handleGenerateImage = async () => {
    if (!recipe || !id) return;

    setLoadingImage(true);

    try {
      const response = await fetch("/api/generateImage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `A rustic dish representation for ${recipe.recipeTitle}`,
          recipeId: id,
        }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        const recipeDocRef = doc(db, "recipes", id as string);

        // Save the absolute URL to Firestore
        await updateDoc(recipeDocRef, { imageURL: data.imageUrl });

        // Update local state with the new image URL
        setRecipe((prevRecipe) => prevRecipe && { ...prevRecipe, imageURL: data.imageUrl });
      }
    } catch (error) {
      console.error("Error generating image:", error);
    }

    setLoadingImage(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {recipe ? (
        <div className="bg-white shadow-lg rounded-lg p-6 max-w-4xl mx-auto">
          {/* Recipe Image */}
          <div className="relative h-64 w-full mb-6">
            {recipe.imageURL ? (
              <Image
                src={recipe.imageURL}
                alt={recipe.recipeTitle}
                fill
                className="object-cover rounded-lg"
                unoptimized
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-200 rounded-lg">
                {isOwner && !loadingImage && (
                  <button
                    onClick={handleGenerateImage}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg ml-4 hover:bg-blue-700"
                  >
                    Generate Image
                  </button>
                )}
                {loadingImage && (
                  <div className="ml-4">
                    <div className="flex items-center justify-start">
                      <div className="typing-indicator flex space-x-2 mt-4">
                        <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
                        <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
                        <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
                      </div>
                    </div>
                    <p className="text-gray-500 max-w-sm mt-2">
                      Baba selo is weaving her magic in the kitchen! You can go explore and come back later; your masterpiece will be ready.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-4">{recipe.recipeTitle}</h1>

          {/* Classification section */}
          <div className="mb-6 flex flex-wrap gap-4">
            {recipe.diet.length > 0 && (
              <div className="flex items-center bg-gray-100 border border-gray-300 shadow-sm rounded-full px-4 py-2">
                <span className="font-semibold mr-2">🍲</span>
                <span>{recipe.diet.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}</span>
              </div>
            )}
            {recipe.cuisineType && (
              <div className="flex items-center bg-gray-100 border border-gray-300 shadow-sm rounded-full px-4 py-2">
                <span className="font-semibold mr-2">🍽️</span>
                <span>{recipe.cuisineType.charAt(0).toUpperCase() + recipe.cuisineType.slice(1)}</span>
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
                <span>{recipe.cookingDifficulty.charAt(0).toUpperCase() + recipe.cookingDifficulty.slice(1)}</span>
              </div>
            )}
          </div>

          {/* Ingredients, Directions, Delete Button */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Ingredients</h3>
            <ul className="list-none pl-6 space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className={`cursor-pointer flex items-center bg-gray-100 border border-gray-300 rounded-full px-3 py-2 ${checkedIngredients[index] ? "bg-gray-200 line-through text-gray-400" : ""}`}
                  onClick={() => toggleIngredientCheck(index)}
                >
                  <FontAwesomeIcon
                    icon={checkedIngredients[index] ? faCheckCircle : faCircle}
                    className={`mr-3 ${checkedIngredients[index] ? "text-green-500" : "text-gray-400"}`}
                  />
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Directions</h3>
            <ul className="list-none pl-6 space-y-2">
              {recipe.directions.map((direction, index) => (
                <li
                  key={index}
                  className={`cursor-pointer flex items-center bg-gray-100 border border-gray-300 rounded-md px-3 py-2 ${checkedDirections[index] ? "bg-gray-200 line-through text-gray-400" : ""}`}
                  onClick={() => toggleDirectionCheck(index)}
                >
                  <FontAwesomeIcon
                    icon={checkedDirections[index] ? faCheckCircle : faCircle}
                    className={`mr-3 ${checkedDirections[index] ? "text-green-500" : "text-gray-400"}`}
                  />
                  {direction}
                </li>
              ))}
            </ul>
          </div>

          {isOwner && (
            <>
              <hr className="my-6 border-gray-300" />
              <div className="flex justify-center">
                <button
                  onClick={handleDelete}
                  className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700"
                >
                  <FontAwesomeIcon icon={faTrashCan} className="mr-2" />
                  Delete Recipe
                </button>
              </div>
            </>
          )}

          {/* Add the chat bubble */}
          <RecipeChatBubble 
            recipeContent={`Title: ${recipe.recipeTitle}

Cuisine Type: ${recipe.cuisineType}
Cooking Time: ${recipe.cookingTime}
Difficulty: ${recipe.cookingDifficulty}
Diet: ${recipe.diet.join(', ')}

Ingredients:
${recipe.ingredients.map((ingredient, index) => `${index + 1}. ${ingredient}`).join('\n')}

Directions:
${recipe.directions.map((direction, index) => `${index + 1}. ${direction}`).join('\n')}
`} 
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <img src="/baba-removebg.png" alt="Baba" className="w-32 h-32 mb-6" />
          <div className="typing-indicator flex space-x-2">
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
