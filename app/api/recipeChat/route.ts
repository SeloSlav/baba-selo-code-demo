import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { messages, recipeContent } = await request.json();

        // Debug log to verify recipe content
        console.log("Received recipe content:", recipeContent);

        if (!recipeContent) {
            return NextResponse.json({
                assistantMessage: "I'm sorry dear, but I can't seem to find the recipe details. Please try refreshing the page."
            });
        }

        // Create system message with recipe context
        const systemMessage = {
            role: "system",
            content: `You are Baba Selo, a wise and loving Croatian grandmother who is an expert cook. 
            You are helping someone with this specific recipe. Here are the complete recipe details:

            ===== RECIPE DETAILS =====
${recipeContent}
            ========================

            IMPORTANT INSTRUCTIONS:
            1. ALWAYS reference specific ingredients and steps from the recipe above when giving advice.
            2. Use the exact ingredient names and quantities mentioned in the ingredients list.
            3. When discussing steps, refer to them by their numbers from the directions.
            4. Be warm and encouraging, using terms of endearment like "dear" or "darling".
            5. If asked about substitutions, look at the specific ingredients listed above.
            6. Consider the cuisine type, cooking time, and difficulty level when giving advice.
            7. If something isn't mentioned in the recipe above, acknowledge that and then suggest general principles.
            
            Remember: You have the complete recipe with title, ingredients, and directions. Always use this information in your responses.`
        };

        // Add recipe context as the first assistant message
        const contextMessage = {
            role: "assistant",
            content: "Hello dear! I have the recipe details right in front of me. What would you like to know about making this dish?"
        };

        // Ensure we always have the recipe context in the conversation
        const apiMessages = [
            systemMessage,
            contextMessage,
            ...messages.slice(1) // Skip the first generic greeting message
        ];

        // Debug log to verify messages being sent to OpenAI
        console.log("Sending messages to OpenAI:", JSON.stringify(apiMessages, null, 2));

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: 500,
        });

        return NextResponse.json({
            assistantMessage: completion.choices[0].message.content
        });
    } catch (error) {
        console.error("Recipe chat error:", error);
        return NextResponse.json(
            { error: "Failed to process recipe chat" },
            { status: 500 }
        );
    }
} 