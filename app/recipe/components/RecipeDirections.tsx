"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faCheckCircle } from "@fortawesome/free-regular-svg-icons";
import { Recipe } from "../types";
import { RefObject } from "react";

interface RecipeDirectionsProps {
  recipe: Recipe;
  checkedDirections: boolean[];
  toggleDirectionCheck: (index: number) => void;
  directionsRef: RefObject<HTMLDivElement>;
}

export const RecipeDirections = ({
  recipe,
  checkedDirections,
  toggleDirectionCheck,
  directionsRef,
}: RecipeDirectionsProps) => {
  return (
    <div ref={directionsRef} className="mb-6 scroll-mt-44">
      <h3 className="text-xl font-semibold mb-2">
        <span className="mr-2">👩‍🍳</span>
        Directions
      </h3>
      <ul className="list-none pl-6 space-y-2">
        {recipe.directions.map((direction, index) => (
          <li
            key={index}
            className={`cursor-pointer flex items-center bg-amber-50 border border-amber-200 rounded-md px-3 py-2 transform transition-all duration-300 ease-in-out hover:scale-[1.01] hover:shadow-md ${
              checkedDirections[index]
                ? "bg-amber-100 border-amber-300 -translate-x-1"
                : "hover:border-amber-300"
            }`}
            onClick={() => toggleDirectionCheck(index)}
          >
            <div className="flex-shrink-0">
              <FontAwesomeIcon
                icon={checkedDirections[index] ? faCheckCircle : faCircle}
                className={`mr-3 transform transition-transform duration-300 ${
                  checkedDirections[index]
                    ? "text-amber-600 scale-110"
                    : "text-amber-600/70 hover:scale-105"
                }`}
              />
            </div>
            <span className={`transition-all duration-300 ${
              checkedDirections[index]
                ? "line-through text-amber-700/60"
                : "text-gray-900"
            }`}>
              {direction}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}; 