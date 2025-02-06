import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { recipeTitle, recipeContent } = await request.json();

    const prompt = `Given a recipe title and content, extract or generate a structured list of ingredients and directions.
If the recipe content already contains ingredients and directions, extract them.
If they are missing or incomplete, generate them based on the recipe title and any available content.

Recipe Title: ${recipeTitle}
Recipe Content: ${recipeContent}

Please provide the response in the following format:
INGREDIENTS:
- ingredient 1
- ingredient 2
...

DIRECTIONS:
1. step 1
2. step 2
...

Rules:
1. Ingredients should be clear and include quantities
2. Directions should be detailed and easy to follow
3. Keep the style consistent with traditional recipes
4. Maintain authenticity for cultural dishes
5. Include any special notes about ingredients or techniques`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional chef specializing in recipe development and documentation. Your task is to extract or generate detailed recipe ingredients and directions while maintaining authenticity and clarity."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content;

    // Parse the response
    const ingredientsMatch = response.match(/INGREDIENTS:\n((?:- [^\n]+\n)+)/);
    const directionsMatch = response.match(/DIRECTIONS:\n((?:\d+\. [^\n]+\n?)+)/);

    const ingredients = ingredientsMatch 
      ? ingredientsMatch[1].split('\n')
        .map(line => line.replace(/^- /, '').trim())
        .filter(line => line)
      : [];

    const directions = directionsMatch
      ? directionsMatch[1].split('\n')
        .map(line => line.replace(/^\d+\. /, '').trim())
        .filter(line => line)
      : [];

    return NextResponse.json({ ingredients, directions });
  } catch (error) {
    console.error("Error generating recipe details:", error);
    return NextResponse.json({ error: "Failed to generate recipe details" }, { status: 500 });
  }
} 