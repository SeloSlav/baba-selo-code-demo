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

    useEffect(() => {
      if (recipe.imageURL) {
        try {
          new URL(recipe.imageURL);
        } catch (e) {
          setImageError(true);
        }
      }
    }, [recipe]);

    const handleImageError = () => {
      setImageError(true);
    };

    // Mobile Layout
    const MobileCard = () => (
      <div className="md:hidden relative h-48 rounded-xl overflow-hidden bg-gray-100">
        {/* Background Image or Gradient */}
        {recipe.imageURL && !imageError ? (
          <div className="absolute inset-0">
            <Image
              src={recipe.imageURL}
              alt={recipe.recipeTitle}
              fill
              className={`object-cover transition-opacity duration-300 ${
                isImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setIsImageLoading(false)}
              onError={handleImageError}
              placeholder="blur"
              blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(1920, 1080))}`}
              sizes="100vw"
              priority
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-yellow-200" />
        )}

        {/* Clickable Elements */}
        <div className="absolute inset-0">
          {/* Image Click Area - Top portion */}
          <Link href={`/recipe/${recipe.id}`} className="absolute top-0 left-0 right-0 h-3/4" />
          
          {/* Title and Menu Area - Bottom portion */}
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex justify-between items-center">
              <Link href={`/recipe/${recipe.id}`} className="block">
                <span className="text-lg font-bold text-white line-clamp-2 text-shadow">
                  {recipe.recipeTitle}
                </span>
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuToggle(recipe.id);
                }}
                className="text-white p-2"
              >
                <FontAwesomeIcon icon={faEllipsisH} />
              </button>
            </div>
          </div>
        </div>

        {/* Menu Popup */}
        {menuOpen === recipe.id && renderMenu(recipe.id, recipe.pinned, recipe.recipeTitle)}
      </div>
    );

    // Desktop Layout
    const DesktopCard = () => (
      <Link 
        href={`/recipe/${recipe.id}`}
        className="hidden md:block relative h-48 rounded-xl overflow-hidden group bg-gray-100"
      >
        {recipe.imageURL && !imageError ? (
          <Image
            src={recipe.imageURL}
            alt={recipe.recipeTitle}
            fill
            className={`object-cover transition-opacity duration-300 ${
              isImageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setIsImageLoading(false)}
            onError={handleImageError}
            placeholder="blur"
            blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(1920, 1080))}`}
            sizes="(max-width: 1200px) 50vw, 33vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-yellow-200 group-hover:from-yellow-200 group-hover:to-yellow-300" />
        )}

        {/* Overlay */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${
          recipe.imageURL ? "bg-black opacity-0 group-hover:opacity-50" : ""
        }`} />

        {/* Content */}
        <div className="absolute inset-0 p-4 flex items-end">
          <div className="flex justify-between items-center w-full">
            <span className={`line-clamp-2 text-lg font-bold ${
              recipe.imageURL ? "text-white text-shadow" : "text-gray-800"
            }`}>
              {recipe.recipeTitle}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMenuToggle(recipe.id);
              }}
              className={`ml-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                recipe.imageURL ? "text-white" : "text-gray-800"
              }`}
            >
              <FontAwesomeIcon icon={faEllipsisH} />
            </button>
          </div>
        </div>

        {menuOpen === recipe.id && renderMenu(recipe.id, recipe.pinned, recipe.recipeTitle)}
      </Link>
    );

    return (
      <>
        <MobileCard />
        <DesktopCard />
      </>
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
