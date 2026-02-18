import { NextResponse } from "next/server";
import { callLLM } from "../../lib/callLLM";
import {
  checkEnrichmentCache,
  storeEnrichmentCache,
} from "../../lib/stores/enrichmentCache";
import { getSimilarRecipes } from "../../lib/stores/similarRecipesStore";

const SYSTEM_PROMPT =
  "You are an expert sommelier and culinary pairing specialist. Given a recipe, suggest an ideal dish pairing (e.g., wine, side dish, or dessert) that complements it. Respond concisely and elegantly. Do not use any markdown formatting or asterisks in your response.";

/** Extract likely dish names from pairing text for recipe link resolution. */
function extractDishNames(text: string): string[] {
  const names = new Set<string>();
  for (const m of text.matchAll(
    /^\d+[\.\)]\s*([A-Za-zÀ-ÿ\s\-']+?)(?=:|$|\n)/gm
  )) {
    const n = m[1].trim();
    if (n.length >= 2 && n.length <= 60) names.add(n);
  }
  for (const m of text.matchAll(/\*\*([^*]+)\*\*/g)) {
    const n = m[1].trim();
    if (n.length >= 2 && n.length <= 60) names.add(n);
  }
  return [...names];
}

async function findRecipeLink(
  dishName: string
): Promise<{ id: string; recipeTitle: string } | null> {
  const results = await getSimilarRecipes("pairing-link", dishName, 1, {
    searchText: dishName,
  });
  if (results.length === 0) return null;
  const top = results[0];
  const titleLower = (top.recipeTitle || "").toLowerCase();
  const searchLower = dishName.toLowerCase();
  if (
    titleLower.includes(searchLower) ||
    searchLower.includes(titleLower) ||
    titleLower.split(/\s+/).some((w) => searchLower.includes(w))
  ) {
    return { id: top.id, recipeTitle: top.recipeTitle };
  }
  return null;
}

async function resolveRecipeLinks(
  suggestion: string
): Promise<{ name: string; recipeId: string; url: string }[]> {
  const names = extractDishNames(suggestion);
  const links: { name: string; recipeId: string; url: string }[] = [];
  const seen = new Set<string>();

  for (const name of names) {
    if (seen.has(name.toLowerCase())) continue;
    try {
      const match = await findRecipeLink(name);
      if (match && !seen.has(match.id)) {
        seen.add(name.toLowerCase());
        seen.add(match.id);
        links.push({
          name,
          recipeId: match.id,
          url: `https://www.babaselo.com/recipe/${match.id}`,
        });
      }
    } catch {
      /* ignore per-dish lookup errors */
    }
  }
  return links;
}

export async function POST(req: Request) {
  const { recipe } = await req.json();

  if (!recipe) {
    return NextResponse.json({ error: "No recipe provided" }, { status: 400 });
  }

  const recipeText =
    typeof recipe === "string" ? recipe : JSON.stringify(recipe);
  const cacheKey = recipeText.slice(0, 2000);

  try {
    const cached = await checkEnrichmentCache<{ suggestion: string }>(
      "pairing",
      cacheKey
    );
    if (cached?.suggestion) {
      const recipeLinks = await resolveRecipeLinks(cached.suggestion);
      return NextResponse.json({
        suggestion: cached.suggestion,
        ...(recipeLinks.length > 0 && { recipeLinks }),
      });
    }
  } catch (err) {
    console.error("Enrichment cache lookup failed:", err);
  }

  try {
    const suggestion = await callLLM(SYSTEM_PROMPT, recipeText, {
      temperature: 0.7,
    });

    storeEnrichmentCache("pairing", cacheKey, { suggestion }).catch((err) =>
      console.error("Failed to store pairing cache:", err)
    );

    let recipeLinks: { name: string; recipeId: string; url: string }[] = [];
    try {
      recipeLinks = await resolveRecipeLinks(suggestion);
    } catch {
      /* recipe link resolution is best-effort */
    }

    return NextResponse.json({
      suggestion: suggestion || "No pairing suggestion available.",
      ...(recipeLinks.length > 0 && { recipeLinks }),
    });
  } catch (error) {
    console.error("Error calling LLM for pairing:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
