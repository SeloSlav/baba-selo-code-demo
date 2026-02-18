/**
 * Shared meal plan generation logic.
 * Used by: /api/meal-plan/send, /api/cron/meal-plans, and chat generate_meal_plan tool.
 * DRY: Single source of truth for creating meal plans with real recipes.
 */
import { admin } from '../firebase/firebaseAdmin';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT || 3000}`;
}

function formatPlanForEmail(
  parsed: {
    babaTip?: string;
    slots?: { timeSlot: string; recipeName: string; description: string }[];
    days?: { dayName: string; slots: { timeSlot: string; recipeName: string; description: string }[] }[];
    shoppingList?: string;
  },
  isWeekly: boolean
): string {
  const lines: string[] = [];
  if (isWeekly && parsed.days) {
    for (const day of parsed.days) {
      lines.push(`\n${day.dayName}:`);
      for (const s of day.slots || []) {
        lines.push(`  ${s.timeSlot.charAt(0).toUpperCase() + s.timeSlot.slice(1)}: ${s.recipeName} - ${s.description}`);
      }
    }
    if (parsed.shoppingList) lines.push(`\nSHOPPING LIST:\n${parsed.shoppingList}`);
  } else if (parsed.slots) {
    for (const s of parsed.slots) {
      lines.push(`${s.timeSlot.charAt(0).toUpperCase() + s.timeSlot.slice(1)}: ${s.recipeName} - ${s.description}`);
    }
  }
  if (parsed.babaTip) lines.push(`\nBaba Tip: ${parsed.babaTip}`);
  return lines.join('\n').trim();
}

export interface MealPlanServiceOptions {
  userId: string;
  mealPlanPrompt?: string;
  ingredientsOnHand?: string;
  calorieTarget?: number;
  dietaryPreferences?: string[];
  preferredCookingOil?: string;
  type?: 'weekly' | 'daily';
  includeShoppingList?: boolean;
  source?: 'mealPlan' | 'chat' | 'cron';
}

export interface MealPlanServiceResult {
  planId: string;
  plainContent: string;
  planTextWithLinks: string;
  storedDays: { day: number; dayName: string; slots: { timeSlot: string; recipeId: string; recipeName: string; description: string }[] }[];
  storedSlots: { timeSlot: string; recipeId: string; recipeName: string; description: string }[];
  babaTip: string;
  shoppingList?: string;
}

export async function generateMealPlanWithRecipes(
  options: MealPlanServiceOptions
): Promise<MealPlanServiceResult> {
  const {
    userId,
    mealPlanPrompt = '',
    ingredientsOnHand = '',
    calorieTarget,
    dietaryPreferences = [],
    preferredCookingOil = 'olive oil',
    type = 'weekly',
    includeShoppingList = true,
    source = 'mealPlan',
  } = options;

  const preferenceContext = mealPlanPrompt.trim()
    ? `The user's preferences (in their own words): ${mealPlanPrompt.trim()}`
    : `Use ${preferredCookingOil}. Dietary: ${(dietaryPreferences as string[]).join(', ') || 'none'}.`;

  const ingredientsContext = ingredientsOnHand.trim()
    ? ` The user has these ingredients on hand—prioritize recipes that use them: ${ingredientsOnHand.trim()}.`
    : '';

  const calorieContext =
    calorieTarget && typeof calorieTarget === 'number' && calorieTarget >= 800 && calorieTarget <= 4000
      ? ` CALORIE TARGET: The user aims for approximately ${calorieTarget} calories per day. Choose dishes that fit within this budget. Typical splits: breakfast ~${Math.round(calorieTarget * 0.2)}, lunch ~${Math.round(calorieTarget * 0.35)}, dinner ~${Math.round(calorieTarget * 0.4)}, snack ~${Math.round(calorieTarget * 0.05)}. Prefer lighter dishes if needed to stay within the target.`
      : '';

  const isWeekly = type === 'weekly';
  const systemContent = isWeekly
    ? `You are Baba Selo. Create a 7-day weekly meal plan with variety. Return a JSON object with this exact structure (no other text):
{
  "babaTip": "A warm Baba tip at the end",
  "shoppingList": "${includeShoppingList ? 'Consolidated shopping list by category (produce, dairy, pantry, etc.)' : 'omit this field'}",
  "days": [
    { "day": 1, "dayName": "Monday", "slots": [
      { "timeSlot": "breakfast", "recipeName": "Dish name", "description": "Brief description" },
      { "timeSlot": "lunch", "recipeName": "Dish name", "description": "Brief description" },
      { "timeSlot": "dinner", "recipeName": "Dish name", "description": "Brief description" }
    ]},
    ...repeat for days 2-7 (Tuesday through Sunday)
  ]
}
${preferenceContext}${ingredientsContext}${calorieContext}`
    : `You are Baba Selo. Create a daily meal plan. Return a JSON object with this exact structure (no other text):
{
  "babaTip": "A warm Baba tip at the end",
  "slots": [
    { "timeSlot": "breakfast", "recipeName": "Dish name", "description": "Brief description" },
    { "timeSlot": "lunch", "recipeName": "Dish name", "description": "Brief description" },
    { "timeSlot": "dinner", "recipeName": "Dish name", "description": "Brief description" },
    { "timeSlot": "snack", "recipeName": "Suggestion", "description": "Brief description" }
  ]
}
${preferenceContext}${ingredientsContext}${calorieContext}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: isWeekly ? 4000 : 2500,
    temperature: 0.8,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemContent },
      { role: 'user', content: isWeekly ? "This week's meal plan, please!" : "Today's meal plan, please!" },
    ],
  });

  const rawContent = completion.choices?.[0]?.message?.content || '{}';
  let parsed: {
    babaTip?: string;
    slots?: { timeSlot: string; recipeName: string; description: string }[];
    days?: { day: number; dayName: string; slots: { timeSlot: string; recipeName: string; description: string }[] }[];
    shoppingList?: string;
  };
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    parsed = { babaTip: rawContent, slots: [] };
  }

  const firestore = admin.firestore();
  const recipesCol = firestore.collection('recipes');
  const historyCol = firestore.collection('users').doc(userId).collection('mealPlanHistory');
  const baseUrl = getBaseUrl();

  const createRecipe = async (recipeName: string, description: string): Promise<string> => {
    const recipeContent = `${recipeName}\n\nDescription: ${description}`;
    let details: {
      ingredients?: string[];
      directions?: string[];
      cuisineType?: string;
      cookingDifficulty?: string;
      cookingTime?: string;
      diet?: string[];
      recipeSummary?: string;
      macroInfo?: unknown;
      dishPairings?: string;
    } | null = null;

    try {
      const genRes = await fetch(`${baseUrl}/api/generateRecipeDetails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeTitle: recipeName, recipeContent, generateAll: true }),
      });
      if (genRes.ok) {
        details = await genRes.json();
      }
    } catch (e) {
      console.error('Failed to generate recipe details for', recipeName, e);
    }

    const ingredients = details?.ingredients?.length ? details.ingredients : [description];
    const directions = details?.directions?.length ? details.directions : [description];
    const recipeContentFull = `${recipeName}\n\nIngredients:\n${ingredients.map((i) => `- ${i}`).join('\n')}\n\nDirections:\n${directions.map((d, i) => `${i + 1}. ${d}`).join('\n')}`;

    let macroInfo: unknown = details?.macroInfo ?? null;
    const macros = macroInfo as { total?: Record<string, unknown>; per_serving?: unknown } | null;
    if (macros?.total && macros?.per_serving) {
      macroInfo = {
        servings: 1,
        total: macros.total,
        per_serving: { ...macros.total },
      };
    }

    const recipeRef = await recipesCol.add({
      recipeTitle: recipeName,
      recipeContent: recipeContentFull,
      ingredients,
      directions,
      userId,
      cuisineType: details?.cuisineType || 'General',
      cookingDifficulty: details?.cookingDifficulty || 'medium',
      cookingTime: details?.cookingTime || '30 min',
      diet: Array.isArray(details?.diet) ? details.diet : [],
      source: 'mealPlan',
      mealPlanDescription: description,
      recipeSummary: details?.recipeSummary || '',
      macroInfo,
      dishPairings: details?.dishPairings || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return recipeRef.id;
  };

  const storedSlots: { timeSlot: string; recipeId: string; recipeName: string; description: string }[] = [];
  const storedDays: { day: number; dayName: string; slots: { timeSlot: string; recipeId: string; recipeName: string; description: string }[] }[] = [];
  const linkLines: string[] = [];

  if (isWeekly && parsed.days?.length) {
    for (const day of parsed.days) {
      const daySlots: { timeSlot: string; recipeId: string; recipeName: string; description: string }[] = [];
      const dayLines = [`**Day ${day.day}: ${day.dayName}**`];

      for (const slot of day.slots || []) {
        const recipeId = await createRecipe(slot.recipeName, slot.description);
        daySlots.push({ timeSlot: slot.timeSlot, recipeId, recipeName: slot.recipeName, description: slot.description });
        const link = `[${slot.recipeName}](/recipe/${recipeId})`;
        dayLines.push(`  ${slot.timeSlot.charAt(0).toUpperCase() + slot.timeSlot.slice(1)}: ${link} - ${slot.description}`);
      }

      storedDays.push({ day: day.day, dayName: day.dayName, slots: daySlots });
      linkLines.push(dayLines.join('\n'));
    }
  } else if (parsed.slots?.length) {
    for (const slot of parsed.slots) {
      const recipeId = await createRecipe(slot.recipeName, slot.description);
      storedSlots.push({ timeSlot: slot.timeSlot, recipeId, recipeName: slot.recipeName, description: slot.description });
      const link = `[${slot.recipeName}](/recipe/${recipeId})`;
      linkLines.push(`  ${slot.timeSlot.charAt(0).toUpperCase() + slot.timeSlot.slice(1)}: ${link} - ${slot.description}`);
    }
  }

  if (parsed.babaTip) linkLines.push(`\n**Baba's Tip:** ${parsed.babaTip}`);
  if (parsed.shoppingList) linkLines.push(`\n**Shopping List:**\n${parsed.shoppingList}`);

  const plainContent = formatPlanForEmail(parsed, isWeekly) || rawContent;
  const planTextWithLinks = linkLines.join('\n\n');

  const subject = isWeekly ? "Baba Selo's Weekly Meal Plan" : "Baba Selo's Daily Meal Plan";
  const historyDoc: Record<string, unknown> = {
    type: isWeekly ? 'weekly' : 'daily',
    content: plainContent,
    subject,
    babaTip: parsed.babaTip || '',
    slots: storedSlots,
    days: storedDays,
    source,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (parsed.shoppingList != null) historyDoc.shoppingList = parsed.shoppingList;

  const historyRef = await historyCol.add(historyDoc);

  return {
    planId: historyRef.id,
    plainContent,
    planTextWithLinks,
    storedDays,
    storedSlots,
    babaTip: parsed.babaTip || '',
    shoppingList: parsed.shoppingList,
  };
}
