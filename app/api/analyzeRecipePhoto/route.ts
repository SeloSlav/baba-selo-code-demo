import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
    try {
        const { imageUrl, recipe } = await req.json();
        console.log("📸 Analyzing recipe photo - Request received");

        if (!imageUrl || !recipe) {
            console.log("❌ Missing image URL or recipe data");
            return NextResponse.json({ error: "Missing image URL or recipe data" }, { status: 400 });
        }

        const prompt = `You are a professional food photographer and recipe expert. First, determine if this image shows food that could plausibly be the recipe described below. If the image shows something completely unrelated to food or a dish that clearly cannot be the described recipe, return:
{"score": 0, "explanation": "Image is unrelated to the recipe"}

If the image shows food that could be the recipe, analyze how well it matches and score it between 250 and 1000 points based on the following criteria:

Recipe Details:
Title: ${recipe.recipeTitle}
Ingredients: ${recipe.ingredients.join(", ")}
Directions: ${recipe.directions.join(" ")}

Scoring Criteria:
- Ingredient Visibility (250 points max): How many of the main ingredients are visible and recognizable?
- Preparation Accuracy (250 points max): Does the final presentation match the cooking instructions?
- Visual Appeal (250 points max): Quality of lighting, composition, and overall presentation
- Recipe Authenticity (250 points max): How authentic does this look compared to what the recipe describes?

Base score starts at 250 points for any food image that could plausibly be the recipe.
Provide a final score and a brief explanation.

Return ONLY a JSON object with two fields:
1. 'score': the numerical score (integer between 0 and 1000, use 0 ONLY for completely unrelated images)
2. 'explanation': brief explanation of the score

Example response formats:
For matching images:
{"score": 850, "explanation": "Strong presentation of key ingredients (200/25), follows recipe preparation (220/25), excellent lighting (230/250), authentic appearance (200/250). Total: 850/1000"}

For unrelated images:
{"score": 0, "explanation": "Image is unrelated to the recipe"}`;

        console.log("🤖 Calling GPT-4 for analysis...");
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl
                            }
                        }
                    ],
                }
            ],
            max_tokens: 150,
            temperature: 0.7,
            store: true
        });

        try {
            // Parse the response as JSON
            const analysis = JSON.parse(response.choices[0].message.content || "{}");
            console.log("✅ Analysis complete:", analysis);
            return NextResponse.json(analysis);
        } catch (error) {
            console.error("❌ Error parsing GPT response:", error);
            return NextResponse.json({ error: "Invalid response format" }, { status: 500 });
        }
    } catch (error) {
        console.error("❌ Error analyzing recipe photo:", error);
        return NextResponse.json({ error: "Failed to analyze photo" }, { status: 500 });
    }
} 