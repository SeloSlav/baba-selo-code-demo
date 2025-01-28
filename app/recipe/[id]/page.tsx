"use client"; // This marks this file as a client component

import { useParams, useRouter } from "next/navigation"; // Use useParams and useRouter for navigation
import { db } from "../../firebase/firebase"; // Import Firestore db
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore"; // Firestore methods
import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faCheckCircle, faTrashCan, faCopy } from "@fortawesome/free-regular-svg-icons";
import { faUpload, faTrash, faSave, faThumbtack, faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
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
  recipeNotes?: string; // Add new field for recipe notes
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
  const [loadingMacros, setLoadingMacros] = useState(false);
  const [loadingPairings, setLoadingPairings] = useState(false);
  const [macroInfo, setMacroInfo] = useState(null);
  const [dishPairings, setDishPairings] = useState("");
  const { id } = useParams();
  const router = useRouter(); // Use useRouter for redirection
  const auth = getAuth();
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const storage = getStorage();
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [hasNoteChanges, setHasNoteChanges] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const ingredientsRef = useRef(null);
  const directionsRef = useRef(null);
  const notesRef = useRef(null);
  const macroInfoRef = useRef(null);
  const pairingsRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!id) return; // If no id, do nothing

    const fetchRecipe = async () => {
      try {
        const recipeDocRef = doc(db, "recipes", id as string);
        const recipeDoc = await getDoc(recipeDocRef);

        if (recipeDoc.exists()) {
          const data = recipeDoc.data();

          // Safely handle missing data
          const directions = Array.isArray(data.directions) ? data.directions : [];
          const ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];

          setRecipe({
            id: recipeDoc.id,
            recipeTitle: data.recipeTitle || "No title",
            recipeContent: data.recipeContent || "No content",
            userId: data.userId || "",
            cuisineType: data.cuisineType || "Unknown",
            cookingDifficulty: data.cookingDifficulty || "Unknown",
            cookingTime: data.cookingTime || "Unknown",
            diet: data.diet || [],
            directions: directions,
            ingredients: ingredients,
            imageURL: data.imageURL || "",
            recipeSummary: data.recipeSummary || "",
            recipeNotes: data.recipeNotes || "",
            macroInfo: data.macroInfo || null,
            dishPairings: data.dishPairings || "",
            pinned: data.pinned || false,
            lastPinnedAt: data.lastPinnedAt || null,
          });
          setNotes(data.recipeNotes || "");
          // Set the states from saved data if they exist
          if (data.macroInfo) setMacroInfo(data.macroInfo);
          if (data.dishPairings) setDishPairings(data.dishPairings);

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

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      const sections = [
        { id: 'ingredients', ref: ingredientsRef },
        { id: 'directions', ref: directionsRef },
        { id: 'notes', ref: notesRef },
        { id: 'macros', ref: macroInfoRef },
        { id: 'pairings', ref: pairingsRef }
      ];

      for (const section of sections) {
        if (section.ref.current) {
          const element = section.ref.current;
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
      const auth = getAuth();
      const userId = auth.currentUser?.uid;

      const response = await fetch("/api/generateImage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `A rustic dish representation for ${recipe.recipeTitle}`,
          recipeId: id,
          userId: userId
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

  // Add function to handle saving notes
  const handleSaveNotes = async () => {
    if (!id) return;
    setSavingNotes(true);
    try {
      const recipeDocRef = doc(db, "recipes", id as string);
      await updateDoc(recipeDocRef, { recipeNotes: notes });
      setRecipe(prev => prev ? { ...prev, recipeNotes: notes } : null);
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setSavingNotes(false);
    }
  };

  // Modify the notes change handler
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setNotes(newValue);
    setHasNoteChanges(newValue !== recipe?.recipeNotes);
  };

  const calculateProgress = () => {
    if (!recipe) return { ingredients: 0, directions: 0 };
    
    const ingredientsProgress = checkedIngredients.filter(Boolean).length / recipe.ingredients.length * 100;
    const directionsProgress = checkedDirections.filter(Boolean).length / recipe.directions.length * 100;
    
    return {
      ingredients: ingredientsProgress,
      directions: directionsProgress
    };
  };

  // Update the macro info handler
  const handleMacroCalculation = async () => {
    setLoadingMacros(true);
    try {
      const response = await fetch("/api/macroInfo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipe: `Title: ${recipe.recipeTitle}
          Ingredients:
          ${recipe.ingredients.join('\n')}
          Directions:
          ${recipe.directions.join('\n')}`
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error("Error from macroInfo API:", data.error);
        return;
      }

      if (data.macros && 
          typeof data.macros.servings === 'number' && 
          data.macros.total && 
          data.macros.per_serving) {
        // Ensure all required numeric fields exist and are numbers
        const validatedMacros = {
          servings: data.macros.servings,
          total: {
            calories: Number(data.macros.total.calories) || 0,
            proteins: Number(data.macros.total.proteins) || 0,
            carbs: Number(data.macros.total.carbs) || 0,
            fats: Number(data.macros.total.fats) || 0
          },
          per_serving: {
            calories: Number(data.macros.per_serving.calories) || 0,
            proteins: Number(data.macros.per_serving.proteins) || 0,
            carbs: Number(data.macros.per_serving.carbs) || 0,
            fats: Number(data.macros.per_serving.fats) || 0
          }
        };

        // Save to Firestore
        const recipeDocRef = doc(db, "recipes", id as string);
        await updateDoc(recipeDocRef, { macroInfo: validatedMacros });
        
        // Update local state
        setMacroInfo(validatedMacros);
        setRecipe(prev => prev ? { ...prev, macroInfo: validatedMacros } : null);
      } else {
        console.error("Invalid macro data structure:", data);
      }
    } catch (error) {
      console.error("Error generating macro info:", error);
    } finally {
      setLoadingMacros(false);
    }
  };

  // Update the dish pairings handler
  const handlePairingsGeneration = async () => {
    setLoadingPairings(true);
    try {
      const response = await fetch("/api/dishPairing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipe: `Title: ${recipe.recipeTitle}
          Cuisine: ${recipe.cuisineType}
          Ingredients:
          ${recipe.ingredients.join('\n')}
          Directions:
          ${recipe.directions.join('\n')}`
        }),
      });

      const data = await response.json();
      if (data.suggestion) {
        // Save to Firestore
        const recipeDocRef = doc(db, "recipes", id as string);
        await updateDoc(recipeDocRef, { dishPairings: data.suggestion });
        
        // Update local state
        setDishPairings(data.suggestion);
        setRecipe(prev => prev ? { ...prev, dishPairings: data.suggestion } : null);
      }
    } catch (error) {
      console.error("Error generating pairings:", error);
    } finally {
      setLoadingPairings(false);
    }
  };

  // Add click outside handler for menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Function to handle pinning/unpinning
  const handlePinToggle = async () => {
    if (!id || !isOwner) return;
    try {
      const recipeDocRef = doc(db, "recipes", id as string);
      const newPinnedState = !recipe?.pinned;
      
      // Update Firestore with consistent property names
      await updateDoc(recipeDocRef, { 
        pinned: newPinnedState,
        lastPinnedAt: newPinnedState ? new Date().toISOString() : null
      });
      
      // Update local state
      setRecipe(prev => prev ? { 
        ...prev, 
        pinned: newPinnedState,
        lastPinnedAt: newPinnedState ? new Date().toISOString() : null
      } : null);
    } catch (error) {
      console.error("Error toggling pin status:", error);
    }
  };

  // Function to copy recipe URL to clipboard
  const handleCopyRecipe = () => {
    if (!recipe) return;
    
    const recipeUrl = `https://www.babaselo.com/recipe/${id}`;

    navigator.clipboard.writeText(recipeUrl).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      setShowMenu(false);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {recipe ? (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          {/* Recipe Classifications */}
          <div className="mb-6 flex flex-wrap gap-3">
            {recipe.diet.length > 0 && (
              <div className="flex items-center bg-gray-100 border border-gray-300 shadow-sm rounded-full px-3 py-1.5 text-sm">
                <span className="font-semibold mr-2">🍲</span>
                <span>{recipe.diet.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}</span>
              </div>
            )}
            {recipe.cuisineType && (
              <div className="flex items-center bg-gray-100 border border-gray-300 shadow-sm rounded-full px-3 py-1.5 text-sm">
                <span className="font-semibold mr-2">🍽️</span>
                <span>{recipe.cuisineType.charAt(0).toUpperCase() + recipe.cuisineType.slice(1)}</span>
              </div>
            )}
            {recipe.cookingTime && (
              <div className="flex items-center bg-gray-100 border border-gray-300 shadow-sm rounded-full px-3 py-1.5 text-sm">
                <span className="font-semibold mr-2">⏲️</span>
                <span>{recipe.cookingTime}</span>
              </div>
            )}
            {recipe.cookingDifficulty && (
              <div className="flex items-center bg-gray-100 border border-gray-300 shadow-sm rounded-full px-3 py-1.5 text-sm">
                <span className="font-semibold mr-2">🧩</span>
                <span>{recipe.cookingDifficulty.charAt(0).toUpperCase() + recipe.cookingDifficulty.slice(1)}</span>
              </div>
            )}
          </div>

          {/* New Action Bar */}
          <div className="flex flex-wrap gap-3 mb-8 items-center border-t border-b border-gray-200 py-4">
            <button
              onClick={handleCopyRecipe}
              className="flex items-center text-gray-700 hover:text-gray-900 transition-colors duration-200"
            >
              <FontAwesomeIcon icon={faCopy} className="w-5 h-5" />
              <span className="ml-2 text-sm">{copySuccess ? 'Link Copied!' : 'Share Recipe'}</span>
            </button>

            {isOwner && (
              <>
                <div className="w-px h-6 bg-gray-200" /> {/* Divider */}
                <button
                  onClick={handlePinToggle}
                  className={`flex items-center transition-colors duration-200 ${
                    recipe.pinned ? 'text-blue-500 hover:text-blue-600' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <FontAwesomeIcon 
                    icon={faThumbtack} 
                    className={`w-5 h-5 transform transition-all duration-300 ${
                      recipe.pinned ? 'rotate-[45deg] scale-110' : 'hover:scale-110'
                    }`}
                  />
                  <span className="ml-2 text-sm">{recipe.pinned ? 'Pinned' : 'Pin Recipe'}</span>
                </button>

                <div className="w-px h-6 bg-gray-200" /> {/* Divider */}
                <button
                  onClick={handleDelete}
                  className="flex items-center text-gray-700 hover:text-red-600 transition-colors duration-200"
                >
                  <FontAwesomeIcon icon={faTrashCan} className="w-5 h-5" />
                  <span className="ml-2 text-sm">Delete Recipe</span>
                </button>
              </>
            )}
          </div>

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
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold mb-4">{recipe.recipeTitle}</h1>
              {isOwner && (
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
                  className="opacity-0 group-hover:opacity-100 ml-4 bg-white text-gray-600 px-2 py-1 text-xs rounded-md shadow-sm hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
                >
                  {loadingTitle ? (
                    <div className="flex items-center">
                      <LoadingSpinner className="mr-1 w-3 h-3" />
                      <span>Regenerating...</span>
                    </div>
                  ) : (
                    <>
                      <span>🔄</span>
                      <span className="ml-1">Regenerate</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Recipe Summary Section */}
          <div className="relative group mb-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
              <div className="w-full">
                {recipe.recipeSummary ? (
                  <div className="relative">
                    <p className="text-gray-600 text-lg leading-relaxed">{recipe.recipeSummary}</p>
                    {isOwner && (
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
                        className="opacity-0 group-hover:opacity-100 absolute top-0 right-0 md:relative md:ml-4 bg-white text-gray-600 px-2 py-1 text-xs rounded-md shadow-sm hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
                      >
                        {loadingSummary ? (
                          <div className="flex items-center">
                            <LoadingSpinner className="mr-1 w-3 h-3" />
                            <span>Regenerating...</span>
                          </div>
                        ) : (
                          <>
                            <span>🔄</span>
                            <span className="ml-1">Regenerate</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
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
              </div>
            </div>
          </div>

          {/* Add refs to sections */}
          <div ref={ingredientsRef} className="mb-6">
            <h3 className="text-xl font-semibold mb-2">
              <span className="mr-2">📝</span>
              Ingredients
            </h3>
            <ul className="list-none pl-6 space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className={`cursor-pointer flex items-center bg-gray-100 border border-gray-300 rounded-full px-3 py-2 transform transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md ${
                    checkedIngredients[index] 
                      ? "bg-green-50 border-green-200 -translate-x-1" 
                      : "hover:border-gray-400"
                  }`}
                  onClick={() => toggleIngredientCheck(index)}
                >
                  <FontAwesomeIcon
                    icon={checkedIngredients[index] ? faCheckCircle : faCircle}
                    className={`mr-3 transform transition-transform duration-300 ${
                      checkedIngredients[index] 
                        ? "text-green-500 scale-110" 
                        : "text-gray-400 hover:scale-105"
                    }`}
                  />
                  <span className={`transition-all duration-300 ${
                    checkedIngredients[index] 
                      ? "line-through text-gray-400" 
                      : "text-gray-700"
                  }`}>
                  {ingredient}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div ref={directionsRef} className="mb-6">
            <h3 className="text-xl font-semibold mb-2">
              <span className="mr-2">👩‍🍳</span>
              Directions
            </h3>
            <ul className="list-none pl-6 space-y-2">
              {recipe.directions.map((direction, index) => (
                <li
                  key={index}
                  className={`cursor-pointer flex items-center bg-gray-100 border border-gray-300 rounded-md px-3 py-2 transform transition-all duration-300 ease-in-out hover:scale-[1.01] hover:shadow-md ${
                    checkedDirections[index] 
                      ? "bg-blue-50 border-blue-200 -translate-x-1" 
                      : "hover:border-gray-400"
                  }`}
                  onClick={() => toggleDirectionCheck(index)}
                >
                  <div className="flex-shrink-0">
                  <FontAwesomeIcon
                    icon={checkedDirections[index] ? faCheckCircle : faCircle}
                      className={`mr-3 transform transition-transform duration-300 ${
                        checkedDirections[index] 
                          ? "text-blue-500 scale-110" 
                          : "text-gray-400 hover:scale-105"
                      }`}
                    />
                  </div>
                  <span className={`transition-all duration-300 ${
                    checkedDirections[index] 
                      ? "line-through text-gray-400" 
                      : "text-gray-700"
                  }`}>
                  {direction}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div ref={notesRef} className="mb-6">
            <h3 className="text-xl font-semibold mb-2">
              <span className="mr-2">📌</span>
              Recipe Notes
            </h3>
            <div className="relative">
              <textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="Add your personal notes about this recipe..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              {hasNoteChanges && (
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="absolute bottom-3 right-3 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {savingNotes ? (
                    <div className="flex items-center">
                      <LoadingSpinner className="mr-2" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} className="mr-2" />
                      Save
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Move Calorie & Nutritional Info Section here */}
          <div ref={macroInfoRef} className="mb-6" style={{ scrollMarginBottom: '150px' }}>
            <h3 className="text-xl font-semibold mb-2">
              <span className="mr-2">🔢</span>
              Calorie & Nutritional Info
            </h3>
            <div className="relative group">
              <div className="w-full">
                {macroInfo ? (
                  <div className="relative">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Total Recipe ({macroInfo.servings} servings)</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-sm text-gray-500">Calories</div>
                              <div className="font-semibold">{macroInfo.total.calories}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-sm text-gray-500">Protein</div>
                              <div className="font-semibold">{macroInfo.total.proteins}g</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-sm text-gray-500">Carbs</div>
                              <div className="font-semibold">{macroInfo.total.carbs}g</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-sm text-gray-500">Fat</div>
                              <div className="font-semibold">{macroInfo.total.fats}g</div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Per Serving</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-sm text-gray-500">Calories</div>
                              <div className="font-semibold">{macroInfo.per_serving.calories}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-sm text-gray-500">Protein</div>
                              <div className="font-semibold">{macroInfo.per_serving.proteins}g</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-sm text-gray-500">Carbs</div>
                              <div className="font-semibold">{macroInfo.per_serving.carbs}g</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-sm text-gray-500">Fat</div>
                              <div className="font-semibold">{macroInfo.per_serving.fats}g</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {macroInfo && (
                      <button
                        onClick={handleMacroCalculation}
                        disabled={loadingMacros}
                        className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 md:relative md:ml-4 bg-white text-gray-600 px-2 py-1 text-xs rounded-md shadow-sm hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
                      >
                        {loadingMacros ? (
                          <div className="flex items-center">
                            <LoadingSpinner className="mr-1 w-3 h-3" />
                            <span>Recalculating...</span>
                          </div>
                        ) : (
                          <>
                            <span>🔄</span>
                            <span className="ml-1">Recalculate</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <button
                      onClick={handleMacroCalculation}
                      disabled={loadingMacros}
                      className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingMacros ? (
                        <div className="flex items-center">
                          <LoadingSpinner className="mr-2" />
                          Calculating...
                        </div>
                      ) : (
                        'Calculate Nutritional Info'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Move Dish Pairings Section here */}
          <div ref={pairingsRef} className="mb-6" style={{ scrollMarginBottom: '150px' }}>
            <h3 className="text-xl font-semibold mb-2">
              <span className="mr-2">🍷</span>
              Dish Pairings
            </h3>
            <div className="relative group">
              <div className="w-full">
                {dishPairings ? (
                  <div className="relative">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <p className="text-gray-700 leading-relaxed">{dishPairings}</p>
                    </div>
                    {dishPairings && (
                      <button
                        onClick={handlePairingsGeneration}
                        disabled={loadingPairings}
                        className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 md:relative md:ml-4 bg-white text-gray-600 px-2 py-1 text-xs rounded-md shadow-sm hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
                      >
                        {loadingPairings ? (
                          <div className="flex items-center">
                            <LoadingSpinner className="mr-1 w-3 h-3" />
                            <span>Regenerating...</span>
                          </div>
                        ) : (
                          <>
                            <span>🔄</span>
                            <span className="ml-1">Regenerate</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <button
                      onClick={handlePairingsGeneration}
                      disabled={loadingPairings}
                      className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingPairings ? (
                        <div className="flex items-center">
                          <LoadingSpinner className="mr-2" />
                          Generating Suggestions...
                        </div>
                      ) : (
                        'Get Pairing Suggestions'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modified sticky navigation with progress and mobile responsiveness */}
          <div className="md:sticky md:top-4 fixed bottom-0 left-0 right-0 md:relative z-30">
            {/* Desktop version */}
            <div className="hidden md:block bg-white/80 backdrop-blur-sm rounded-lg shadow-sm mb-6 transition-all duration-300 ease-in-out">
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => scrollToSection(ingredientsRef)}
                      className={`px-4 py-2 rounded-full transition-all duration-200 ${
                        activeSection === 'ingredients'
                          ? 'bg-black text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      Ingredients
                    </button>
                    <button
                      onClick={() => scrollToSection(directionsRef)}
                      className={`px-4 py-2 rounded-full transition-all duration-200 ${
                        activeSection === 'directions'
                          ? 'bg-black text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      Directions
                    </button>
                    <button
                      onClick={() => scrollToSection(notesRef)}
                      className={`px-4 py-2 rounded-full transition-all duration-200 ${
                        activeSection === 'notes'
                          ? 'bg-black text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      Notes
                    </button>
                    <button
                      onClick={() => scrollToSection(macroInfoRef)}
                      className={`px-4 py-2 rounded-full transition-all duration-200 ${
                        activeSection === 'macros'
                          ? 'bg-black text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      Nutrition
                    </button>
                    <button
                      onClick={() => scrollToSection(pairingsRef)}
                      className={`px-4 py-2 rounded-full transition-all duration-200 ${
                        activeSection === 'pairings'
                          ? 'bg-black text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      Pairings
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Ingredients</span>
                      <span>{Math.round(calculateProgress().ingredients)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300 ease-out"
                        style={{ width: `${calculateProgress().ingredients}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Steps</span>
                      <span>{Math.round(calculateProgress().directions)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${calculateProgress().directions}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modified Mobile version - bottom fixed bar with horizontal scroll */}
            <div className="md:hidden bg-white shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.1)] rounded-t-xl w-[75%]">
              <div className="safe-area-inset-bottom">
                <div className="p-3">
                  {/* Progress bars in a more compact format */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="w-full">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Ingredients: {Math.round(calculateProgress().ingredients)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-300 ease-out"
                          style={{ width: `${calculateProgress().ingredients}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-full">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Steps: {Math.round(calculateProgress().directions)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300 ease-out"
                          style={{ width: `${calculateProgress().directions}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Navigation buttons in scrollable row */}
                  <div className="overflow-x-auto scrollbar-hide -mx-3">
                    <div className="flex space-x-2 min-w-max px-3">
                      <button
                        onClick={() => scrollToSection(ingredientsRef)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 whitespace-nowrap ${
                          activeSection === 'ingredients'
                            ? 'bg-black text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        Ingredients
                      </button>
                      <button
                        onClick={() => scrollToSection(directionsRef)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 whitespace-nowrap ${
                          activeSection === 'directions'
                            ? 'bg-black text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        Directions
                      </button>
                      <button
                        onClick={() => scrollToSection(notesRef)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 whitespace-nowrap ${
                          activeSection === 'notes'
                            ? 'bg-black text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        Notes
                      </button>
                      <button
                        onClick={() => scrollToSection(macroInfoRef)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 whitespace-nowrap ${
                          activeSection === 'macros'
                            ? 'bg-black text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        Nutrition
                      </button>
                      <button
                        onClick={() => scrollToSection(pairingsRef)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 whitespace-nowrap ${
                          activeSection === 'pairings'
                            ? 'bg-black text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        Pairings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Add the chat bubble with adjusted positioning and higher z-index */}
          <div className="relative mb-16 md:mb-8">
            <div className="fixed bottom-0 right-0 w-[25%] md:w-auto md:relative md:bottom-auto md:right-auto z-50">
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
          </div>

          {/* Disclaimer with Logo */}
          <div className="text-center mb-8 mt-24">
            <div className="flex justify-center mb-4">
              <Image
                src="/baba-removebg.png"
                alt="Baba Selo"
                width={128}
                height={128}
                className="opacity-100"
              />
            </div>
            <div className="text-gray-500 text-sm px-4">
              <p>⚠️ Please double-check all ingredients, measurements, and cooking steps, as even Baba Selo can make mistakes sometimes.</p>
              <p className="mt-2 mb-24">For food safety, always ensure proper cooking temperatures and handling of ingredients.</p>
            </div>
          </div>

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
