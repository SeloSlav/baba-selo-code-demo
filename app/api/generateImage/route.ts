import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
        }

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `${prompt}. Make it photorealistic, high quality, with attention to detail.`,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "natural"
        });

        if (!response.data?.[0]?.url) {
            throw new Error("No image URL in response");
        }

        return NextResponse.json({
            imageUrl: response.data[0].url,
            revisedPrompt: response.data[0].revised_prompt
        });
    } catch (error) {
        console.error('Error generating image:', error);
        return NextResponse.json(
            { error: "Failed to generate image" },
            { status: 500 }
        );
    }
} 