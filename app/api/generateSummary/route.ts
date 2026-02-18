import { NextResponse } from "next/server";
import { callLLM } from "../../lib/callLLM";
import {
  checkEnrichmentCache,
  storeEnrichmentCache,
} from "../../lib/stores/enrichmentCache";

const SYSTEM_PROMPT =
  "You are an SEO expert specializing in recipe descriptions. Create natural, informative summaries that help recipes rank well in search results while providing valuable information to readers.";

export async function POST(request: Request) {
  try {
    const {
      title,
      ingredients,
      directions,
      cuisineType,
      diet,
      cookingTime,
      cookingDifficulty,
    } = await request.json();

    const safeDiet = Array.isArray(diet) ? diet.join(", ") : "";
    const safeIngredients = Array.isArray(ingredients) ? ingredients : [];
    const safeDirections = Array.isArray(directions) ? directions : [];

    const userContent = `Generate a brief, SEO-optimized description for a recipe with the following details:

Title: ${title || "Recipe"}
Cuisine: ${cuisineType || "Unknown"}
Diet: ${safeDiet}
Cooking Time: ${cookingTime || "Unknown"}
Difficulty: ${cookingDifficulty || "Unknown"}

Ingredients:
${safeIngredients.map((i: string) => `- ${i}`).join("\n")}

Directions:
${safeDirections.map((d: string, idx: number) => `${idx + 1}. ${d}`).join("\n")}

IMPORTANT RULES:
1. Write a single paragraph (2-3 sentences)
2. Include key ingredients and cooking method
3. Mention cuisine type and dietary information
4. Use natural, engaging language optimized for search
5. Keep it between 30-50 words
6. Focus on what makes this recipe special
7. Include relevant keywords for SEO
8. Do not use superlatives or marketing language
9. DO NOT use any quotation marks in the summary

Example good summary:
Traditional Croatian beef goulash simmered with paprika and root vegetables. This hearty stew features tender meat and rich flavors, perfect for cold weather meals. Naturally gluten-free and ready in under two hours.`;

    const cacheKey = `${title}\n${safeIngredients.join("\n")}\n${safeDirections.join("\n")}\n${cuisineType}\n${cookingTime}\n${cookingDifficulty}`;

    try {
      const cached = await checkEnrichmentCache<{ summary: string }>(
        "summary",
        cacheKey
      );
      if (cached?.summary) {
        return NextResponse.json(cached);
      }
    } catch (err) {
      console.error("Enrichment cache lookup failed:", err);
    }

    const summary = (
      await callLLM(SYSTEM_PROMPT, userContent, {
        temperature: 0.5,
        maxTokens: 100,
      })
    ).trim();

    const result = { summary };

    storeEnrichmentCache("summary", cacheKey, result).catch((err) =>
      console.error("Failed to store summary cache:", err)
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in generateSummary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
