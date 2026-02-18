import { NextResponse } from 'next/server';
import { admin } from '../../../firebase/firebaseAdmin';
import { Resend } from 'resend';
import { generateMealPlanWithRecipes } from '../../../lib/mealPlanService';

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
    const email = decoded.email || userData?.email;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'No email address found' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const type = (body.type || userData?.mealPlanType || 'weekly') as 'weekly' | 'daily';
    const includeShoppingList = body.includeShoppingList ?? userData?.includeShoppingList ?? (type === 'weekly');

    const result = await generateMealPlanWithRecipes({
      userId,
      mealPlanPrompt: (userData?.mealPlanPrompt || '').trim(),
      ingredientsOnHand: (body.ingredientsOnHand || userData?.ingredientsOnHand || '').trim(),
      calorieTarget: body.calorieTarget ?? userData?.mealPlanCalorieTarget,
      dietaryPreferences: userData?.dietaryPreferences || [],
      preferredCookingOil: userData?.preferredCookingOil || 'olive oil',
      type,
      includeShoppingList,
    });

    if (!resend) {
      return NextResponse.json({
        mealPlan: result.plainContent,
        emailSent: false,
        message: 'Email not configured',
        planId: result.planId,
      });
    }

    const isWeekly = type === 'weekly';
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: isWeekly ? "Baba Selo's Weekly Meal Plan" : "Baba Selo's Daily Meal Plan",
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${isWeekly ? 'Your Weekly Meal Plan' : 'Your Daily Meal Plan'} from Baba Selo</h2>
          <p>Hello dear! Here's what I've planned for you${isWeekly ? ' this week' : ' today'}:</p>
          <pre style="white-space: pre-wrap; background: #f9f9f9; padding: 1rem; border-radius: 8px;">${result.plainContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          <p style="margin-top: 1.5rem; color: #666;">With love,<br/>Baba Selo</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({
        mealPlan: result.plainContent,
        emailSent: false,
        message: 'Email not sent (API key invalid or not configured)',
        planId: result.planId,
      });
    }

    return NextResponse.json({
      mealPlan: result.plainContent,
      emailSent: true,
      planId: result.planId,
    });
  } catch (error) {
    console.error('Send meal plan error:', error);
    return NextResponse.json({ error: 'Failed to send meal plan' }, { status: 500 });
  }
}
