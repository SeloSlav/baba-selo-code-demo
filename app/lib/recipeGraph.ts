/**
 * LangGraph pipeline for recipe generation with semantic caching.
 * Flow: check_cache → [hit] return | [miss] generate → enrich → store_cache → return
 */
import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { checkRecipeCache, storeRecipeCache, CachedRecipeData } from "./recipeVectorStore";

const RecipeStateAnnotation = Annotation.Root({
  queryText: Annotation<string>,
  recipeTitle: Annotation<string>,
  recipeContent: Annotation<string>,
  generateAll: Annotation<boolean>,
  baseUrl: Annotation<string>,
  result: Annotation<Partial<CachedRecipeData> | null>,
  fromCache: Annotation<boolean>,
});

type RecipeState = typeof RecipeStateAnnotation.State;

async function checkCacheNode(state: RecipeState): Promise<Partial<RecipeState>> {
  const cached = await checkRecipeCache(state.queryText);
  if (cached) {
    return {
      result: cached,
      fromCache: true,
    };
  }
  return { fromCache: false };
}

async function generateNode(state: RecipeState): Promise<Partial<RecipeState>> {
  if (state.fromCache) return {};

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.5,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const jsonPrompt = `Generate a complete recipe with proper ingredients and directions. Return ONLY valid JSON.

Recipe: ${state.recipeTitle}${state.recipeContent ? `\n\nDescription/context: ${String(state.recipeContent).trim().slice(0, 500)}` : ""}

Return this exact JSON structure (no other text):
{
  "ingredients": ["2 cups canned white beans, drained and rinsed", "3 stalks celery, thinly sliced"],
  "directions": ["In a large bowl, combine the white beans, celery, and onion.", "Pour the dressing over and toss."]
}

Rules:
- ingredients: array of strings, each with quantity (e.g. "2 cups rice", "1/2 tsp salt")
- directions: array of strings, each a complete step
- Minimum 5 ingredients, 4 directions`;

  const response = await llm.invoke([
    {
      role: "system",
      content:
        "You are a professional chef. Return ONLY valid JSON with ingredients and directions arrays. Each ingredient must include quantity. Each direction must be a full step.",
    },
    { role: "user", content: jsonPrompt },
  ]);

  const text = typeof response.content === "string" ? response.content : "";
  let parsed: { ingredients?: string[]; directions?: string[] } = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON response from AI");
  }

  const ingredients = Array.isArray(parsed.ingredients)
    ? parsed.ingredients.filter((i): i is string => typeof i === "string" && i.trim().length > 0)
    : [];
  const directions = Array.isArray(parsed.directions)
    ? parsed.directions.filter((d): d is string => typeof d === "string" && d.trim().length > 0)
    : [];

  if (!ingredients.length || !directions.length) {
    throw new Error("AI did not return valid ingredients or directions arrays");
  }

  return {
    result: {
      ingredients,
      directions,
    },
  };
}

async function enrichNode(state: RecipeState): Promise<Partial<RecipeState>> {
  if (state.fromCache || !state.generateAll || !state.result) return {};

  const { result, baseUrl, recipeTitle } = state;
  const ingredients = result.ingredients ?? [];
  const directions = result.directions ?? [];

  try {
    // Classify
    const classifyRes = await fetch(`${baseUrl}/api/classifyRecipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: recipeTitle,
        ingredients: ingredients.join("\n"),
        directions: directions.join("\n"),
      }),
    });
    const classifyData = classifyRes.ok ? await classifyRes.json() : null;
    const timeMap: Record<string, string> = {
      "15 minutes": "15 min",
      "30 minutes": "30 min",
      "45 minutes": "45 min",
      "1 hour": "1 hour",
      "2 hours": "1.5 hours",
    };
    if (classifyData) {
      result.cookingTime = timeMap[classifyData.cooking_time] || classifyData.cooking_time;
      result.cuisineType = classifyData.cuisine;
      result.cookingDifficulty = classifyData.difficulty;
      result.diet = classifyData.diet;
    }

    // Summary
    const summaryRes = await fetch(`${baseUrl}/api/generateSummary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: recipeTitle,
        ingredients,
        directions,
        cuisineType: result.cuisineType,
        diet: result.diet,
        cookingTime: result.cookingTime,
        cookingDifficulty: result.cookingDifficulty,
      }),
    });
    if (summaryRes.ok) {
      const summaryData = await summaryRes.json();
      result.summary = summaryData.summary;
    }

    // Macros
    const recipeForMacros = `${recipeTitle}\n\nIngredients:\n${ingredients.join("\n")}\n\nDirections:\n${directions.join("\n")}`;
    const macroRes = await fetch(`${baseUrl}/api/macroInfo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe: recipeForMacros }),
    });
    if (macroRes.ok) {
      const macroData = await macroRes.json();
      result.macroInfo = macroData.macros || macroData;
    }

    // Pairings
    const pairingRes = await fetch(`${baseUrl}/api/dishPairing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe: recipeForMacros }),
    });
    if (pairingRes.ok) {
      const pairingData = await pairingRes.json();
      result.dishPairings = pairingData.suggestion;
    }
  } catch (err) {
    console.error("Enrich step error:", err);
  }

  return { result: { ...result } };
}

async function storeCacheNode(state: RecipeState): Promise<Partial<RecipeState>> {
  if (state.fromCache || !state.result || !state.generateAll) return {};
  const data = state.result as CachedRecipeData;
  if (data.ingredients?.length && data.directions?.length) {
    await storeRecipeCache(state.queryText, data);
  }
  return {};
}

function routeAfterCache(state: RecipeState): "generate" | "__end__" {
  return state.fromCache ? "__end__" : "generate";
}

export function createRecipeGraph() {
  const workflow = new StateGraph(RecipeStateAnnotation)
    .addNode("check_cache", checkCacheNode)
    .addNode("generate", generateNode)
    .addNode("enrich", enrichNode)
    .addNode("store_cache", storeCacheNode)
    .addEdge("__start__", "check_cache")
    .addConditionalEdges("check_cache", routeAfterCache)
    .addEdge("generate", "enrich")
    .addEdge("enrich", "store_cache")
    .addEdge("store_cache", "__end__");

  return workflow.compile();
}
