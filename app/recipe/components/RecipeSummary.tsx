"use client";

import { Recipe } from "../types";
import { LoadingSpinner } from "../../components/LoadingSpinner";

interface RecipeSummaryProps {
  recipe: Recipe;
  isOwner: boolean;
  isUserAdmin?: boolean;
  loadingSummary: boolean;
  generateSummary: () => void;
}

export const RecipeSummary = ({
  recipe,
  isOwner,
  isUserAdmin,
  loadingSummary,
  generateSummary,
}: RecipeSummaryProps) => {
  const canRegenerate = isOwner || isUserAdmin;
  return (
    <div className="relative group mb-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start">
        <div className="w-full">
          {recipe.recipeSummary ? (
            <div className="relative">
              <div className="bg-white">
                <p className="text-[#767677] text-[0.875rem] md:text-[1.25rem] leading-[1.4] md:tracking-[-0.5px]">{recipe.recipeSummary}</p> 
                {canRegenerate && (
                  <button
                    onClick={generateSummary}
                    disabled={loadingSummary}
                    className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 bg-white text-gray-600 px-2 py-1 text-xs rounded-md shadow-sm hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
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
            </div>
          ) : (
            <div className="flex justify-left">
              {canRegenerate && (
              <button
                onClick={generateSummary}
                disabled={loadingSummary}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
              >
                {loadingSummary ? (
                  <div className="flex items-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Generating Summary...
                  </div>
                ) : (
                  'Generate Recipe Summary 🥄✨'
                )}
              </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 