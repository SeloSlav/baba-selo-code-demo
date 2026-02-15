import { NextResponse } from 'next/server';
import { admin } from '../../../firebase/firebaseAdmin';
import OpenAI from 'openai';
import { Resend } from 'resend';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.MEAL_PLAN_FROM_EMAIL || 'Baba Selo <onboarding@resend.dev>';
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  if (CRON_SECRET && req.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json({ message: 'Email not configured' });
  }

  try {
    const usersSnapshot = await admin.firestore().collection('users').get();
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const nowStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    let sent = 0;
    for (const doc of usersSnapshot.docs) {
      const d = doc.data();
      if (d.plan !== 'pro') continue;

      const schedule = d.mealPlanSchedule;
      if (!schedule?.enabled || !schedule?.time) continue;

      const [h, m] = String(schedule.time).split(':').map(Number);
      const scheduleStr = `${h.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
      if (scheduleStr !== nowStr) continue;

      const email = d.email || (await admin.auth().getUser(doc.id).catch(() => null))?.email;
      if (!email) continue;

      const dietaryPreferences = d.dietaryPreferences || [];
      const preferredCookingOil = d.preferredCookingOil || 'olive oil';

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
Use ${preferredCookingOil}. Dietary: ${(dietaryPreferences as string[]).join(', ') || 'none'}. Add a Baba tip.`,
          },
          { role: 'user', content: "Today's meal plan!" },
        ],
      });

      const mealPlan = completion.choices?.[0]?.message?.content || '';

      await resend.emails.send({
        from: FROM_EMAIL,
        to: [email],
        subject: "Baba Selo's Daily Meal Plan",
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
            <h2>Your Daily Meal Plan from Baba Selo</h2>
            <p>Hello dear! Here's what I've planned for you today:</p>
            <pre style="white-space: pre-wrap; background: #f9f9f9; padding: 1rem; border-radius: 8px;">${mealPlan.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            <p style="margin-top: 1.5rem; color: #666;">With love, Baba Selo</p>
          </div>
        `,
      });

      sent++;
    }

    return NextResponse.json({ sent });
  } catch (error) {
    console.error('Cron meal plans error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
