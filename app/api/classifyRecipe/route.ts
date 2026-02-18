import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  let message = body.message;

  if (!message && (body.title || body.ingredients || body.directions)) {
    message = [
      body.title && `Recipe: ${body.title}`,
      body.ingredients && `Ingredients:\n${typeof body.ingredients === 'string' ? body.ingredients : (Array.isArray(body.ingredients) ? body.ingredients.join('\n') : '')}`,
      body.directions && `Directions:\n${typeof body.directions === 'string' ? body.directions : (Array.isArray(body.directions) ? body.directions.join('\n') : '')}`
    ].filter(Boolean).join('\n\n');
  }

  if (!message) {
    return NextResponse.json({ error: "No message provided" }, { status: 400 });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing OpenAI API key" }, { status: 500 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 300,
        temperature: 0.0,
        messages: [
          {
            role: "system",
            content: `You are a culinary classification expert. Given a recipe, return JSON with the following structure and rules:

{
  "diet": [...],        // See rules below
  "cuisine": "string",  // See rules below
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

Return only the JSON, no extra text.`
          },
          { role: "user", content: message }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      return NextResponse.json({ error: "Failed to classify recipe" }, { status: 500 });
    }

    const data = await response.json();
    let classification: { diet?: string[]; cuisine?: string; cooking_time?: string; difficulty?: string } = {};
    try {
      classification = JSON.parse(data.choices[0].message.content.trim());
    } catch (err) {
      console.error("Error parsing classification JSON:", err);
      return NextResponse.json({ error: "Invalid JSON from model" }, { status: 500 });
    }

    if (!classification.diet || !Array.isArray(classification.diet)) {
      return NextResponse.json({ error: "Missing or invalid diet field" }, { status: 500 });
    }
    if (!classification.cuisine || typeof classification.cuisine !== "string") {
      return NextResponse.json({ error: "Missing or invalid cuisine field" }, { status: 500 });
    }
    if (!classification.cooking_time || typeof classification.cooking_time !== "string") {
      return NextResponse.json({ error: "Missing or invalid cooking_time field" }, { status: 500 });
    }
    if (!classification.difficulty || typeof classification.difficulty !== "string") {
      return NextResponse.json({ error: "Missing or invalid difficulty field" }, { status: 500 });
    }

    const forbiddenWords = ["none", "standard"];
    const hasForbiddenWords = classification.diet.some((d: string) =>
      forbiddenWords.includes(d.toLowerCase())
    );
    if (hasForbiddenWords) {
      return NextResponse.json({ error: "Diet classification included forbidden words." }, { status: 500 });
    }

    const mainCategories = ["vegan", "vegetarian", "pescetarian", "omnivore", "carnivore", "keto"];
    const presentMainCats = classification.diet.filter((d: string) => mainCategories.includes(d.toLowerCase()));
    if (presentMainCats.length !== 1) {
      return NextResponse.json({ error: "Diet classification missing a clear single main category." }, { status: 500 });
    }

    const allowedDifficulties = ["easy", "medium", "hard"];
    if (!allowedDifficulties.includes(classification.difficulty!.toLowerCase())) {
      return NextResponse.json({ error: "Invalid difficulty. Must be easy, medium, or hard." }, { status: 500 });
    }

    const allowedTimes = ["15 minutes", "30 minutes", "45 minutes", "1 hour", "2 hours"];
    const cookingTimeLower = classification.cooking_time!.toLowerCase();
    const isValidTime = allowedTimes.some(t => t.toLowerCase() === cookingTimeLower);
    if (!isValidTime) {
      return NextResponse.json({ error: "Invalid cooking_time. Must be one of the predefined durations." }, { status: 500 });
    }

    return NextResponse.json(classification);
  } catch (error) {
    console.error("Error calling OpenAI for classification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
