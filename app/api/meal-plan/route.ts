import { NextResponse } from 'next/server';
import { admin } from '../../firebase/firebaseAdmin';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    // Admin bypass for Plan Debug toggle (admins can test Pro features)
    const adminDoc = await admin.firestore().collection('admins').doc(userId).get();
    const isAdmin = adminDoc.exists && adminDoc.data()?.active === true;

    if (plan !== 'pro' && !isAdmin) {
      return NextResponse.json({ error: 'Pro subscription required for custom meal plans' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { mealPlanPrompt: bodyPrompt, dietaryPreferences = [], preferredCookingOil = 'olive oil', days = 1 } = body;

    const promptFromBody = (bodyPrompt || '').trim();
    const promptFromUser = (userData?.mealPlanPrompt || '').trim();
    const mealPlanPrompt = promptFromBody || promptFromUser;

    const prefs = Array.isArray(dietaryPreferences) ? dietaryPreferences : [];
    const oil = String(preferredCookingOil || 'olive oil');
    const numDays = Math.min(Math.max(1, Number(days) || 1), 7);

    const preferenceContext = mealPlanPrompt
      ? `The user's preferences (in their own words): ${mealPlanPrompt}`
      : `Use ${oil} as the primary cooking oil. Respect dietary preferences: ${prefs.join(', ') || 'none specified'}.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      temperature: 0.8,
      messages: [
        {
          role: 'system',
          content: `You are Baba Selo, a warm grandmother from Eastern Europe who loves to plan meals. Create a personalized meal plan in a friendly, grandmotherly tone.

Format your response as:
- Day 1: [day name]
  Breakfast: [dish name] - [brief description]
  Lunch: [dish name] - [brief description]
  Dinner: [dish name] - [brief description]
  Snack (optional): [suggestion]

Repeat for each day. ${preferenceContext} Keep each meal description to 1-2 sentences. Add a short Baba-style tip at the end.`,
        },
        {
          role: 'user',
          content: `Create a ${numDays}-day meal plan for me, dear.`,
        },
      ],
    });

    const mealPlan = completion.choices?.[0]?.message?.content || '';

    return NextResponse.json({ mealPlan });
  } catch (error) {
    console.error('Meal plan error:', error);
    return NextResponse.json({ error: 'Failed to generate meal plan' }, { status: 500 });
  }
}
