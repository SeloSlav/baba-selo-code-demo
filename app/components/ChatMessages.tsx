"use client";

import React, { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUtensils, faFaceSmile, faHeart, faLeaf, faClock, faCalendarDays, faSun } from "@fortawesome/free-solid-svg-icons";
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
        const unsubscribe = auth.onAuthStateChanged(user => {
             if (user) {
                setUserId(user.uid);
             } else {
                setUserId("");
             }
        });
        return () => unsubscribe(); // Clean up listener on unmount
    }, []);

    useEffect(() => {
        if (lastAssistantRef.current) {
            lastAssistantRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [messages]);

    const handleSaveRecipe = async (msg: string, classification: RecipeClassification | null) => {
        setLoading(true);
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) { // Check currentUser directly
            onAssistantResponse(`Oh dear, I see you'd like to save this wonderful recipe! 🤗 But first, you'll need to <a href="/login" class="underline text-amber-600 hover:text-amber-700">continue with Google</a> to get set up. That way, I can keep all your recipes safe and organized in your personal recipe vault! Plus, you'll earn special spoon points for each recipe you save. Shall we get you set up, dear? 👩‍🍳✨`);
            setLoading(false);
            return;
        }

        let idToken;
        try {
            idToken = await currentUser.getIdToken(true);
        } catch (error) {
            console.error("Error getting ID token:", error);
            onAssistantResponse("Sorry, couldn't verify your session. Please try logging in again.");
            setLoading(false);
            return;
        }

        try {
            const { title } = parseRecipe(msg);
            // Use the verified UID from currentUser
            const docId = currentUser.uid + "-" + Date.now(); 
            const recipeHash = createRecipeHash(msg); // Keep using msg for hash if needed

            const response = await fetch("/api/saveRecipe", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    // Add the Authorization header
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    recipeContent: msg,
                    // No need to send userId in body anymore, backend uses token
                    cuisineType: classification?.cuisine || "Croatian",
                    cookingDifficulty: classification?.difficulty || "Medium",
                    cookingTime: classification?.cooking_time || "2 hours",
                    diet: classification?.diet || ["gluten-free", "paleo"],
                    docId, // Send the generated docId
                    // recipeHash, // Decide if backend still needs this
                }),
            });

            if (response.ok) {
                // Award spoon points for saving the recipe (Ensure currentUser.uid is used)
                const pointsResult = await SpoonPointSystem.awardPoints(
                    currentUser.uid, // Use verified UID
                    'SAVE_RECIPE',
                    docId 
                );

                let message = `Your <a href="/recipe/${docId}" target="_blank" rel="noopener noreferrer" class="underline text-amber-600 hover:text-amber-700"> ${title}</a> recipe has been tucked away in the kitchen vault, ready for use!`;
                
                if (pointsResult.success) {
                    showPointsToast(pointsResult.points!, 'Recipe saved successfully!');
                    message += ` You earned ${pointsResult.points} spoons! 🥄✨ Click your recipe to add mouthwatering photos, discover perfect pairings, and unlock more rewards!`;
                } else if (pointsResult.error) {
                    console.log('Points not awarded for save:', pointsResult.error);
                }

                onAssistantResponse(message);
            } else {
                const errorData = await response.json();
                console.error("Failed to save recipe:", errorData.error);
                 // Provide specific feedback based on status code if possible
                if (response.status === 401) {
                     onAssistantResponse("Sorry, your session seems invalid. Please log in again.");
                } else if (response.status === 403) {
                     onAssistantResponse("Sorry, permission denied saving the recipe. You might not own it if it already exists.");
                } else {
                     onAssistantResponse("Sorry, something went wrong saving the recipe.");
                }
            }
        } catch (error) {
            console.error("Error in handleSaveRecipe fetch/processing:", error);
            onAssistantResponse("Sorry, an unexpected error occurred while saving the recipe.");
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
    }, [messages, showPointsToast]); // Removed userId, createRecipeHash dependencies as they are stable

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

    const suggestions: { text: string; icon: React.ReactNode }[] = [
        { text: "I'd like a traditional Balkan recipe", icon: <FontAwesomeIcon icon={faUtensils} className="w-3 h-3 text-amber-700/80 shrink-0" /> },
        { text: "What's your secret to perfect homemade meals?", icon: <FontAwesomeIcon icon={faUtensils} className="w-3 h-3 text-amber-700/80 shrink-0" /> },
        { text: "Tell me a funny story from the kitchen", icon: <FontAwesomeIcon icon={faFaceSmile} className="w-3 h-3 text-amber-700/80 shrink-0" /> },
        { text: "Give me a recipe for a romantic dinner", icon: <FontAwesomeIcon icon={faHeart} className="w-3 h-3 text-amber-700/80 shrink-0" /> },
        { text: "Tell me about SELO olive oil", icon: <FontAwesomeIcon icon={faLeaf} className="w-3 h-3 text-amber-700/80 shrink-0" /> },
        { text: "Can you set a timer for 15 minutes?", icon: <FontAwesomeIcon icon={faClock} className="w-3 h-3 text-amber-700/80 shrink-0" /> },
        { text: "What's in season right now?", icon: <FontAwesomeIcon icon={faSun} className="w-3 h-3 text-amber-700/80 shrink-0" /> },
        { text: "Help me plan my meals for the week", icon: <FontAwesomeIcon icon={faCalendarDays} className="w-3 h-3 text-amber-700/80 shrink-0" /> },
        { text: "What should I cook for dinner tonight?", icon: <FontAwesomeIcon icon={faUtensils} className="w-3 h-3 text-amber-700/80 shrink-0" /> },
    ];

    const [firstMessage, ...restMessages] = messages;

    return (
        <div className="w-full max-w-2xl mx-auto px-0 md:px-4 space-y-4">
            {firstMessage && firstMessage.role === "assistant" && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                    {suggestions.map((suggestion, i) => (
                        <button
                            key={i}
                            onClick={() => onSuggestionClick(suggestion.text)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm bg-white rounded-lg hover:bg-amber-50 text-gray-800 font-medium text-left border border-amber-200 hover:border-amber-300 shadow-sm hover:shadow transition-all"
                        >
                            {suggestion.icon}
                            <span>{suggestion.text}</span>
                        </button>
                    ))}
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

            {loading && (() => {
                const lastMsg = messages[messages.length - 1];
                const prevMsg = messages[messages.length - 2];
                const prevContent = (prevMsg?.content || "").toLowerCase();
                const isMealPlanFlow = messages.length >= 2 &&
                    lastMsg?.role === "user" &&
                    prevMsg?.role === "assistant" &&
                    (prevContent.includes("plan your week") || prevContent.includes("meal plan") || prevContent.includes("plan my meals") ||
                     (prevContent.includes("tell me") && (prevContent.includes("diet") || prevContent.includes("cuisines") || prevContent.includes("ingredients"))) ||
                     prevContent.includes("anything else") || prevContent.includes("make your plan"));
                const loadingLabel = isMealPlanFlow ? "Generating your meal plan now..." : null;
                return (
                    <div className="flex justify-start">
                        <div className="bg-white rounded-3xl px-4 py-2 flex items-center gap-3">
                            <LoadingSpinner />
                            {loadingLabel && <span className="text-sm text-gray-600">{loadingLabel}</span>}
                        </div>
                    </div>
                );
            })()}
            <div ref={bottomRef}></div>
        </div>
    );
};
