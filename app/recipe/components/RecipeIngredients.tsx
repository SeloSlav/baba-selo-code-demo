"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faCheckCircle } from "@fortawesome/free-regular-svg-icons";
import { Recipe } from "../types";
import { RefObject } from "react";

interface RecipeIngredientsProps {
  recipe: Recipe;
  checkedIngredients: boolean[];
  toggleIngredientCheck: (index: number) => void;
  ingredientsRef: RefObject<HTMLDivElement>;
}

export const RecipeIngredients = ({
  recipe,
  checkedIngredients,
  toggleIngredientCheck,
  ingredientsRef,
}: RecipeIngredientsProps) => {
  return (
    <div ref={ingredientsRef} className="mb-6 scroll-mt-44">
      <h3 className="text-xl font-semibold mb-2">
        <span className="mr-2">📝</span>
        Ingredients
      </h3>
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