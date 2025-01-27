import React from 'react';
import { RecipeClassification } from './types';
import { linkifyOliveOil } from './messageUtils';

interface RecipeMessageProps {
    content: string;
    messageRef: React.RefObject<HTMLDivElement> | null;
    classification: RecipeClassification | null;
    onSuggestionClick: (suggestion: string) => void;
    onAssistantResponse: (assistantMsg: string) => void;
    setLoading: (loading: boolean) => void;
    handleSaveRecipe: (content: string, classification: RecipeClassification | null) => void;
}

const parseRecipe = (text: string) => {
    const lines = text.split("\n").map(line => line.trim()).filter(line => line !== "");
    const ingredientsIndex = lines.findIndex(line => line.toLowerCase() === "ingredients");
    const directionsIndex = lines.findIndex(line => line.toLowerCase() === "directions");

    if (ingredientsIndex === -1 || directionsIndex === -1) {
        return { title: text, ingredients: [], directions: [] };
    }

    const title = lines[0];
    const ingredients = lines.slice(ingredientsIndex + 1, directionsIndex).map(ing => ing.replace(/^-+\s*/, ''));
    const directions = lines.slice(directionsIndex + 1).map(dir => dir.replace(/^([0-9]+\.\s*)+/, '').replace(/^-+\s*/, ''));

    return { title, ingredients, directions };
};

export const RecipeMessage: React.FC<RecipeMessageProps> = ({
    content,
    messageRef,
    classification,
    onSuggestionClick,
    onAssistantResponse,
    setLoading,
    handleSaveRecipe
}) => {
    const { title, ingredients, directions } = parseRecipe(content);
    let foundOliveOilInIngredients = false;
    let foundOliveOilInDirections = false;

    return (
        <div ref={messageRef} className="flex items-start space-x-2">
            <div className="bg-[#F3F3F3] text-[#0d0d0d] px-5 py-2.5 rounded-3xl">
                <div className="text-xl mb-2">{title}</div>

                <div className="font-semibold mb-1">Ingredients</div>
                <ul className="list-disc list-inside mb-3">
                    {ingredients.map((ing, i) => {
                        const lowerIng = ing.toLowerCase();
                        if (!foundOliveOilInIngredients && lowerIng.includes("olive oil")) {
                            foundOliveOilInIngredients = true;
                            return <li key={i}>{linkifyOliveOil(ing)}</li>;
                        }
                        return <li key={i}>{ing}</li>;
                    })}
                </ul>

                <div className="font-semibold mb-1">Directions</div>
                <ol className="list-decimal list-inside mb-3">
                    {directions.map((dir, i) => {
                        const lowerDir = dir.toLowerCase();
                        if (!foundOliveOilInDirections && lowerDir.includes("olive oil")) {
                            foundOliveOilInDirections = true;
                            return <li key={i}>{linkifyOliveOil(dir)}</li>;
                        }
                        return <li key={i}>{dir}</li>;
                    })}
                </ol>

                {classification && (
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        {classification.diet && classification.diet.length > 0 && (
                            <div className="flex items-center bg-white border border-gray-300 shadow-sm rounded-full px-3 py-1">
                                <span className="font-semibold mr-1">🍲</span>
                                <span>
                                    {classification.diet
                                        .map(d => d.charAt(0).toUpperCase() + d.slice(1))
                                        .join(", ")}
                                </span>
                            </div>
                        )}
                        {classification.cuisine && (
                            <div className="flex items-center bg-white border border-gray-300 shadow-sm rounded-full px-3 py-1">
                                <span className="font-semibold mr-1">🍽️</span>
                                <span>
                                    {classification.cuisine.charAt(0).toUpperCase() +
                                        classification.cuisine.slice(1)}
                                </span>
                            </div>
                        )}
                        {classification.cooking_time && (
                            <div className="flex items-center bg-white border border-gray-300 shadow-sm rounded-full px-3 py-1">
                                <span className="font-semibold mr-1">⏲️</span>
                                <span>{classification.cooking_time}</span>
                            </div>
                        )}
                        {classification.difficulty && (
                            <div className="flex items-center bg-white border border-gray-300 shadow-sm rounded-full px-3 py-1">
                                <span className="font-semibold mr-1">🧩</span>
                                <span>
                                    {classification.difficulty.charAt(0).toUpperCase() +
                                        classification.difficulty.slice(1)}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 mt-3">
                    <button
                        className="p-2 bg-black rounded-md hover:bg-gray-600 text-white"
                        onClick={() => handleSaveRecipe(content, classification)}
                    >
                        📝 Save Recipe
                    </button>
                    <button
                        className="p-2 bg-blue-50 rounded-md hover:bg-blue-100 text-black"
                        onClick={async () => {
                            setLoading(true);
                            try {
                                const response = await fetch("/api/dishPairing", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ recipe: content }),
                                });
                                if (response.ok) {
                                    const data = await response.json();
                                    onAssistantResponse(data.suggestion || "No pairing suggestion available.");
                                } else {
                                    onAssistantResponse("Failed to fetch dish pairing.");
                                }
                            } catch (error) {
                                console.error("Error fetching dish pairing:", error);
                                onAssistantResponse("Error: Unable to fetch dish pairing.");
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        🍷 Get Dish Pairing
                    </button>
                    <button
                        className="p-2 bg-blue-50 rounded-md hover:bg-blue-100 text-black"
                        onClick={async () => {
                            setLoading(true);
                            try {
                                const response = await fetch("/api/macroInfo", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ recipe: content }),
                                });
                                if (response.ok) {
                                    const data = await response.json();
                                    onAssistantResponse(data.macros || "No macro info available.");
                                } else {
                                    onAssistantResponse("Failed to fetch calorie/macro info.");
                                }
                            } catch (error) {
                                console.error("Error fetching calorie/macro info:", error);
                                onAssistantResponse("Error: Unable to fetch calorie/macro info.");
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        🍎 Get Nutritional Info
                    </button>
                </div>
            </div>
        </div>
    );
}; 