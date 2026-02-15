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

    // Step 1: Always generate basic recipe details first
    const basicPrompt = `Given a recipe title${descriptionHint ? ' and description' : ''}, generate a COMPLETE recipe with a proper ingredients list and step-by-step directions.

Recipe Title: ${recipeTitle}${descriptionHint}

You MUST provide:

INGREDIENTS:
- 1 cup flour (or similar with quantities)
- 2 tbsp olive oil
- etc. (each ingredient on its own line with a dash, include quantities)

DIRECTIONS:
1. First step with clear instructions
2. Second step
3. etc. (numbered steps, each on its own line)

Rules:
1. Ingredients MUST be a proper list with quantities (e.g. "2 cups rice", "1/2 tsp salt")
2. Directions MUST be numbered steps, not a single paragraph
3. Generate at least 5-8 ingredients and 4-8 direction steps
4. Be specific and detailed`;

    try {
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a professional chef. Generate a complete, detailed recipe with a proper ingredients list (with quantities) and numbered step-by-step directions. Never return a single sentence—always return structured lists."
          },
          {
            role: "user",
            content: basicPrompt
          }
        ],
        model: "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 1500,
      });

      if (!completion.choices?.[0]?.message?.content) {
        return NextResponse.json({
          error: "Failed to generate recipe details",
          message: "OpenAI API did not return a valid response"
        }, { status: 500 });
      }

      const response = completion.choices[0].message.content;

      // Parse ingredients - support "- item" or "• item" or "* item"
      const ingredientsSection = response.match(/INGREDIENTS?:\s*\n([\s\S]*?)(?=DIRECTIONS?:\s*\n|$)/i);
      result.ingredients = [];
      if (ingredientsSection) {
        result.ingredients = ingredientsSection[1]
          .split('\n')
          .map(line => line.replace(/^[\s\-•*]\s*/, '').trim())
          .filter(line => line.length > 2);
      }

      // Parse directions - support "1. step" or "1) step"
      const directionsSection = response.match(/DIRECTIONS?:\s*\n([\s\S]*?)(?=INGREDIENTS?:\s*\n|$)/i);
      result.directions = [];
      if (directionsSection) {
        result.directions = directionsSection[1]
          .split('\n')
          .map(line => line.replace(/^\s*\d+[\.\)]\s*/, '').trim())
          .filter(line => line.length > 2);
      }

      // Fallback: if parsing failed, try splitting by common patterns
      if (!result.ingredients.length && response.includes('-')) {
        const afterIng = response.split(/INGREDIENTS?:\s*\n/i)[1];
        if (afterIng) {
          result.ingredients = afterIng.split(/DIRECTIONS?:\s*\n/i)[0]
            .split('\n')
            .map(line => line.replace(/^[\s\-•*]\s*/, '').trim())
            .filter(line => line.length > 2);
        }
      }
      if (!result.directions.length && /\d+\./.test(response)) {
        const afterDir = response.split(/DIRECTIONS?:\s*\n/i)[1];
        if (afterDir) {
          result.directions = afterDir
            .split('\n')
            .map(line => line.replace(/^\s*\d+[\.\)]\s*/, '').trim())
            .filter(line => line.length > 2);
        }
      }

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