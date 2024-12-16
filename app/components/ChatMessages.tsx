"use client";

import React, { useEffect, useState, useRef } from "react";
import { getAuth } from "firebase/auth"; // Import Firebase auth to get current user

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface RecipeClassification {
    diet: string[];
    cuisine: string;
    cooking_time: string;
    difficulty: string;
}

interface ChatMessagesProps {
    messages: Message[];
    loading: boolean;
    setLoading: (isLoading: boolean) => void;
    onSuggestionClick: (suggestion: string) => void; // To handle user suggestions
    onAssistantResponse: (assistantMsg: string) => void; // To add assistant messages
}

function linkifyOliveOil(text: string): React.ReactNode {
    const target = "olive oil";
    const lower = text.toLowerCase();
    const index = lower.indexOf(target);
    if (index === -1) return text;

    return (
        <>
            {text.substring(0, index)}
            <a
                href="https://seloolive.com/products/authentic-croatian-olive-oil?variant=40790542549035"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
            >
                {text.substring(index, index + target.length)}
            </a>
            {text.substring(index + target.length)}
        </>
    );
}

// Function to linkify only the last instance of "Selo olive oil"
function linkifyLastSelo(text: string): React.ReactNode {
    const target = "selo olive oil";
    const lower = text.toLowerCase();
    const lastIndex = lower.lastIndexOf(target);

    if (lastIndex === -1) return text;

    return (
        <>
            {text.substring(0, lastIndex)}
            <a
                href="https://seloolive.com/products/authentic-croatian-olive-oil?variant=40790542549035"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
            >
                {text.substring(lastIndex, lastIndex + target.length)}
            </a>
            {text.substring(lastIndex + target.length)}
        </>
    );
}

