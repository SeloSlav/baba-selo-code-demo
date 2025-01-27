import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
    try {
        const { text } = await request.json();

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that identifies food items and dishes from text. Extract only food items and dishes, excluding beverages like wine, beer, or cocktails. Return the items as a JSON array of strings."
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        return NextResponse.json(JSON.parse(response.choices[0].message.content));
    } catch (error) {
        console.error('Error extracting food items:', error);
        return NextResponse.json({ error: 'Failed to extract food items' }, { status: 500 });
    }
} 