// app/api/conversations/[conversationId]/route.js
import { NextResponse } from 'next/server';
import dotenv from 'dotenv';
dotenv.config();

export async function GET(req) {
  const conversationId = req.params.conversationId;

  console.log('API Key:', process.env.ELEVENLABS_API_KEY);

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': `sk_38cfbd994d56bd8be5310b8ce0ff2503248d1433200a1e07`,
      },
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching conversation transcript:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation transcript' }, { status: 500 });
  }
}
