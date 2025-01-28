"use client";

import { Recipe } from "../types";
import { LoadingSpinner } from "../../components/LoadingSpinner";

interface RecipeSummaryProps {
  recipe: Recipe;
  isOwner: boolean;
  loadingSummary: boolean;
  generateSummary: () => void;
}

export const RecipeSummary = ({
  recipe,
  isOwner,
  loadingSummary,
  generateSummary,
}: RecipeSummaryProps) => {
  return (
    <div className="relative group mb-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start">
        <div className="w-full">
          {recipe.recipeSummary ? (
            <div className="relative">
              <div className="bg-white">
                <p className="text-gray-600 text-lg leading-relaxed">{recipe.recipeSummary}</p>
                {isOwner && (
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
            <div className="flex justify-center">
              <button
                onClick={generateSummary}
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
  );
}; 