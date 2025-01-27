import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { title, ingredients, directions, cuisineType, diet, cookingTime, cookingDifficulty } = await request.json();

    const prompt = `Generate a brief, SEO-optimized description for a recipe with the following details:

Title: ${title}
Cuisine: ${cuisineType}
Diet: ${diet.join(', ')}
Cooking Time: ${cookingTime}
Difficulty: ${cookingDifficulty}

Ingredients:
${ingredients.map((ingredient: string) => `- ${ingredient}`).join('\n')}

Directions:
${directions.map((direction: string, index: number) => `${index + 1}. ${direction}`).join('\n')}

IMPORTANT RULES:
1. Write a single paragraph (2-3 sentences)
2. Include key ingredients and cooking method
3. Mention cuisine type and dietary information
4. Use natural, engaging language optimized for search
5. Keep it between 30-50 words
6. Focus on what makes this recipe special
7. Include relevant keywords for SEO
8. Do not use superlatives or marketing language

Example good summary:
"Traditional Croatian beef goulash simmered with paprika and root vegetables. This hearty stew features tender meat and rich flavors, perfect for cold weather meals. Naturally gluten-free and ready in under two hours."

Example bad summary:
"The most amazing and delicious recipe you'll ever try! This incredible dish will blow your mind with its fantastic flavors and super easy preparation method that anyone can master!"`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an SEO expert specializing in recipe descriptions. Create natural, informative summaries that help recipes rank well in search results while providing valuable information to readers."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      max_tokens: 100,
    });

    const summary = completion.choices[0].message.content?.trim();

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error in generateSummary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
} 