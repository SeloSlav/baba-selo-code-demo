"use client"; // This marks this file as a client component

import { useParams, useRouter } from "next/navigation"; // Use useParams and useRouter for navigation
import { db } from "../../firebase/firebase"; // Import Firestore db
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore"; // Firestore methods
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faCheckCircle, faTrashCan } from "@fortawesome/free-regular-svg-icons";
import { faUpload, faTrash } from "@fortawesome/free-solid-svg-icons";
import { getAuth } from "firebase/auth"; // Import Firebase auth
import Image from "next/image";
import { RecipeChatBubble } from "../../components/RecipeChatBubble";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

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
  recipeSummary?: string; // Add new field for recipe summary
}

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f6f7f8" offset="0%" />
      <stop stop-color="#edeef1" offset="50%" />
      <stop stop-color="#f6f7f8" offset="100%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f6f7f8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite" />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

const RecipeDetails = () => {
  const [recipe, setRecipe] = useState<Recipe | null>(null); // State to store the recipe details
  const [checkedDirections, setCheckedDirections] = useState<boolean[]>([]); // Track checked directions
  const [checkedIngredients, setCheckedIngredients] = useState<boolean[]>([]); // Track checked ingredients
  const [isOwner, setIsOwner] = useState(false); // Check if the current user owns the recipe
  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const { id } = useParams();
  const router = useRouter(); // Use useRouter for redirection
  const auth = getAuth();
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const storage = getStorage();

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
            recipeSummary: data.recipeSummary || "", // Handle optional recipe summary
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

    // Show confirmation dialog
    const isConfirmed = window.confirm("Are you sure you want to delete this recipe? This action cannot be undone.");
    
    if (!isConfirmed) return;

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

  // Add new function to handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !id) return;

    setUploadingImage(true);
    const file = e.target.files[0];

    try {
      // Create a reference to the storage location
      const storageRef = ref(storage, `recipe-images/${id}`);
      
      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update Firestore with the new image URL
      const recipeDocRef = doc(db, "recipes", id as string);
      await updateDoc(recipeDocRef, { imageURL: downloadURL });
      
      // Update local state
      setRecipe((prevRecipe) => prevRecipe && { ...prevRecipe, imageURL: downloadURL });
      setImageError(false);
      setIsImageLoading(true);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  // Add function to handle image deletion
  const handleDeleteImage = async () => {
    if (!id || !recipe?.imageURL) return;

    try {
      // Delete from Storage
      const storageRef = ref(storage, `recipe-images/${id}`);
      await deleteObject(storageRef);

      // Update Firestore
      const recipeDocRef = doc(db, "recipes", id as string);
      await updateDoc(recipeDocRef, { imageURL: "" });

      // Update local state
      setRecipe((prevRecipe) => prevRecipe && { ...prevRecipe, imageURL: "" });
      setImageError(false);
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {recipe ? (
        <div className="bg-white shadow-lg rounded-lg p-6 max-w-4xl mx-auto">
          {/* Recipe Image with optimizations */}
          <div className="relative aspect-video w-full mb-6 bg-gray-100 rounded-lg overflow-hidden group">
            {recipe.imageURL && !imageError ? (
              <>
                <Image
                  src={recipe.imageURL}
                  alt={recipe.recipeTitle}
                  fill
                  className={`object-cover transition-opacity duration-300 ${
                    isImageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => setImageError(true)}
                  placeholder="blur"
                  blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(1920, 1080))}`}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
                  priority
                />
                {isImageLoading && (
                  <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                )}
                {isOwner && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                    <button
                      onClick={handleGenerateImage}
                      disabled={loadingImage}
                      className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {loadingImage ? (
                        <div className="flex items-center">
                          <LoadingSpinner className="mr-2" />
                          Regenerating...
                        </div>
                      ) : (
                        'Regenerate Image'
                      )}
                    </button>
                    <button
                      onClick={handleDeleteImage}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition-all duration-200"
                    >
                      <FontAwesomeIcon icon={faTrash} className="mr-2" />
                      Clear Image
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <span className="text-6xl">🍳</span>
                {isOwner && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                    <button
                      onClick={handleGenerateImage}
                      disabled={loadingImage}
                      className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {loadingImage ? (
                        <div className="flex items-center">
                          <LoadingSpinner className="mr-2" />
                          Generating...
                        </div>
                      ) : (
                        'Generate Image'
                      )}
                    </button>
                    <label className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 cursor-pointer transition-all duration-200 flex items-center">
                      <FontAwesomeIcon icon={faUpload} className="mr-2" />
                      {uploadingImage ? (
                        <div className="flex items-center">
                          <LoadingSpinner className="mr-2" />
                          Uploading...
                        </div>
                      ) : (
                        'Upload Image'
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative group">
            <h1 className="text-3xl font-bold mb-4">{recipe.recipeTitle}</h1>
            {isOwner && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300 rounded-lg flex items-center justify-center">
                <button
                  onClick={async () => {
                    setLoadingTitle(true);
                    try {
                      const response = await fetch("/api/generateTitle", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          ingredients: recipe.ingredients,
                          directions: recipe.directions,
                          cuisineType: recipe.cuisineType,
                          diet: recipe.diet,
                          recipeId: id,
                        }),
                      });

                      const data = await response.json();
                      if (data.title) {
                        const recipeDocRef = doc(db, "recipes", id as string);
                        await updateDoc(recipeDocRef, { recipeTitle: data.title });
                        setRecipe(prev => prev ? { ...prev, recipeTitle: data.title } : null);
                      }
                    } catch (error) {
                      console.error("Error generating title:", error);
                    } finally {
                      setLoadingTitle(false);
                    }
                  }}
                  disabled={loadingTitle}
                  className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-1 text-sm rounded-lg shadow-md hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingTitle ? (
                    <div className="flex items-center">
                      <LoadingSpinner className="mr-2" />
                      Regenerating...
                    </div>
                  ) : (
                    'Regenerate Title'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Recipe Summary Section */}
          <div className="relative group mb-6">
            {recipe.recipeSummary ? (
              <p className="text-gray-600 text-lg leading-relaxed">{recipe.recipeSummary}</p>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={async () => {
                    setLoadingSummary(true);
                    try {
                      const response = await fetch("/api/generateSummary", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          title: recipe.recipeTitle,
                          ingredients: recipe.ingredients,
                          directions: recipe.directions,
                          cuisineType: recipe.cuisineType,
                          diet: recipe.diet,
                          cookingTime: recipe.cookingTime,
                          cookingDifficulty: recipe.cookingDifficulty,
                        }),
                      });

                      const data = await response.json();
                      if (data.summary) {
                        const recipeDocRef = doc(db, "recipes", id as string);
                        await updateDoc(recipeDocRef, { recipeSummary: data.summary });
                        setRecipe(prev => prev ? { ...prev, recipeSummary: data.summary } : null);
                      }
                    } catch (error) {
                      console.error("Error generating summary:", error);
                    } finally {
                      setLoadingSummary(false);
                    }
                  }}
                  disabled={loadingSummary}
                  className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingSummary ? (
                    <div className="flex items-center">
                      <LoadingSpinner className="mr-2" />
                      Generating Summary...
                    </div>
                  ) : (
                    'Generate Recipe Summary'
                  )}
                </button>
              </div>
            )}
            {isOwner && recipe.recipeSummary && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300 rounded-lg flex items-center justify-center">
                <button
                  onClick={async () => {
                    setLoadingSummary(true);
                    try {
                      const response = await fetch("/api/generateSummary", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          title: recipe.recipeTitle,
                          ingredients: recipe.ingredients,
                          directions: recipe.directions,
                          cuisineType: recipe.cuisineType,
                          diet: recipe.diet,
                          cookingTime: recipe.cookingTime,
                          cookingDifficulty: recipe.cookingDifficulty,
                        }),
                      });

                      const data = await response.json();
                      if (data.summary) {
                        const recipeDocRef = doc(db, "recipes", id as string);
                        await updateDoc(recipeDocRef, { recipeSummary: data.summary });
                        setRecipe(prev => prev ? { ...prev, recipeSummary: data.summary } : null);
                      }
                    } catch (error) {
                      console.error("Error generating summary:", error);
                    } finally {
                      setLoadingSummary(false);
                    }
                  }}
                  disabled={loadingSummary}
                  className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-1 text-sm rounded-lg shadow-md hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingSummary ? (
                    <div className="flex items-center">
                      <LoadingSpinner className="mr-2" />
                      Regenerating...
                    </div>
                  ) : (
                    'Regenerate Summary'
                  )}
                </button>
              </div>
            )}
          </div>

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
          <LoadingSpinner className="scale-100" />
        </div>
      )}
    </div>
  );
};

export default RecipeDetails;
