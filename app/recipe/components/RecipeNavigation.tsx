"use client";

import { RefObject } from "react";

interface RecipeNavigationProps {
  activeSection: string;
  ingredientsProgress: number;
  directionsProgress: number;
  scrollToSection: (ref: RefObject<HTMLDivElement>) => void;
  ingredientsRef: RefObject<HTMLDivElement>;
  directionsRef: RefObject<HTMLDivElement>;
  notesRef: RefObject<HTMLDivElement>;
  macroInfoRef: RefObject<HTMLDivElement>;
  pairingsRef: RefObject<HTMLDivElement>;
}

export const RecipeNavigation = ({
  activeSection,
  ingredientsProgress,
  directionsProgress,
  scrollToSection,
  ingredientsRef,
  directionsRef,
  notesRef,
  macroInfoRef,
  pairingsRef,
}: RecipeNavigationProps) => {
  return (
    <div className="md:sticky md:top-4 fixed bottom-0 left-0 right-0 md:relative z-30">
      {/* Desktop version */}
      <div className="hidden md:block bg-white/80 backdrop-blur-sm rounded-lg shadow-sm mb-6 transition-all duration-300 ease-in-out">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-4">
              <button
                onClick={() => scrollToSection(ingredientsRef)}
                className={`px-4 py-2 rounded-full transition-all duration-200 ${
                  activeSection === 'ingredients'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Ingredients
              </button>
              <button
                onClick={() => scrollToSection(directionsRef)}
                className={`px-4 py-2 rounded-full transition-all duration-200 ${
                  activeSection === 'directions'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Directions
              </button>
              <button
                onClick={() => scrollToSection(notesRef)}
                className={`px-4 py-2 rounded-full transition-all duration-200 ${
                  activeSection === 'notes'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => scrollToSection(macroInfoRef)}
                className={`px-4 py-2 rounded-full transition-all duration-200 ${
                  activeSection === 'macros'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Nutrition
              </button>
              <button
                onClick={() => scrollToSection(pairingsRef)}
                className={`px-4 py-2 rounded-full transition-all duration-200 ${
                  activeSection === 'pairings'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Pairings
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Ingredients</span>
                <span>{Math.round(ingredientsProgress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300 ease-out"
                  style={{ width: `${ingredientsProgress}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Steps</span>
                <span>{Math.round(directionsProgress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${directionsProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile version */}
      <div className="md:hidden bg-white shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.1)] rounded-t-xl w-[75%]">
        <div className="safe-area-inset-bottom">
          <div className="p-3">
            {/* Progress bars in a more compact format */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="w-full">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Ingredients: {Math.round(ingredientsProgress)}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300 ease-out"
                    style={{ width: `${ingredientsProgress}%` }}
                  />
                </div>
              </div>
              <div className="w-full">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Steps: {Math.round(directionsProgress)}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300 ease-out"
                    style={{ width: `${directionsProgress}%` }}
                  />
                </div>
              </div>
            </div>
            {/* Navigation buttons in scrollable row */}
            <div className="overflow-x-auto scrollbar-hide -mx-3">
              <div className="flex space-x-2 min-w-max px-3">
                <button
                  onClick={() => scrollToSection(ingredientsRef)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 whitespace-nowrap ${
                    activeSection === 'ingredients'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Ingredients
                </button>
                <button
                  onClick={() => scrollToSection(directionsRef)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 whitespace-nowrap ${
                    activeSection === 'directions'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Directions
                </button>
                <button
                  onClick={() => scrollToSection(notesRef)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 whitespace-nowrap ${
                    activeSection === 'notes'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Notes
                </button>
                <button
                  onClick={() => scrollToSection(macroInfoRef)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 whitespace-nowrap ${
                    activeSection === 'macros'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Nutrition
                </button>
                <button
                  onClick={() => scrollToSection(pairingsRef)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 whitespace-nowrap ${
                    activeSection === 'pairings'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Pairings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 