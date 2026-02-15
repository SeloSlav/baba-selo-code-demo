"use client";

import { Recipe } from "../types";
import { RefObject } from "react";
import { LoadingSpinner } from "../../components/LoadingSpinner";

interface RecipeMacrosProps {
  recipe: Recipe;
  isOwner: boolean;
  isUserAdmin?: boolean;
  loadingMacros: boolean;
  macroInfoRef: RefObject<HTMLDivElement>;
  handleMacroCalculation: () => void;
}

export const RecipeMacros = ({
  recipe,
  isOwner,
  isUserAdmin,
  loadingMacros,
  macroInfoRef,
  handleMacroCalculation,
}: RecipeMacrosProps) => {
  const canRegenerate = isOwner || isUserAdmin;
  return (
    <div ref={macroInfoRef} className="mb-6 scroll-mt-44">
      <h3 className="text-xl font-semibold mb-2">
        <span className="mr-2">📊</span>
        Calorie & Nutritional Info
      </h3>
      <div className="relative group">
        {recipe.macroInfo ? (
          <div className="bg-white border border-amber-100 rounded-lg p-4 shadow-sm">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-amber-900/90 mb-2">Total Recipe ({recipe.macroInfo.servings} servings)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <div className="text-sm text-amber-800/70">Calories</div>
                    <div className="font-semibold">{recipe.macroInfo.total.calories}</div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <div className="text-sm text-amber-800/70">Protein</div>
                    <div className="font-semibold">{recipe.macroInfo.total.proteins}g</div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <div className="text-sm text-amber-800/70">Carbs</div>
                    <div className="font-semibold">{recipe.macroInfo.total.carbs}g</div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <div className="text-sm text-amber-800/70">Fat</div>
                    <div className="font-semibold">{recipe.macroInfo.total.fats}g</div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-amber-900/90 mb-2">Per Serving</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <div className="text-sm text-amber-800/70">Calories</div>
                    <div className="font-semibold">{recipe.macroInfo.per_serving.calories}</div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <div className="text-sm text-amber-800/70">Protein</div>
                    <div className="font-semibold">{recipe.macroInfo.per_serving.proteins}g</div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <div className="text-sm text-amber-800/70">Carbs</div>
                    <div className="font-semibold">{recipe.macroInfo.per_serving.carbs}g</div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <div className="text-sm text-amber-800/70">Fat</div>
                    <div className="font-semibold">{recipe.macroInfo.per_serving.fats}g</div>
                  </div>
                </div>
              </div>
            </div>
            {canRegenerate && (
              <button
                onClick={handleMacroCalculation}
                disabled={loadingMacros}
                className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 bg-white text-amber-800 px-2 py-1 text-xs rounded-md shadow-sm hover:bg-amber-50 border border-amber-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
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
          <div className="flex justify-left">
            {canRegenerate && (
            <button
              onClick={handleMacroCalculation}
              disabled={loadingMacros}
              className="bg-amber-600 text-white px-4 py-2 rounded-xl shadow-lg hover:bg-amber-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
            >
              {loadingMacros ? (
                <div className="flex items-center">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Calculating...
                </div>
              ) : (
                'Calculate Nutrition Info 🥄✨'
              )}
            </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 