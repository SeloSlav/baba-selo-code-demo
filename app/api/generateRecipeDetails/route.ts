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

    const descriptionHint = recipeContent && typeof recipeContent === 'string' && recipeContent.trim().length > 0
      ? `\n\nDescription/context: ${recipeContent.trim().slice(0, 500)}`
      : '';

    // Step 1: Generate recipe using JSON mode for guaranteed structure (like saveRecipe/chat format)
    const jsonPrompt = `Generate a complete recipe with proper ingredients and directions. Return ONLY valid JSON.

Recipe: ${recipeTitle}${descriptionHint}

Return this exact JSON structure (no other text):
{
  "ingredients": [
    "2 cups canned white beans, drained and rinsed",
    "3 stalks celery, thinly sliced",
    "1 small red onion, finely chopped"
  ],
  "directions": [
    "In a large bowl, combine the white beans, celery, red onion, and parsley.",
    "In another small bowl, whisk together the vinegar, olive oil, salt, and pepper.",
    "Pour the dressing over the salad and toss gently to combine."
  ]
}

Rules:
- ingredients: array of strings, each with quantity (e.g. "2 cups rice", "1/2 tsp salt")
- directions: array of strings, each a complete step (e.g. "In a large bowl, combine...")
- Minimum 5 ingredients, 4 directions
- Match the format from the example above`;

    try {
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a professional chef. Return ONLY valid JSON with ingredients and directions arrays. Each ingredient must include quantity. Each direction must be a full step."
          },
          {
            role: "user",
            content: jsonPrompt
          }
        ],
        model: "gpt-4o-mini",
        temperature: 0.5,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      const response = completion.choices?.[0]?.message?.content || '';
      let parsed: { ingredients?: string[]; directions?: string[] } = {};
      try {
        parsed = JSON.parse(response);
      } catch {
        return NextResponse.json({
          error: "Failed to generate recipe details",
          message: "Invalid JSON response from AI"
        }, { status: 500 });
      }

      result.ingredients = Array.isArray(parsed.ingredients)
        ? parsed.ingredients.filter((i): i is string => typeof i === 'string' && i.trim().length > 0)
        : [];
      result.directions = Array.isArray(parsed.directions)
        ? parsed.directions.filter((d): d is string => typeof d === 'string' && d.trim().length > 0)
        : [];

      if (!result.ingredients.length || !result.directions.length) {
        return NextResponse.json({
          error: "Failed to generate recipe details",
          message: "AI did not return valid ingredients or directions arrays"
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

        // Store classification data with validation (classify returns snake_case)
        const timeMap: Record<string, string> = {
          "15 minutes": "15 min",
          "30 minutes": "30 min",
          "45 minutes": "45 min",
          "1 hour": "1 hour",
          "2 hours": "1.5 hours",
        };
        result.cookingTime = timeMap[classifyData.cooking_time] || classifyData.cooking_time;
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

        // Step 4: Get macro information (macroInfo API expects 'recipe' string)
        const recipeForMacros = `${recipeTitle}\n\nIngredients:\n${result.ingredients.join('\n')}\n\nDirections:\n${result.directions.join('\n')}`;
        const macroResponse = await fetch(`${baseUrl}/api/macroInfo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe: recipeForMacros }),
        });

        if (macroResponse.ok) {
          const macroData = await macroResponse.json();
          result.macroInfo = macroData.macros || macroData;
        }

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
        console.error("Error in recipe generation (generateAll):", error);
        // Return 200 with partial data so meal plans still get ingredients/directions
        result.cuisineType = result.cuisineType || 'General';
        result.cookingDifficulty = result.cookingDifficulty || 'medium';
        result.cookingTime = result.cookingTime || '30 min';
        result.diet = Array.isArray(result.diet) ? result.diet : [];
        result.summary = result.summary || '';
        result.macroInfo = result.macroInfo?.macros || result.macroInfo || null;
        result.dishPairings = result.dishPairings || '';
      }
    }

    // Update recipe with all generated data; macroInfo API returns { servings, total, per_serving }
    const macros = result.macroInfo;
    result = {
      ...result,
      recipeSummary: result.summary || '',
      macroInfo: macros?.total && macros?.per_serving
        ? {
            servings: macros.servings ?? 4,
            per_serving: {
              calories: Math.round((macros.per_serving?.calories ?? 0) * 100) / 100,
              carbs: Math.round((macros.per_serving?.carbs ?? 0) * 100) / 100,
              fats: Math.round((macros.per_serving?.fats ?? 0) * 100) / 100,
              proteins: Math.round((macros.per_serving?.proteins ?? 0) * 100) / 100
            },
            total: {
              calories: Math.round((macros.total?.calories ?? 0) * 100) / 100,
              carbs: Math.round((macros.total?.carbs ?? 0) * 100) / 100,
              fats: Math.round((macros.total?.fats ?? 0) * 100) / 100,
              proteins: Math.round((macros.total?.proteins ?? 0) * 100) / 100
            }
          }
        : null,
      dishPairings: result.dishPairings || '',
      cookingTime: result.cookingTime || '30 min',
      cuisineType: result.cuisineType || 'General',
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