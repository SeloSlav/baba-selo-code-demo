"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faThumbtack, faTrashCan, faHeart } from "@fortawesome/free-solid-svg-icons";
import { Recipe } from "../types";

interface RecipeHeaderProps {
  recipe: Recipe;
  isOwner: boolean;
  copySuccess: boolean;
  handleCopyRecipe: () => void;
  handlePinToggle: () => void;
  handleDelete: () => void;
  handleLike?: () => void;
  currentUser?: any;
  loadingPinAction?: boolean;
  loadingDeleteAction?: boolean;
}

export const RecipeHeader = ({
  recipe,
  isOwner,
  copySuccess,
  handleCopyRecipe,
  handlePinToggle,
  handleDelete,
  handleLike,
  currentUser,
  loadingPinAction,
  loadingDeleteAction,
}: RecipeHeaderProps) => {
  const hasLiked = recipe.likes?.includes(currentUser?.uid || '');

  return (
    <>
      {/* Recipe Classifications */}
      <div className="mb-6 flex flex-wrap gap-3">
        {recipe.diet.length > 0 && (
          <div className="flex items-center bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 text-sm">
            <span className="font-semibold mr-2">🍲</span>
            <span>{recipe.diet.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}</span>
          </div>
        )}
        {recipe.cuisineType && (
          <div className="flex items-center bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 text-sm">
            <span className="font-semibold mr-2">🍽️</span>
            <span>{recipe.cuisineType.charAt(0).toUpperCase() + recipe.cuisineType.slice(1)}</span>
          </div>
        )}
        {recipe.cookingTime && (
          <div className="flex items-center bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 text-sm">
            <span className="font-semibold mr-2">⏲️</span>
            <span>{recipe.cookingTime}</span>
          </div>
        )}
        {recipe.cookingDifficulty && (
          <div className="flex items-center bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 text-sm">
            <span className="font-semibold mr-2">🧩</span>
            <span>{recipe.cookingDifficulty.charAt(0).toUpperCase() + recipe.cookingDifficulty.slice(1)}</span>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-3 mb-8 items-center border-t border-b border-amber-100 py-4">
        <button
          onClick={handleCopyRecipe}
          className="flex items-center text-amber-900/80 hover:text-amber-900 transition-colors duration-200"
        >
          <FontAwesomeIcon icon={faCopy} className="w-5 h-5" />
          <span className="ml-2 text-sm">{copySuccess ? 'Link Copied!' : 'Share Recipe'}</span>
        </button>

        {/* Like button for all users */}
        <div className="w-px h-6 bg-amber-200" /> {/* Divider */}
        {handleLike && currentUser ? (
          <button
            onClick={handleLike}
            disabled={hasLiked}
            className={`flex items-center transition-colors duration-200 ${
              hasLiked ? 'text-red-500 cursor-default' : 'text-amber-900/80 hover:text-red-500'
            }`}
          >
            <FontAwesomeIcon icon={faHeart} className="w-5 h-5" />
            <span className="ml-2 text-sm">
              {hasLiked ? 'Liked' : 'Like Recipe'} {recipe.likes?.length ? `(${recipe.likes.length})` : ''}
            </span>
          </button>
        ) : (
          <div className={`flex items-center text-amber-800/70`}>
            <FontAwesomeIcon icon={faHeart} className="w-5 h-5" />
            <span className="ml-2 text-sm">
              {recipe.likes?.length || 0} {recipe.likes?.length === 1 ? 'Like' : 'Likes'}
            </span>
          </div>
        )}

        {isOwner && (
          <>
            <div className="w-px h-6 bg-amber-200" /> {/* Divider */}
            <button
              onClick={handlePinToggle}
              disabled={loadingPinAction}
              className={`flex items-center transition-colors duration-200 ${
                recipe.pinned ? 'text-amber-600 hover:text-amber-700' : 'text-amber-900/80 hover:text-amber-900'
              }`}
            >
              {loadingPinAction ? (
                <>
                  <div className="w-5 h-5">
                    <div className="w-full h-full border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <span className="ml-2 text-sm">{recipe.pinned ? 'Unpinning...' : 'Pinning...'}</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon 
                    icon={faThumbtack} 
                    className={`w-5 h-5 transform transition-all duration-300 ${
                      recipe.pinned ? 'rotate-[45deg] scale-110' : 'hover:scale-110'
                    }`}
                  />
                  <span className="ml-2 text-sm">{recipe.pinned ? 'Pinned' : 'Pin Recipe'}</span>
                </>
              )}
            </button>

            <div className="w-px h-6 bg-amber-200" /> {/* Divider */}
            <button
              onClick={handleDelete}
              disabled={loadingDeleteAction}
              className="flex items-center text-amber-900/80 hover:text-red-600 transition-colors duration-200"
            >
              {loadingDeleteAction ? (
                <>
                  <div className="w-5 h-5">
                    <div className="w-full h-full border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <span className="ml-2 text-sm">Deleting...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faTrashCan} className="w-5 h-5" />
                  <span className="ml-2 text-sm">Delete Recipe</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </>
  );
}; 