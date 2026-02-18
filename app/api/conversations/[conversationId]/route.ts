import { NextResponse } from 'next/server';
import dotenv from 'dotenv';
dotenv.config();

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const conversationId = url.pathname.split('/').pop();

    if (!conversationId) {
      console.error('No conversationId provided');
      return NextResponse.json({ error: 'No conversationId provided' }, { status: 400 });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch conversation transcript: ${response.status} - ${response.statusText}`);
      return NextResponse.json({ error: `Failed to fetch conversation transcript: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    console.log('Transcript data fetched successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching conversation transcript:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation transcript' }, { status: 500 });
  }
}
