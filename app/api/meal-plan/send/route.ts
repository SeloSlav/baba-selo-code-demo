import { NextResponse } from 'next/server';
import { admin } from '../../../firebase/firebaseAdmin';
import { Resend } from 'resend';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function formatPlanForEmail(
  parsed: { babaTip?: string; slots?: { timeSlot: string; recipeName: string; description: string }[]; days?: { dayName: string; slots: { timeSlot: string; recipeName: string; description: string }[] }[]; shoppingList?: string },
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
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.MEAL_PLAN_FROM_EMAIL || 'Baba Selo <onboarding@resend.dev>';

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT || 3000}`;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    const userId = decoded.uid;

    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    const plan = userData?.plan ?? 'free';
    const email = decoded.email || userData?.email;

    // Admin bypass for Plan Debug toggle (admins can test Pro features)
    const adminDoc = await admin.firestore().collection('admins').doc(userId).get();
    const isAdmin = adminDoc.exists && adminDoc.data()?.active === true;

    if (plan !== 'pro' && !isAdmin) {
      return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'No email address found' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const type = body.type || userData?.mealPlanType || 'daily';
    const includeShoppingList = body.includeShoppingList ?? userData?.includeShoppingList ?? (type === 'weekly');
    const calorieTarget = body.calorieTarget ?? userData?.mealPlanCalorieTarget;

    const mealPlanPrompt = (userData?.mealPlanPrompt || '').trim();
    const ingredientsOnHand = (body.ingredientsOnHand || userData?.ingredientsOnHand || '').trim();
    const dietaryPreferences = userData?.dietaryPreferences || [];
    const preferredCookingOil = userData?.preferredCookingOil || 'olive oil';

    const preferenceContext = mealPlanPrompt
      ? `The user's preferences (in their own words): ${mealPlanPrompt}`
      : `Use ${preferredCookingOil}. Dietary: ${(dietaryPreferences as string[]).join(', ') || 'none'}.`;

    const ingredientsContext = ingredientsOnHand
      ? ` The user has these ingredients on hand—prioritize recipes that use them: ${ingredientsOnHand}.`
      : '';

    const calorieContext = calorieTarget && typeof calorieTarget === 'number' && calorieTarget >= 800 && calorieTarget <= 4000
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
    let parsed: { babaTip?: string; slots?: { timeSlot: string; recipeName: string; description: string }[]; days?: { day: number; dayName: string; slots: { timeSlot: string; recipeName: string; description: string }[] }[]; shoppingList?: string };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      // Fallback: treat as plain text for backward compatibility
      parsed = { babaTip: rawContent, slots: [] };
    }

    const firestore = admin.firestore();
    const recipesCol = firestore.collection('recipes');
    const historyCol = firestore.collection('users').doc(userId).collection('mealPlanHistory');

    const createRecipe = async (recipeName: string, description: string): Promise<string> => {
      const baseUrl = getBaseUrl();
      const recipeContent = `${recipeName}\n\nDescription: ${description}`;
      let details: { ingredients?: string[]; directions?: string[]; cuisineType?: string; cookingDifficulty?: string; cookingTime?: string; diet?: string[]; recipeSummary?: string; macroInfo?: unknown; dishPairings?: string } | null = null;

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

    let storedSlots: { timeSlot: string; recipeId: string; recipeName: string; description: string }[] = [];
    let storedDays: { day: number; dayName: string; slots: { timeSlot: string; recipeId: string; recipeName: string; description: string }[] }[] = [];
    let plainContent = '';

    if (isWeekly && parsed.days?.length) {
      for (const day of parsed.days) {
        const daySlots: { timeSlot: string; recipeId: string; recipeName: string; description: string }[] = [];
        for (const slot of day.slots || []) {
          const recipeId = await createRecipe(slot.recipeName, slot.description);
          daySlots.push({ timeSlot: slot.timeSlot, recipeId, recipeName: slot.recipeName, description: slot.description });
        }
        storedDays.push({ day: day.day, dayName: day.dayName, slots: daySlots });
      }
      plainContent = formatPlanForEmail(parsed, true);
    } else if (parsed.slots?.length) {
      for (const slot of parsed.slots) {
        const recipeId = await createRecipe(slot.recipeName, slot.description);
        storedSlots.push({ timeSlot: slot.timeSlot, recipeId, recipeName: slot.recipeName, description: slot.description });
      }
      plainContent = formatPlanForEmail(parsed, false);
    } else {
      plainContent = rawContent;
    }

    const subject = isWeekly ? "Baba Selo's Weekly Meal Plan" : "Baba Selo's Daily Meal Plan";

    let planId: string | undefined;
    try {
      const historyDoc: Record<string, unknown> = {
        type: isWeekly ? 'weekly' : 'daily',
        content: plainContent,
        subject,
        babaTip: parsed.babaTip || '',
        slots: storedSlots,
        days: storedDays,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (parsed.shoppingList != null) historyDoc.shoppingList = parsed.shoppingList;
      const historyRef = await historyCol.add(historyDoc);
      planId = historyRef.id;
    } catch (e) {
      console.error('Failed to save meal plan to history:', e);
    }

    if (!resend) {
      return NextResponse.json({ mealPlan: plainContent, emailSent: false, message: 'Email not configured', planId });
    }
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${isWeekly ? 'Your Weekly Meal Plan' : 'Your Daily Meal Plan'} from Baba Selo</h2>
          <p>Hello dear! Here's what I've planned for you${isWeekly ? ' this week' : ' today'}:</p>
          <pre style="white-space: pre-wrap; background: #f9f9f9; padding: 1rem; border-radius: 8px;">${plainContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          <p style="margin-top: 1.5rem; color: #666;">With love,<br/>Baba Selo</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ mealPlan: plainContent, emailSent: false, message: 'Email not sent (API key invalid or not configured)', planId });
    }

    return NextResponse.json({ mealPlan: plainContent, emailSent: true, planId });
  } catch (error) {
    console.error('Send meal plan error:', error);
    return NextResponse.json({ error: 'Failed to send meal plan' }, { status: 500 });
  }
}
