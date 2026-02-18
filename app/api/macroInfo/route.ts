import { NextResponse } from "next/server";
import { callLLMJSON } from "../../lib/callLLM";
import {
  checkEnrichmentCache,
  storeEnrichmentCache,
} from "../../lib/stores/enrichmentCache";
import type { NutritionalInfo } from "../../components/types";

const SYSTEM_PROMPT = `You are a nutritionist API that ONLY responds with JSON. Based on a given recipe, calculate the total calories and macros (proteins, carbs, fats) for the entire recipe and per serving. First, determine the number of servings based on the recipe portions or ingredients. Then provide the total values for calories, proteins, carbs, and fats in grams, along with the number of servings. Structure the response EXACTLY as shown, with NO additional text or explanation:

{
  "servings": 4,
  "total": {
    "calories": 1200,
    "proteins": 60,
    "carbs": 140,
    "fats": 45
  },
  "per_serving": {
    "calories": 300,
    "proteins": 15,
    "carbs": 35,
    "fats": 11.25
  }
}`;

export async function POST(req: Request) {
  const { recipe } = await req.json();

  if (!recipe) {
    return NextResponse.json({ error: "No recipe provided" }, { status: 400 });
  }

  const recipeText =
    typeof recipe === "string" ? recipe : JSON.stringify(recipe);
  const cacheKey = recipeText.slice(0, 2000);

  try {
    const cached = await checkEnrichmentCache<{ macros: NutritionalInfo }>(
      "macro",
      cacheKey
    );
    if (cached?.macros) {
      return NextResponse.json({ macros: cached.macros });
    }
  } catch (err) {
    console.error("Enrichment cache lookup failed:", err);
  }

  try {
    const nutritionData = await callLLMJSON<NutritionalInfo>(
      SYSTEM_PROMPT,
      recipeText,
      { temperature: 0.7 }
    );

    if (
      !nutritionData.servings ||
      !nutritionData.total ||
      !nutritionData.per_serving
    ) {
      return NextResponse.json(
        { error: "Invalid nutrition data structure" },
        { status: 500 }
      );
    }

    const result = { macros: nutritionData };

    storeEnrichmentCache("macro", cacheKey, result).catch((err) =>
      console.error("Failed to store macro cache:", err)
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error getting nutrition info:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
