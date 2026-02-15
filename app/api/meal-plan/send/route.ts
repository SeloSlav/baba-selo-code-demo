import { NextResponse } from 'next/server';
import { admin } from '../../../firebase/firebaseAdmin';
import { Resend } from 'resend';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.MEAL_PLAN_FROM_EMAIL || 'Baba Selo <onboarding@resend.dev>';

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

    if (plan !== 'pro') {
      return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'No email address found' }, { status: 400 });
    }

    const dietaryPreferences = userData?.dietaryPreferences || [];
    const preferredCookingOil = userData?.preferredCookingOil || 'olive oil';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      temperature: 0.8,
      messages: [
        {
          role: 'system',
          content: `You are Baba Selo. Create a daily meal plan. Format:
Breakfast: [dish] - [brief description]
Lunch: [dish] - [brief description]
Dinner: [dish] - [brief description]
Snack: [suggestion]

Use ${preferredCookingOil}. Dietary: ${(dietaryPreferences as string[]).join(', ') || 'none'}. Add a Baba tip at the end.`,
        },
        { role: 'user', content: "Today's meal plan, please!" },
      ],
    });

    const mealPlan = completion.choices?.[0]?.message?.content || '';

    if (!resend) {
      return NextResponse.json({ mealPlan, emailSent: false, message: 'Email not configured' });
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "Baba Selo's Daily Meal Plan",
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your Daily Meal Plan from Baba Selo</h2>
          <p>Hello dear! Here's what I've planned for you today:</p>
          <pre style="white-space: pre-wrap; background: #f9f9f9; padding: 1rem; border-radius: 8px;">${mealPlan.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          <p style="margin-top: 1.5rem; color: #666;">With love,<br/>Baba Selo</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ mealPlan, emailSent: false, error: String(error) }, { status: 500 });
    }

    return NextResponse.json({ mealPlan, emailSent: true });
  } catch (error) {
    console.error('Send meal plan error:', error);
    return NextResponse.json({ error: 'Failed to send meal plan' }, { status: 500 });
  }
}
