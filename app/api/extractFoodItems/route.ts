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
                    content: `You are a helpful assistant that identifies food items and dishes from text. 
                    
RULES:
1. Extract ONLY food items, dishes, and ingredients that could be used in recipes
2. EXCLUDE all beverages (wine, beer, cocktails, spirits, etc.)
3. EXCLUDE cooking methods or descriptive terms
4. Return ONLY the actual food items that someone might want a recipe for
5. Return the response as a JSON object with a single "items" array containing strings

Example input: "Pair with red wine and serve with Greek yogurt and roasted vegetables"
Correct response: {"items": ["Greek yogurt", "roasted vegetables"]}

Example input: "Serve with Muscat wine and baklava"
Correct response: {"items": ["baklava"]}

The response must be valid JSON with only the "items" array.`
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