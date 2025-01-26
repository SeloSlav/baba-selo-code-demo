import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { ingredients, directions, cuisineType, diet, recipeId } = await request.json();

    // Create a prompt that describes the recipe
    const prompt = `Create a creative and appetizing title for a recipe with the following details:

Cuisine Type: ${cuisineType}
Diet Type: ${diet.join(', ')}

Ingredients:
${ingredients.map((ingredient: string) => `- ${ingredient}`).join('\n')}

Directions:
${directions.map((direction: string, index: number) => `${index + 1}. ${direction}`).join('\n')}

The title should be catchy, descriptive, and reflect the main ingredients and cooking method. Keep it under 60 characters.
Return only the title without any additional text or formatting.`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a creative recipe title generator. Generate engaging, descriptive titles that highlight the key aspects of each recipe. Keep titles concise and appetizing."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 60,
    });

    const title = completion.choices[0].message.content?.trim();

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error in generateTitle:', error);
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    );
  }
} 