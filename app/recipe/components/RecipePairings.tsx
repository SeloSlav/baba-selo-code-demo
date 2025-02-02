"use client";

import { Recipe } from "../types";
import { RefObject } from "react";
import { LoadingSpinner } from "../../components/LoadingSpinner";

interface RecipePairingsProps {
  recipe: Recipe;
  isOwner: boolean;
  loadingPairings: boolean;
  pairingsRef: RefObject<HTMLDivElement>;
  handleGetPairings: () => void;
}

export const RecipePairings = ({
  recipe,
  isOwner,
  loadingPairings,
  pairingsRef,
  handleGetPairings,
}: RecipePairingsProps) => {
  return (
    <div ref={pairingsRef} className="mb-6">
      <h3 className="text-xl font-semibold mb-2">
        <span className="mr-2">🍷</span>
        Perfect Pairings
      </h3>
      <div className="relative group">
        {recipe.dishPairings ? (
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="whitespace-pre-wrap">{recipe.dishPairings}</div>
            {isOwner && (
              <button
                onClick={handleGetPairings}
                disabled={loadingPairings}
                className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 bg-white text-gray-600 px-2 py-1 text-xs rounded-md shadow-sm hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
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
          <div className="flex justify-left">
            <button
              onClick={handleGetPairings}
              disabled={loadingPairings}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
            >
              {loadingPairings ? (
                <div className="flex items-center">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Generating Suggestions...
                </div>
              ) : (
                'Get Pairing Suggestions 🥄✨'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 