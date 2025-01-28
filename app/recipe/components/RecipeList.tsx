"use client";

import { useEffect, useState, useRef } from 'react';
import { db } from '../../firebase/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import { faThumbtack } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { useDeleteRecipe } from '../../context/DeleteRecipeContext';
import Image from 'next/image';
import { Recipe } from '../types';

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

export const RecipeList = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pinnedRecipes, setPinnedRecipes] = useState<Recipe[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [loadingPinAction, setLoadingPinAction] = useState<string | null>(null);
  const { showDeletePopup } = useDeleteRecipe();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const recipesQuery = query(collection(db, "recipes"), orderBy("lastPinnedAt", "desc"));
      const recipeDocs = await getDocs(recipesQuery);
      
      const allRecipes = recipeDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Recipe[];

      // Separate pinned and unpinned recipes
      const pinned = allRecipes.filter(recipe => recipe.pinned);
      const unpinned = allRecipes.filter(recipe => !recipe.pinned);

      setPinnedRecipes(pinned);
      setRecipes(unpinned);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  };

  const handleMenuToggle = (id: string) => {
    setMenuOpen(menuOpen === id ? null : id);
  };

  const handlePinUnpin = async (id: string, isPinned: boolean) => {
    try {
      setLoadingPinAction(id);
      const recipeRef = doc(db, "recipes", id);
      await updateDoc(recipeRef, {
        pinned: !isPinned,
        lastPinnedAt: !isPinned ? new Date().toISOString() : null
      });
      setMenuOpen(null);
      fetchRecipes(); // Refresh the list
    } catch (error) {
      console.error("Error toggling pin: ", error);
    } finally {
      setLoadingPinAction(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    showDeletePopup(id, title, async () => {
      try {
        const recipeRef = doc(db, "recipes", id);
        await deleteDoc(recipeRef);
        fetchRecipes(); // Refresh the list
        setMenuOpen(null);
      } catch (error) {
        console.error("Error deleting recipe: ", error);
      }
    });
  };

  const renderMenu = (id: string, isPinned: boolean, recipeTitle: string) => {
    const isPinning = loadingPinAction === id;
    
    return (
      <div className="absolute right-0 z-40 bg-white rounded-xl shadow-lg w-48 border border-gray-200 p-2">
        <ul className="space-y-1">
          <li
            className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer disabled:opacity-50"
            onClick={() => !isPinning && handlePinUnpin(id, isPinned)}
          >
            {isPinning ? (
              <>
                <div className="w-4 h-4 mr-3">
                  <div className="w-full h-full border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <span>{isPinned ? 'Unpinning...' : 'Pinning...'}</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon
                  icon={faThumbtack}
                  className={`w-4 h-4 mr-3 ${isPinned ? "text-blue-500" : "text-gray-400"}`}
                />
                <span>{isPinned ? "Unpin recipe" : "Pin recipe"}</span>
              </>
            )}
          </li>
          <li
            className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer text-red-500"
            onClick={() => handleDelete(id, recipeTitle)}
          >
            <FontAwesomeIcon icon={faTrashAlt} className="w-4 h-4 mr-3" />
            <span>Delete recipe</span>
          </li>
        </ul>
      </div>
    );
  };

  const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
    const [imageError, setImageError] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(true);

    // Log image URL and validate it
    useEffect(() => {
      if (recipe.imageURL) {
        console.log(`Recipe ${recipe.recipeTitle} image URL:`, recipe.imageURL);
        // Check if URL is valid
        try {
          new URL(recipe.imageURL);
        } catch (e) {
          console.error(`Invalid URL for recipe ${recipe.recipeTitle}:`, recipe.imageURL);
          setImageError(true);
        }
      }
    }, [recipe]);

    const handleImageError = () => {
      console.error(`Failed to load image for recipe ${recipe.recipeTitle}:`, recipe.imageURL);
      setImageError(true);
    };

    return (
      <div
        key={recipe.id}
        className={`relative group rounded-xl overflow-hidden h-48 ${
          !recipe.imageURL || imageError ? "bg-gradient-to-br from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300" : ""
        }`}
        onMouseLeave={() => setMenuOpen(null)}
      >
        {/* Image with loading and error states */}
        {recipe.imageURL && !imageError ? (
          <div className="absolute inset-0">
            <Image
              src={recipe.imageURL}
              alt={recipe.recipeTitle}
              fill
              className={`object-cover transition-opacity duration-300 ${
                isImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => {
                console.log(`Image loaded successfully for recipe ${recipe.recipeTitle}`);
                setIsImageLoading(false);
              }}
              onError={handleImageError}
              placeholder="blur"
              blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(1920, 1080))}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
            {isImageLoading && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse" />
            )}
          </div>
        ) : null}

        {/* Hover overlay */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${
          recipe.imageURL && !imageError
            ? "bg-black opacity-0 group-hover:opacity-50"
            : "bg-black/0 group-hover:bg-black/10"
        }`} />

        {/* Content */}
        <Link href={`/recipe/${recipe.id}`} passHref>
          <div className="absolute inset-0 p-4 flex items-end">
            <div className={`flex justify-between items-center w-full ${
              recipe.imageURL && !imageError
                ? "text-white font-bold text-shadow [text-shadow:_0_2px_4px_rgb(0_0_0_/_0.8)]"
                : "text-gray-800"
            }`}>
              <span className="line-clamp-2 text-lg">{recipe.recipeTitle}</span>
              <FontAwesomeIcon
                icon={faEllipsisH}
                className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMenuToggle(recipe.id);
                }}
              />
            </div>
          </div>
        </Link>

        {/* Menu */}
        {menuOpen === recipe.id && renderMenu(recipe.id, recipe.pinned, recipe.recipeTitle)}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Pinned Recipes */}
      <div>
        <h2 className="text-gray-600 text-sm font-semibold pb-2 border-b">
          Pinned Recipes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {pinnedRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>

      {/* Recent Recipes */}
      <div>
        <h2 className="text-gray-600 text-sm font-semibold pb-2 border-b">
          Recently Saved Recipes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>
    </div>
  );
}; 
