import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark, faWineGlass, faAppleWhole, faUtensils, faGlobe, faClock, faGaugeHigh } from '@fortawesome/free-solid-svg-icons';
import { RecipeClassification } from './types';
import type { RecipeLink } from './types';
import { linkifyOliveOil, parseRecipe } from './messageUtils';
import { FilterTag } from './FilterTag';

interface RecipeMessageProps {
    content: string;
    messageRef: React.RefObject<HTMLDivElement> | null;
    classification: RecipeClassification | null;
    onSuggestionClick: (suggestion: string) => void;
    onAssistantResponse: (assistantMsg: string, recipeLinks?: RecipeLink[]) => void;
    setLoading: (loading: boolean) => void;
    handleSaveRecipe: (content: string, classification: RecipeClassification | null) => void;
}

export const RecipeMessage: React.FC<RecipeMessageProps> = ({
    content,
    messageRef,
    classification,
    onSuggestionClick,
    onAssistantResponse,
    setLoading,
    handleSaveRecipe
}) => {
    const { title: rawTitle, ingredients, directions } = parseRecipe(content);
    // Parse "Kajmak (Creamy dairy spread)" into title + subtitle
    const titleMatch = rawTitle.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    const title = titleMatch ? titleMatch[1].trim() : rawTitle;
    const subtitle = titleMatch ? titleMatch[2].trim() : null;
    let foundOliveOilInIngredients = false;
    let foundOliveOilInDirections = false;

    return (
        <div ref={messageRef} className="flex items-start w-full max-w-[min(100%,28rem)]">
            <div className="w-full bg-[#fef3c7] text-[#171717] rounded-2xl border border-amber-200/60 shadow-sm overflow-hidden">
                {/* Title block */}
                <div className="px-5 pt-5 pb-3">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{title}</h3>
                    {subtitle && (
                        <p className="text-sm text-amber-900/70 mt-0.5">{subtitle}</p>
                    )}
                </div>

                {/* Ingredients */}
                <div className="px-5 pb-3">
                    <div className="font-semibold text-gray-800 mb-1.5 text-sm">Ingredients</div>
                    <ul className="list-disc list-inside text-sm space-y-0.5 text-gray-700">
                        {ingredients.map((ing, i) => {
                            const lowerIng = ing.toLowerCase();
                            if (!foundOliveOilInIngredients && lowerIng.includes("olive oil")) {
                                foundOliveOilInIngredients = true;
                                return <li key={i}>{linkifyOliveOil(ing)}</li>;
                            }
                            return <li key={i}>{ing}</li>;
                        })}
                    </ul>
                </div>

                {/* Directions */}
                <div className="px-5 pb-4">
                    <div className="font-semibold text-gray-800 mb-1.5 text-sm">Directions</div>
                    <ol className="list-decimal list-inside text-sm space-y-1 text-gray-700">
                        {directions.map((dir, i) => {
                            const lowerDir = dir.toLowerCase();
                            if (!foundOliveOilInDirections && lowerDir.includes("olive oil")) {
                                foundOliveOilInDirections = true;
                                return <li key={i}>{linkifyOliveOil(dir)}</li>;
                            }
                            return <li key={i}>{dir}</li>;
                        })}
                    </ol>
                </div>

                {/* Tags */}
                {classification && (
                    <div className="px-5 pb-4">
                        <div className="flex flex-wrap gap-2">
                            {classification.diet && classification.diet.length > 0 && classification.diet.map((d) => (
                                <FilterTag
                                    key={d}
                                    type="diet"
                                    value={d}
                                    icon={<FontAwesomeIcon icon={faUtensils} className="w-3 h-3 mr-1.5 text-amber-700/80" />}
                                    className="flex items-center text-xs bg-white/90 border border-amber-200 rounded-full px-2.5 py-1 hover:bg-white transition-colors font-medium text-amber-900/90"
                                >
                                    {d.charAt(0).toUpperCase() + d.slice(1)}
                                </FilterTag>
                            ))}
                            {classification.cuisine && (
                                <FilterTag
                                    type="cuisine"
                                    value={classification.cuisine}
                                    icon={<FontAwesomeIcon icon={faGlobe} className="w-3 h-3 mr-1.5 text-amber-700/80" />}
                                    className="flex items-center text-xs bg-white/90 border border-amber-200 rounded-full px-2.5 py-1 hover:bg-white transition-colors font-medium text-amber-900/90"
                                >
                                    {classification.cuisine.charAt(0).toUpperCase() + classification.cuisine.slice(1)}
                                </FilterTag>
                            )}
                            {classification.cooking_time && (
                                <FilterTag
                                    type="time"
                                    value={classification.cooking_time}
                                    icon={<FontAwesomeIcon icon={faClock} className="w-3 h-3 mr-1.5 text-amber-700/80" />}
                                    className="flex items-center text-xs bg-white/90 border border-amber-200 rounded-full px-2.5 py-1 hover:bg-white transition-colors font-medium text-amber-900/90"
                                >
                                    {classification.cooking_time}
                                </FilterTag>
                            )}
                            {classification.difficulty && (
                                <FilterTag
                                    type="difficulty"
                                    value={classification.difficulty}
                                    icon={<FontAwesomeIcon icon={faGaugeHigh} className="w-3 h-3 mr-1.5 text-amber-700/80" />}
                                    className="flex items-center text-xs bg-white/90 border border-amber-200 rounded-full px-2.5 py-1 hover:bg-white transition-colors font-medium text-amber-900/90"
                                >
                                    {classification.difficulty.charAt(0).toUpperCase() + classification.difficulty.slice(1)}
                                </FilterTag>
                            )}
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="px-5 pb-5 pt-1 border-t border-amber-200/50">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                            onClick={() => handleSaveRecipe(content, classification)}
                        >
                            <FontAwesomeIcon icon={faBookmark} className="w-4 h-4" />
                            Save Recipe
                        </button>
                        <div className="flex gap-2 sm:gap-3">
                            <button
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white border border-amber-200 hover:bg-amber-50 text-amber-900 text-sm font-medium rounded-xl transition-colors"
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
                                            onAssistantResponse(
                                                data.suggestion || "No pairing suggestion available.",
                                                data.recipeLinks
                                            );
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
                                <FontAwesomeIcon icon={faWineGlass} className="w-4 h-4" />
                                <span>Pairing</span>
                            </button>
                            <button
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white border border-amber-200 hover:bg-amber-50 text-amber-900 text-sm font-medium rounded-xl transition-colors"
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
                                <FontAwesomeIcon icon={faAppleWhole} className="w-4 h-4" />
                                <span>Calories</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}; 