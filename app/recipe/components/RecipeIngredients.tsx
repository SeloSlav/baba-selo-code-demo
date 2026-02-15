"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faCheckCircle } from "@fortawesome/free-regular-svg-icons";
import { Recipe } from "../types";
import { RefObject } from "react";
import { LoadingSpinner } from "../../components/LoadingSpinner";

interface RecipeIngredientsProps {
  recipe: Recipe;
  checkedIngredients: boolean[];
  toggleIngredientCheck: (index: number) => void;
  ingredientsRef: RefObject<HTMLDivElement>;
  isUserAdmin?: boolean;
  loadingIngredientsDirections?: boolean;
  handleRegenerateIngredientsDirections?: () => void;
}

export const RecipeIngredients = ({
  recipe,
  checkedIngredients,
  toggleIngredientCheck,
  ingredientsRef,
  isUserAdmin,
  loadingIngredientsDirections,
  handleRegenerateIngredientsDirections,
}: RecipeIngredientsProps) => {
  return (
    <div ref={ingredientsRef} className="mb-6 scroll-mt-44 relative group">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-semibold">
          <span className="mr-2">📝</span>
          Ingredients
        </h3>
        {isUserAdmin && handleRegenerateIngredientsDirections && (
          <button
            onClick={handleRegenerateIngredientsDirections}
            disabled={loadingIngredientsDirections}
            className="opacity-0 group-hover:opacity-100 bg-white text-amber-800 px-2 py-1 text-xs rounded-md shadow-sm hover:bg-amber-50 border border-amber-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
          >
            {loadingIngredientsDirections ? (
              <div className="flex items-center">
                <LoadingSpinner className="mr-1 w-3 h-3" />
                <span>Regenerating...</span>
              </div>
            ) : (
              <>
                <span>🔄</span>
                <span className="ml-1">Regenerate ingredients & directions</span>
              </>
            )}
          </button>
        )}
      </div>
      <ul className="list-none pl-6 space-y-2">
        {recipe.ingredients.map((ingredient, index) => (
          <li
            key={index}
            className={`cursor-pointer flex items-center bg-amber-50 border border-amber-200 rounded-full px-3 py-2 transform transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md ${
              checkedIngredients[index]
                ? "bg-green-50 border-green-200 -translate-x-1"
                : "hover:border-amber-300"
            }`}
            onClick={() => toggleIngredientCheck(index)}
          >
            <FontAwesomeIcon
              icon={checkedIngredients[index] ? faCheckCircle : faCircle}
              className={`mr-3 transform transition-transform duration-300 ${
                checkedIngredients[index]
                  ? "text-green-500 scale-110"
                  : "text-amber-600/70 hover:scale-105"
              }`}
            />
            <span className={`transition-all duration-300 ${
              checkedIngredients[index]
                ? "line-through text-amber-700/60"
                : "text-gray-900"
            }`}>
              {ingredient}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}; 