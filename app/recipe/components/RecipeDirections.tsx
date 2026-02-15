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
            className={`cursor-pointer flex items-center bg-gray-100 border border-gray-300 rounded-md px-3 py-2 transform transition-all duration-300 ease-in-out hover:scale-[1.01] hover:shadow-md ${
              checkedDirections[index]
                ? "bg-blue-50 border-blue-200 -translate-x-1"
                : "hover:border-gray-400"
            }`}
            onClick={() => toggleDirectionCheck(index)}
          >
            <div className="flex-shrink-0">
              <FontAwesomeIcon
                icon={checkedDirections[index] ? faCheckCircle : faCircle}
                className={`mr-3 transform transition-transform duration-300 ${
                  checkedDirections[index]
                    ? "text-blue-500 scale-110"
                    : "text-gray-400 hover:scale-105"
                }`}
              />
            </div>
            <span className={`transition-all duration-300 ${
              checkedDirections[index]
                ? "line-through text-gray-400"
                : "text-gray-700"
            }`}>
              {direction}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}; 