// Add the renderNutritionInfo helper function here
const renderNutritionInfo = (macros: any) => {
    if (!macros || !macros.total || !macros.per_serving) {
        return <div>No macro information available.</div>;
    }

    return (
        <div className="p-4 bg-gray-50 rounded-lg shadow border border-gray-300">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Nutritional Breakdown</h3>

            {/* Total Recipe */}
            <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Total Recipe</h4>
                <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex justify-between">
                        <span>Calories:</span>
                        <span className="font-medium">{macros.total.calories} kcal</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Proteins:</span>
                        <span className="font-medium">{macros.total.proteins} g</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Carbohydrates:</span>
                        <span className="font-medium">{macros.total.carbs} g</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Fats:</span>
                        <span className="font-medium">{macros.total.fats} g</span>
                    </p>
                </div>
            </div>

            {/* Per Serving */}
            <div>
                <h4 className="text-md font-semibold text-gray-700 mb-2">Per Serving</h4>
                <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex justify-between">
                        <span>Calories:</span>
                        <span className="font-medium">{macros.per_serving.calories} kcal</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Proteins:</span>
                        <span className="font-medium">{macros.per_serving.proteins} g</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Carbohydrates:</span>
                        <span className="font-medium">{macros.per_serving.carbs} g</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Fats:</span>
                        <span className="font-medium">{macros.per_serving.fats} g</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, loading, setLoading, onSuggestionClick, onAssistantResponse }) => {
    const [recipeClassification, setRecipeClassification] = useState<Record<number, RecipeClassification | null>>({});
    const bottomRef = useRef<HTMLDivElement | null>(null); // Reference for scrolling
    const [userId, setUserId] = useState<string>(""); // To hold the current user ID from Firebase

    useEffect(() => {
        // Fetch the current user from Firebase Auth
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
            setUserId(user.uid); // Set userId from Firebase Auth
        }
    }, []);

    const isRecipe = (text: any) => {
        return (
            typeof text === "string" &&
            text.toLowerCase().includes("ingredients") &&
            text.toLowerCase().includes("directions")
        );
    };

    // Render a discount button if the message is about Selo olive oil
    const renderDiscountButton = () => (
        <div className="mt-3">
            <a
                href="https://seloolive.com/discount/BABASELO10?redirect=/products/authentic-croatian-olive-oil?variant=40790542549035"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600"
            >
                🌿 Click for a 10% Discount on Selo Olive Oil
            </a>
        </div>
    );

    // Function to check if the message mentions Selo olive oil
    const isAboutSeloOliveOil = (text: string): boolean => {
        return text.toLowerCase().includes("selo olive oil");
    };

    const handleSaveRecipe = async (msg: string, classification: RecipeClassification | null) => {
        // Save recipe and then scroll to the bottom
        // Scroll to the bottom
        setLoading(true); // Start loading
        // if (bottomRef.current) {
        //     bottomRef.current.scrollIntoView({ behavior: "smooth" });
        // }

        try {
            const { title, ingredients, directions } = parseRecipe(msg);  // Parse the title from the message

            // Save the recipe
            const response = await fetch("/api/saveRecipe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    recipeContent: msg,
                    userId,
                    cuisineType: classification?.cuisine || "Croatian",
                    cookingDifficulty: classification?.difficulty || "Medium",
                    cookingTime: classification?.cooking_time || "2 hours",
                    diet: classification?.diet || ["gluten-free", "paleo"],
                }),
            });

            if (response.ok) {
                const data = await response.json();

                // Append a new message with the recipe title
                onAssistantResponse(`Your ${title} recipe has been tucked away in the kitchen vault, ready for use!`);

            } else {
                const errorData = await response.json();
                console.error("Failed to save recipe:", errorData.error);
            }
        } catch (error) {
            console.error("Error saving recipe:", error);
        } finally {
            setLoading(false); // Stop loading
        }
    };

    const isCalorieInfo = (data: any) => {
        return (
            typeof data === "object" &&
            data.total &&
            data.per_serving &&
            typeof data.total.calories === "number" &&
            typeof data.per_serving.calories === "number"
        );
    };

    // Function to check if the message is about Selo olive oil
    const isSelo = (text: string): boolean => {
        return text.toLowerCase().includes("selo olive oil");
    };

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

    useEffect(() => {
        const lastAssistantIndex = messages
            .map((m, i) => (m.role === "assistant" ? i : -1))
            .filter(i => i !== -1)
            .pop();

        if (lastAssistantIndex !== undefined && lastAssistantIndex !== -1) {
            const msg = messages[lastAssistantIndex];
            if (isRecipe(msg.content)) {
                (async () => {
                    try {
                        const response = await fetch("/api/classifyRecipe", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ message: msg.content }),
                        });
                        if (response.ok) {
                            const data = await response.json();
                            setRecipeClassification(prev => ({ ...prev, [lastAssistantIndex]: data }));
                        } else {
                            setRecipeClassification(prev => ({ ...prev, [lastAssistantIndex]: null }));
                        }
                    } catch {
                        setRecipeClassification(prev => ({ ...prev, [lastAssistantIndex]: null }));
                    }
                })();
            }
        }
    }, [messages]);

    useEffect(() => {
        // Scroll to the bottom when messages change
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const [firstMessage, ...restMessages] = messages;

    function renderMarkdown(text: string): React.ReactNode {
        // Split by bold markers
        const parts = text.split(/(\*\*.*?\*\*)/);

        return parts.map((part, index) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                // Remove ** and trim spaces inside the bolded content
                const trimmedPart = part.slice(2, -2).trim();

                const nextPart = parts[index + 1] || "";
                const endsWithPunctuation = nextPart.startsWith(".") || nextPart.startsWith(",") || nextPart.startsWith("!");

                return (
                    <React.Fragment key={index}>
                        {/* Add a space only if the preceding part doesn't end with a space */}
                        {index > 0 && !parts[index - 1].endsWith(" ") && " "}
                        <strong className="font-semibold">{trimmedPart}</strong>
                        {/* Add a space only if the following part doesn't start with a space or punctuation */}
                        {index < parts.length - 1 && !endsWithPunctuation && !nextPart.startsWith(" ") && " "}
                    </React.Fragment>
                );
            }
            // Return non-bold parts unchanged
            return part;
        });
    }

    useEffect(() => {
        const lastAssistantIndex = messages
            .map((m, i) => (m.role === "assistant" ? i : -1))
            .filter(i => i !== -1)
            .pop();

        if (lastAssistantIndex !== undefined && lastAssistantIndex !== -1) {
            const msg = messages[lastAssistantIndex];
            if (isRecipe(msg.content)) {
                (async () => {
                    try {
                        const response = await fetch("/api/classifyRecipe", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ message: msg.content }),
                        });
                        if (response.ok) {
                            const data = await response.json();
                            setRecipeClassification(prev => ({ ...prev, [lastAssistantIndex]: data }));
                        } else {
                            setRecipeClassification(prev => ({ ...prev, [lastAssistantIndex]: null }));
                        }
                    } catch {
                        setRecipeClassification(prev => ({ ...prev, [lastAssistantIndex]: null }));
                    }
                })();
            }
        }
    }, [messages]);

    const suggestions = [
        "Make me a random Balkan recipe",
        "Give me a recipe for breakfast",
        "Give me a recipe for lunch",
        "Give me a recipe for dinner",
        "Tell me a brief story about your village",
        "Tell me about SELO olive oil"
    ];

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">

            {/* Suggestion Buttons shown only once, after the first assistant message */}
            {firstMessage && firstMessage.role === "assistant" && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {suggestions.map((suggestion, i) => {
                        let emoji = "";
                        if (suggestion.toLowerCase().includes("random balkan")) emoji = "🌍";
                        else if (suggestion.toLowerCase().includes("breakfast")) emoji = "🍳";
                        else if (suggestion.toLowerCase().includes("lunch")) emoji = "🥪";
                        else if (suggestion.toLowerCase().includes("dinner")) emoji = "🍽️";
                        else if (suggestion.toLowerCase().includes("story")) emoji = "📜";
                        else if (suggestion.toLowerCase().includes("olive")) emoji = "🌿";

                        return (
                            <button
                                key={i}
                                onClick={() => onSuggestionClick(suggestion)}
                                className="p-2 bg-blue-50 rounded-md hover:bg-blue-100 text-black"
                            >
                                {emoji} {suggestion}
                            </button>
                        );
                    })}
                </div>
            )}

            {restMessages.map((msg, index) => {
                const actualIndex = index + 1;

                if (msg.role === "assistant" && isCalorieInfo(msg.content)) {
                    // Pass raw API response to renderNutritionInfo
                    return (
                        <div key={actualIndex} className="flex items-start space-x-2">
                            {renderNutritionInfo(msg.content)}
                        </div>
                    );
                }

                if (msg.role === "assistant" && isAboutSeloOliveOil(msg.content)) {
                    return (
                        <div key={actualIndex} className="flex items-start space-x-2">
                            <div className="bg-[#F3F3F3] text-[#0d0d0d] px-5 py-2.5 rounded-3xl">
                                {renderMarkdown(msg.content)} {/* Render content */}
                                {renderDiscountButton()} {/* Render the discount button */}
                            </div>
                        </div>
                    );
                }

                if (msg.role === "assistant") {
                    if (isSelo(msg.content)) {
                        return (
                            <div key={actualIndex} className="flex items-start space-x-2">
                                <div className="bg-[#F3F3F3] text-[#0d0d0d] px-5 py-2.5 rounded-3xl">
                                    {linkifyLastSelo(msg.content)} {/* Linkify only the last instance */}
                                </div>
                            </div>
                        );
                    }
                    if (isRecipe(msg.content)) {
                        const { title, ingredients, directions } = parseRecipe(msg.content);
                        const classification = recipeClassification[actualIndex];

                        let foundOliveOilInIngredients = false;
                        let foundOliveOilInDirections = false;

                        return (
                            <div key={actualIndex} className="flex items-start space-x-2">
                                <div className="bg-[#F3F3F3] text-[#0d0d0d] px-5 py-2.5 rounded-3xl">
                                    <div className="text-xl mb-2">{title}</div>

                                    <div className="font-semibold mb-1">Ingredients</div>
                                    <ul className="list-disc list-inside mb-3">
                                        {ingredients.map((ing, i) => {
                                            const lowerIng = ing.toLowerCase();
                                            if (!foundOliveOilInIngredients && lowerIng.includes("olive oil")) {
                                                foundOliveOilInIngredients = true;
                                                return <li key={i}>{linkifyOliveOil(ing)}</li>;
                                            } else {
                                                return <li key={i}>{ing}</li>;
                                            }
                                        })}
                                    </ul>

                                    <div className="font-semibold mb-1">Directions</div>
                                    <ol className="list-decimal list-inside mb-3">
                                        {directions.map((dir, i) => {
                                            const lowerDir = dir.toLowerCase();
                                            if (!foundOliveOilInDirections && lowerDir.includes("olive oil")) {
                                                foundOliveOilInDirections = true;
                                                return <li key={i}>{linkifyOliveOil(dir)}</li>;
                                            } else {
                                                return <li key={i}>{dir}</li>;
                                            }
                                        })}
                                    </ol>

                                    {classification && (
                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                            {classification.diet && classification.diet.length > 0 && (
                                                <div className="flex items-center bg-white border border-gray-300 shadow-sm rounded-full px-3 py-1">
                                                    <span className="font-semibold mr-1">🍲</span>
                                                    <span>{classification.diet.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}</span>
                                                </div>
                                            )}
                                            {classification.cuisine && (
                                                <div className="flex items-center bg-white border border-gray-300 shadow-sm rounded-full px-3 py-1">
                                                    <span className="font-semibold mr-1">🍽️</span>
                                                    <span>{classification.cuisine.charAt(0).toUpperCase() + classification.cuisine.slice(1)}</span>
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
                                                    <span>{classification.difficulty.charAt(0).toUpperCase() + classification.difficulty.slice(1)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}


                                    {/* Row of action buttons */}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <button
                                            className="p-2 bg-black rounded-md hover:bg-gray-600 text-white"
                                            onClick={() => handleSaveRecipe(msg.content, classification)} // Call handleSave
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
                                                        body: JSON.stringify({ recipe: msg.content }),
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
                                                    setLoading(false); // Ensure loading is stopped no matter what happens
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
                                                        body: JSON.stringify({ recipe: msg.content }),
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
                                                    setLoading(false); // Ensure loading is stopped no matter what happens
                                                }
                                            }}
                                        >
                                            🍎 Get Calorie/Macro Info
                                        </button>
                                    </div>

                                </div>
                            </div>
                        );
                    } else {
                        return (
                            <div key={actualIndex} className="flex items-start space-x-2">
                                <div className="bg-[#F3F3F3] text-[#0d0d0d] px-5 py-2.5 rounded-3xl">
                                    {renderMarkdown(msg.content)} {/* Use the Markdown renderer */}
                                </div>
                            </div>
                        );
                    }
                } else {
                    return (
                        <div key={actualIndex} className="flex justify-end">
                            <div className="bg-[#0284FE] text-white px-5 py-2.5 rounded-3xl max-w-xs whitespace-pre-line">
                                {msg.content}
                            </div>
                        </div>
                    );
                }
            })}

            {loading && (
                <div className="flex items-start space-x-2">
                    <div className="typing-indicator flex space-x-2 mt-4">
                        <div className="dot bg-gray-400 rounded-full w-2 h-2"></div>
                        <div className="dot bg-gray-400 rounded-full w-2 h-2"></div>
                        <div className="dot bg-gray-400 rounded-full w-2 h-2"></div>
                    </div>
                </div>
            )}
            <div ref={bottomRef}></div>
        </div>
    );
};
