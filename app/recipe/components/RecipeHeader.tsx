"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faThumbtack, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { Recipe } from "../types";

interface RecipeHeaderProps {
  recipe: Recipe;
  isOwner: boolean;
  copySuccess: boolean;
  handleCopyRecipe: () => void;
  handlePinToggle: () => void;
  handleDelete: () => void;
}

export const RecipeHeader = ({
  recipe,
  isOwner,
  copySuccess,
  handleCopyRecipe,
  handlePinToggle,
  handleDelete,
}: RecipeHeaderProps) => {
  return (
    <>
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

      {/* Action Bar */}
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
    </>
  );
}; 