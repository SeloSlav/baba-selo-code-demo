"use client";

import { Recipe } from "../types";
import { LoadingSpinner } from "../../components/LoadingSpinner";

interface RecipeTitleProps {
  recipe: Recipe;
  isOwner: boolean;
  loadingTitle: boolean;
  handleGenerateTitle: () => void;
}

export const RecipeTitle = ({
  recipe,
  isOwner,
  loadingTitle,
  handleGenerateTitle,
}: RecipeTitleProps) => {
  return (
    <div className="relative group">
      <div className="flex justify-between items-start">
        <h1 className="text-[1.875rem] md:text-[3.125rem] mb-[0.75rem] leading-[1.07] tracking-[-0.5px] font-semibold text-[#333333]">{recipe.recipeTitle}</h1>
        {isOwner && (
          <button
            onClick={handleGenerateTitle}
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
  );
}; 