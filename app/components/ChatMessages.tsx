"use client";

import React, { useEffect, useState, useRef } from "react";
import { getAuth } from "firebase/auth"; // Import Firebase auth to get current user
import { LoadingSpinner } from "./LoadingSpinner";
import { MessageRenderer } from "./MessageRenderer";
import { Message, RecipeClassification } from "./types";
import { parseRecipe, isRecipe } from "./messageUtils";
import { SpoonPointSystem } from "../lib/spoonPoints";
import { usePoints } from '../context/PointsContext';

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

// Add this helper function to handle dish pairing links
const renderDishPairingLinks = (text: string, onSuggestionClick: (suggestion: string) => void): React.ReactNode => {
    // Regular expression to match text between ** or __
    const boldRegex = /[*_]{2}(.*?)[*_]{2}/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        // Add the linked bold text
        const boldText = match[1];
        parts.push(
            <button
                key={match.index}
                onClick={() => onSuggestionClick(`Give me a recipe for ${boldText}`)}
                className="font-bold text-blue-600 hover:underline cursor-pointer"
            >
                {boldText}
            </button>
        );

        lastIndex = match.index + match[0].length;
    }

    // Add any remaining text
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return <>{parts}</>;
};

// Function to extract and format food items
const formatDishPairings = async (text: string): Promise<string> => {
    try {
        const response = await fetch('/api/extractFoodItems', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (!response.ok) throw new Error('Failed to extract food items');
        
        const data = await response.json();
        
        // Check if items exists in the response
        if (!data || !Array.isArray(data.items)) {
            console.warn('Invalid response format from API:', data);
            return text;
        }
        
        // Sort items by length (longest first) to handle overlapping matches
        const sortedItems = data.items.sort((a, b) => b.length - a.length);
        
        // Replace each food item with its bold version, using word boundaries
        let formattedText = text;
        sortedItems.forEach(item => {
            if (typeof item === 'string') {
                const regex = new RegExp(`\\b${item}\\b`, 'gi');
                formattedText = formattedText.replace(regex, `**${item}**`);
            }
        });
        
        return formattedText;
    } catch (error) {
        console.error('Error formatting dish pairings:', error);
        return text;
    }
};

// Function to create a simple hash of the recipe content
const createRecipeHash = (content: string): string => {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36); // Convert to base36 for shorter hash
};

