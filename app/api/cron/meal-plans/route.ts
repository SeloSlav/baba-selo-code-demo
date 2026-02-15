import { NextResponse } from 'next/server';
import { admin } from '../../../firebase/firebaseAdmin';
import OpenAI from 'openai';
import { Resend } from 'resend';

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
const CRON_SECRET = process.env.CRON_SECRET;

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT || 3000}`;
}

export async function GET(req: Request) {
  if (CRON_SECRET && req.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json({ message: 'Email not configured' });
  }

  function getLocalTimeInTimezone(date: Date, timeZone: string): { hour: number; minute: number; dayOfWeek: number } {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'short',
        hour12: false,
      });
      const parts = formatter.formatToParts(date);
      const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return {
        hour: parseInt(get('hour'), 10),
        minute: parseInt(get('minute'), 10),
        dayOfWeek: Math.max(0, dayNames.indexOf(get('weekday'))),
      };
    } catch {
      return { hour: date.getUTCHours(), minute: date.getUTCMinutes(), dayOfWeek: date.getUTCDay() };
    }
  }

  try {
    const usersSnapshot = await admin.firestore().collection('users').get();
    const now = new Date();

    let sent = 0;
    for (const doc of usersSnapshot.docs) {
      const d = doc.data();
      if (d.plan !== 'pro') continue;

      const schedule = d.mealPlanSchedule;
      if (!schedule?.enabled || !schedule?.time) continue;

      const timeZone = schedule.timezone || 'UTC';
      const local = getLocalTimeInTimezone(now, timeZone);
      const nowStr = `${local.hour.toString().padStart(2, '0')}:${local.minute.toString().padStart(2, '0')}`;

      const planType = d.mealPlanType || 'daily';
      if (planType === 'weekly') {
        const dayOfWeek = schedule.dayOfWeek ?? 6; // default Saturday
        if (local.dayOfWeek !== dayOfWeek) continue;
      }

      const [schedHour, schedMin] = String(schedule.time).split(':').map(Number);
      const scheduleStr = `${schedHour.toString().padStart(2, '0')}:${(schedMin || 0).toString().padStart(2, '0')}`;
      if (scheduleStr !== nowStr) continue;

      const email = d.email || (await admin.auth().getUser(doc.id).catch(() => null))?.email;
      if (!email) continue;

      const mealPlanPrompt = (d.mealPlanPrompt || '').trim();
      const ingredientsOnHand = (d.ingredientsOnHand || '').trim();
      const dietaryPreferences = d.dietaryPreferences || [];
      const preferredCookingOil = d.preferredCookingOil || 'olive oil';
      const includeShoppingList = d.includeShoppingList ?? true;
      const calorieTarget = d.mealPlanCalorieTarget;

      const preferenceContext = mealPlanPrompt
        ? `The user's preferences (in their own words): ${mealPlanPrompt}`
        : `Use ${preferredCookingOil}. Dietary: ${(dietaryPreferences as string[]).join(', ') || 'none'}.`;

      const ingredientsContext = ingredientsOnHand
        ? ` The user has these ingredients on hand—prioritize recipes that use them: ${ingredientsOnHand}.`
        : '';

      const calorieContext = calorieTarget && typeof calorieTarget === 'number' && calorieTarget >= 800 && calorieTarget <= 4000
        ? ` CALORIE TARGET: The user aims for approximately ${calorieTarget} calories per day. Choose dishes that fit within this budget. Typical splits: breakfast ~${Math.round(calorieTarget * 0.2)}, lunch ~${Math.round(calorieTarget * 0.35)}, dinner ~${Math.round(calorieTarget * 0.4)}, snack ~${Math.round(calorieTarget * 0.05)}. Prefer lighter dishes if needed to stay within the target.`
        : '';

      const isWeekly = planType === 'weekly';
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

      const isEveningDelivery = !isWeekly && schedHour >= 18;
      const dailyPrompt = isEveningDelivery ? "Tomorrow's meal plan!" : "Today's meal plan!";

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: isWeekly ? 4000 : 2500,
        temperature: 0.8,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: isWeekly ? "This week's meal plan!" : dailyPrompt },
        ],
      });

      const rawContent = completion.choices?.[0]?.message?.content || '{}';
      let parsed: { babaTip?: string; slots?: { timeSlot: string; recipeName: string; description: string }[]; days?: { day: number; dayName: string; slots: { timeSlot: string; recipeName: string; description: string }[] }[]; shoppingList?: string };
      try {
        parsed = JSON.parse(rawContent);
      } catch {
        parsed = { babaTip: rawContent, slots: [] };
      }

      const firestore = admin.firestore();
      const recipesCol = firestore.collection('recipes');
      const historyCol = firestore.collection('users').doc(doc.id).collection('mealPlanHistory');

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
          userId: doc.id,
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
        await historyCol.add(historyDoc);
      } catch (e) {
        console.error('Failed to save meal plan to history:', e);
      }

      try {
        const { error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: [email],
          subject,
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
              <h2>${isWeekly ? 'Your Weekly Meal Plan' : 'Your Daily Meal Plan'} from Baba Selo</h2>
              <p>Hello dear! Here's what I've planned for you${isWeekly ? ' this week' : ' today'}:</p>
              <pre style="white-space: pre-wrap; background: #f9f9f9; padding: 1rem; border-radius: 8px;">${plainContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
              <p style="margin-top: 1.5rem; color: #666;">With love, Baba Selo</p>
            </div>
          `,
        });
        if (error) console.error('Resend error for', email, error);
      } catch (e) {
        console.error('Failed to send meal plan email to', email, e);
      }

      sent++;
    }

    return NextResponse.json({ sent });
  } catch (error) {
    console.error('Cron meal plans error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
