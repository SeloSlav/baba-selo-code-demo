import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to get base URL
function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT || 3000}`;
}

export async function POST(request: Request) {
  try {
    const { recipeTitle, recipeContent, generateAll } = await request.json();
    const baseUrl = getBaseUrl();
    let result: any = {};

    // Step 1: Always generate basic recipe details first
    const basicPrompt = `Given a recipe title, generate a complete recipe with ingredients and directions.

Recipe Title: ${recipeTitle}

Please provide the following:

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

    try {
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a professional chef specializing in recipe development. Generate detailed recipe ingredients and directions while maintaining authenticity and clarity."
          },
          {
            role: "user",
            content: basicPrompt
          }
        ],
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        max_tokens: 1000,
      });

      if (!completion.choices?.[0]?.message?.content) {
        return NextResponse.json({
          error: "Failed to generate recipe details",
          message: "OpenAI API did not return a valid response"
        }, { status: 500 });
      }

      const response = completion.choices[0].message.content;

      // Parse ingredients and directions
      const ingredientsMatch = response.match(/INGREDIENTS:\n((?:- [^\n]+\n)+)/);
      const directionsMatch = response.match(/DIRECTIONS:\n((?:\d+\. [^\n]+\n?)+)/);

      result.ingredients = ingredientsMatch 
        ? ingredientsMatch[1].split('\n')
          .map(line => line.replace(/^- /, '').trim())
          .filter(line => line)
        : [];

      result.directions = directionsMatch
        ? directionsMatch[1].split('\n')
          .map(line => line.replace(/^\d+\. /, '').trim())
          .filter(line => line)
        : [];

      // Validate that we got ingredients and directions
      if (!result.ingredients.length || !result.directions.length) {
        return NextResponse.json({
          error: "Failed to generate recipe details",
          message: "Could not extract ingredients and directions from the generated response"
        }, { status: 500 });
      }
    } catch (error: any) {
      console.error("OpenAI API error:", error);
      return NextResponse.json({
        error: "Failed to generate recipe details",
        message: error?.message || "Error calling OpenAI API"
      }, { status: 500 });
    }

    if (generateAll) {
      try {
        // Step 2: Get recipe classification
        const classifyResponse = await fetch(`${baseUrl}/api/classifyRecipe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: recipeTitle,
            ingredients: result.ingredients.join('\n'),
            directions: result.directions.join('\n')
          }),
        });

        let classifyData;
        try {
          classifyData = await classifyResponse.json();
        } catch (e) {
          throw new Error('Failed to parse classification response: Invalid JSON');
        }

        if (!classifyResponse.ok || !classifyData) {
          throw new Error(classifyData?.error || 'Classification request failed: No valid response');
        }

        // Store classification data with validation
        result.cookingTime = classifyData.cookingTime;
        result.cuisineType = classifyData.cuisine;
        result.cookingDifficulty = classifyData.difficulty;
        result.diet = classifyData.diet;

        if (!result.cookingTime || !result.cuisineType || !result.cookingDifficulty) {
          throw new Error('Classification response missing required fields');
        }

        // Step 3: Generate summary using classification data
        const summaryResponse = await fetch(`${baseUrl}/api/generateSummary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: recipeTitle,
            ingredients: result.ingredients,
            directions: result.directions,
            cuisineType: result.cuisineType,
            diet: result.diet,
            cookingTime: result.cookingTime,
            cookingDifficulty: result.cookingDifficulty
          }),
        });

        if (!summaryResponse.ok) {
          throw new Error('Failed to generate summary');
        }

        const summaryData = await summaryResponse.json();
        result.summary = summaryData.summary;

        // Step 4: Get macro information
        const macroResponse = await fetch(`${baseUrl}/api/macroInfo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ingredients: result.ingredients,
            servings: 4
          }),
        });

        if (!macroResponse.ok) {
          throw new Error('Failed to generate macro information');
        }

        const macroData = await macroResponse.json();
        result.macroInfo = macroData;

        // Step 5: Get dish pairings
        const pairingResponse = await fetch(`${baseUrl}/api/dishPairing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipe: `${recipeTitle}\n\nIngredients:\n${result.ingredients.join('\n')}\n\nDirections:\n${result.directions.join('\n')}`
          }),
        });

        if (!pairingResponse.ok) {
          throw new Error('Failed to generate dish pairings');
        }

        const pairingData = await pairingResponse.json();
        result.dishPairings = pairingData.suggestion;

      } catch (error) {
        console.error("Error in recipe generation:", error);
        return NextResponse.json({ 
          error: "Recipe generation failed",
          message: error.message || "An unexpected error occurred during recipe generation",
          details: {
            ingredients: result.ingredients,
            directions: result.directions
          }
        }, { status: 500 });
      }
    }

    // Update recipe with all generated data, using fallbacks for missing data
    result = {
      ...result,
      recipeSummary: result.summary || '',
      macroInfo: {
        servings: 4,
        per_serving: {
          calories: result.macroInfo?.calories ? Math.round(result.macroInfo.calories / 4 * 100) / 100 : 0,
          carbs: result.macroInfo?.carbs ? Math.round(result.macroInfo.carbs / 4 * 100) / 100 : 0,
          fats: result.macroInfo?.fat ? Math.round(result.macroInfo.fat / 4 * 100) / 100 : 0,
          proteins: result.macroInfo?.protein ? Math.round(result.macroInfo.protein / 4 * 100) / 100 : 0
        },
        total: {
          calories: result.macroInfo?.calories ? Math.round(result.macroInfo.calories * 100) / 100 : 0,
          carbs: result.macroInfo?.carbs ? Math.round(result.macroInfo.carbs * 100) / 100 : 0,
          fats: result.macroInfo?.fat ? Math.round(result.macroInfo.fat * 100) / 100 : 0,
          proteins: result.macroInfo?.protein ? Math.round(result.macroInfo.protein * 100) / 100 : 0
        }
      },
      dishPairings: result.dishPairings || [],
      cookingTime: result.cookingTime || 0,
      cuisineType: result.cuisineType || 'unknown',
      cookingDifficulty: result.cookingDifficulty || 'medium',
      diet: Array.isArray(result.diet) ? result.diet : result.diet || []
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in recipe generation:", error);
    return NextResponse.json({ 
      error: "Failed to generate recipe details",
      details: error.message 
    }, { status: 500 });
  }
} 