import { NextResponse } from "next/server";
import { callLLMJSON } from "../../lib/callLLM";
import {
  checkEnrichmentCache,
  storeEnrichmentCache,
} from "../../lib/stores/enrichmentCache";

interface Classification {
  diet: string[];
  cuisine: string;
  cooking_time: string;
  difficulty: string;
}

const SYSTEM_PROMPT = `You are a culinary classification expert. Given a recipe, return JSON with the following structure and rules:

{
  "diet": [...],
  "cuisine": "string",
  "cooking_time": "string",
  "difficulty": "string"
}

Diet rules:
- Pick exactly one main category from ["vegan", "vegetarian", "pescetarian", "omnivore", "carnivore", "keto"] that best matches the recipe.
- Then optionally add other dietary attributes that do not contradict the main category (e.g., "gluten-free", "dairy-free", "nut-free") if they naturally apply.
- Never return "none" or "standard". If unsure, pick a plausible main category (like "vegetarian").
- No contradictory labels. For example, do not combine "vegan" and "carnivore", or "vegan" and "vegetarian", or "vegetarian" and "dairy-free".
- Return diet as an array of strings.

Cuisine rules:
- Provide a single cuisine type as a string (e.g., "Eastern European", "Italian"). If unsure, pick a plausible cuisine.

Cooking time rules:
- "cooking_time" should be a single string chosen from ["15 minutes", "30 minutes", "45 minutes", "1 hour", "2 hours"].
- Choose a reasonable estimate based on the recipe. If unsure, pick something plausible.

Difficulty rules:
- "difficulty" should be one of ["easy", "medium", "hard"].
- If unsure, pick one that best matches the complexity of the recipe.

Return only the JSON, no extra text.`;

const ALLOWED_DIFFICULTIES = ["easy", "medium", "hard"];
const ALLOWED_TIMES = ["15 minutes", "30 minutes", "45 minutes", "1 hour", "2 hours"];
const MAIN_CATEGORIES = ["vegan", "vegetarian", "pescetarian", "omnivore", "carnivore", "keto"];

function validateClassification(c: Classification): string | null {
  if (!c.diet || !Array.isArray(c.diet)) return "Missing or invalid diet field";
  if (!c.cuisine || typeof c.cuisine !== "string") return "Missing or invalid cuisine field";
  if (!c.cooking_time || typeof c.cooking_time !== "string") return "Missing or invalid cooking_time field";
  if (!c.difficulty || typeof c.difficulty !== "string") return "Missing or invalid difficulty field";

  if (c.diet.some((d) => ["none", "standard"].includes(d.toLowerCase())))
    return "Diet classification included forbidden words.";

  const presentMain = c.diet.filter((d) => MAIN_CATEGORIES.includes(d.toLowerCase()));
  if (presentMain.length !== 1)
    return "Diet classification missing a clear single main category.";

  if (!ALLOWED_DIFFICULTIES.includes(c.difficulty.toLowerCase()))
    return "Invalid difficulty. Must be easy, medium, or hard.";

  if (!ALLOWED_TIMES.some((t) => t.toLowerCase() === c.cooking_time.toLowerCase()))
    return "Invalid cooking_time. Must be one of the predefined durations.";

  return null;
}

export async function POST(req: Request) {
  const body = await req.json();
  let message = body.message;

  if (!message && (body.title || body.ingredients || body.directions)) {
    message = [
      body.title && `Recipe: ${body.title}`,
      body.ingredients &&
        `Ingredients:\n${typeof body.ingredients === "string" ? body.ingredients : Array.isArray(body.ingredients) ? body.ingredients.join("\n") : ""}`,
      body.directions &&
        `Directions:\n${typeof body.directions === "string" ? body.directions : Array.isArray(body.directions) ? body.directions.join("\n") : ""}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (!message) {
    return NextResponse.json({ error: "No message provided" }, { status: 400 });
  }

  try {
    const cached = await checkEnrichmentCache<Classification>("classify", message);
    if (cached && !validateClassification(cached)) {
      return NextResponse.json(cached);
    }
  } catch (err) {
    console.error("Enrichment cache lookup failed:", err);
  }

  try {
    const classification = await callLLMJSON<Classification>(
      SYSTEM_PROMPT,
      message,
      { temperature: 0, maxTokens: 300 }
    );

    const error = validateClassification(classification);
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    storeEnrichmentCache("classify", message, classification).catch((err) =>
      console.error("Failed to store classify cache:", err)
    );

    return NextResponse.json(classification);
  } catch (error) {
    console.error("Error classifying recipe:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