export const ChatMessages: React.FC<ChatMessagesProps> = ({
    messages,
    loading,
    setLoading,
    onSuggestionClick,
    onAssistantResponse
}) => {
    const [recipeClassification, setRecipeClassification] = useState<Record<number, RecipeClassification | null>>({});
    const [formattedPairings, setFormattedPairings] = useState<Record<number, string>>({});
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [userId, setUserId] = useState<string>("");
    const lastAssistantRef = useRef<HTMLDivElement | null>(null);
    const { showPointsToast } = usePoints();

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
            setUserId(user.uid);
        }
    }, []);

    useEffect(() => {
        if (lastAssistantRef.current) {
            lastAssistantRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [messages]);

    const handleSaveRecipe = async (msg: string, classification: RecipeClassification | null) => {
        setLoading(true);

        try {
            const { title } = parseRecipe(msg);
            const docId = userId + "-" + Date.now();
            const recipeHash = createRecipeHash(msg);

            const response = await fetch("/api/saveRecipe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipeContent: msg,
                    userId,
                    cuisineType: classification?.cuisine || "Croatian",
                    cookingDifficulty: classification?.difficulty || "Medium",
                    cookingTime: classification?.cooking_time || "2 hours",
                    diet: classification?.diet || ["gluten-free", "paleo"],
                    docId,
                    recipeHash,
                }),
            });

            if (response.ok) {
                // Award spoon points for saving the recipe
                const pointsResult = await SpoonPointSystem.awardPoints(
                    userId,
                    'SAVE_RECIPE',
                    docId // Use docId instead of recipeHash
                );

                let message = `Your <a href="/recipe/${docId}" target="_blank" rel="noopener noreferrer" class="underline text-blue-600"> ${title}</a> recipe has been tucked away in the kitchen vault, ready for use!`;
                
                if (pointsResult.success) {
                    showPointsToast(pointsResult.points!, 'Recipe saved successfully!');
                    message += ` You earned ${pointsResult.points} spoons! 🥄✨ Click your recipe to add mouthwatering photos, discover perfect pairings, and unlock more rewards!`;
                } else if (pointsResult.error) {
                    // Optionally show why points weren't awarded
                    console.log('Points not awarded:', pointsResult.error);
                }

                onAssistantResponse(message);
            } else {
                const errorData = await response.json();
                console.error("Failed to save recipe:", errorData.error);
                onAssistantResponse("Sorry, something went wrong saving the recipe.");
            }
        } catch (error) {
            console.error("Error saving recipe:", error);
            onAssistantResponse("Sorry, something went wrong saving the recipe.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleNewRecipe = async (msg: Message, lastAssistantIndex: number) => {
            try {
                const recipeHash = createRecipeHash(msg.content);

                // Classify recipe
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
            } catch (error) {
                console.error("Error handling new recipe:", error);
                setRecipeClassification(prev => ({ ...prev, [lastAssistantIndex]: null }));
            }
        };

        const lastAssistantIndex = messages
            .map((m, i) => (m.role === "assistant" ? i : -1))
            .filter(i => i !== -1)
            .pop();

        if (lastAssistantIndex !== undefined && lastAssistantIndex !== -1) {
            const msg = messages[lastAssistantIndex];
            if (isRecipe(msg.content)) {
                handleNewRecipe(msg, lastAssistantIndex);
            }
        }
    }, [messages, userId, showPointsToast, createRecipeHash]);

    useEffect(() => {
        messages.forEach((msg, index) => {
            if (msg.role === "assistant" && 
                typeof msg.content === "string" &&
                (msg.content.includes("pairing") || msg.content.includes("complement")) &&
                !formattedPairings[index]) {
                formatDishPairings(msg.content).then(formatted => {
                    setFormattedPairings(prev => ({
                        ...prev,
                        [index]: formatted
                    }));
                });
            }
        });
    }, [messages, formattedPairings]);

    const suggestions = [
        "Create a traditional recipe",
        "What's your secret to perfect homemade meals?", 
        "Help me use up these leftovers",
        "Tell me a funny cooking disaster story",
        "Give me a recipe for my date",
        "Tell me about SELO olive oil", 
        "Set a timer for 15 minutes"
    ].map(s => s.trim()); // Ensure no extra whitespace that could affect alignment

    const [firstMessage, ...restMessages] = messages;

    return (
        <div className="w-full max-w-2xl mx-auto px-0 md:px-4 space-y-4">
            {firstMessage && firstMessage.role === "assistant" && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {suggestions.map((suggestion, i) => {
                        let emoji = "";
                        if (suggestion.toLowerCase().includes("traditional")) emoji = "🌍";
                        else if (suggestion.toLowerCase().includes("homemade")) emoji = "👩‍🍳";
                        else if (suggestion.toLowerCase().includes("leftovers")) emoji = "🥘";
                        else if (suggestion.toLowerCase().includes("disaster")) emoji = "😅";
                        else if (suggestion.toLowerCase().includes("date")) emoji = "❤️";
                        else if (suggestion.toLowerCase().includes("olive")) emoji = "🌿";
                        else if (suggestion.toLowerCase().includes("timer")) emoji = "⏲️";

                        return (
                            <button
                                key={i}
                                onClick={() => onSuggestionClick(suggestion)}
                                className="p-2 bg-blue-50 rounded-md hover:bg-blue-100 text-black text-left w-full md:w-auto"
                            >
                                {emoji} {suggestion}
                            </button>
                        );
                    })}
                </div>
            )}

            {restMessages.map((msg, index) => {
                const actualIndex = index + 1;
                const isLastItem = actualIndex === restMessages.length;
                const isAssistant = msg.role === "assistant";
                const messageRef = isAssistant && isLastItem ? lastAssistantRef : null;

                    return (
                    <MessageRenderer
                        key={actualIndex}
                        message={msg}
                        index={actualIndex}
                        messageRef={messageRef}
                        recipeClassification={recipeClassification[actualIndex]}
                        formattedPairings={formattedPairings}
                        onSuggestionClick={onSuggestionClick}
                        onAssistantResponse={onAssistantResponse}
                        setLoading={setLoading}
                        handleSaveRecipe={handleSaveRecipe}
                    />
                );
            })}

            {loading && (
                <div className="flex justify-start">
                    <div className="bg-white rounded-3xl px-4 py-2">
                        <LoadingSpinner />
                    </div>
                </div>
            )}
            <div ref={bottomRef}></div>
        </div>
    );
};
