import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
    initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
}

export async function POST(req: Request) {
    try {
        const { prompt, userId, recipeId } = await req.json();
        console.log("Received request with userId:", userId);

        if (!prompt || !recipeId) {
            return NextResponse.json({ error: "Missing prompt or recipeId" }, { status: 400 });
        }

        // Generate image with DALL-E
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "vivid"
        });

        if (!response.data?.[0]?.url) {
            throw new Error("No image URL in response");
        }

        // Download the image
        const imageResponse = await fetch(response.data[0].url);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        // Upload to Firebase Storage
        const bucket = getStorage().bucket();
        const file = bucket.file(`recipe-images/${recipeId}`);
        
        await file.save(imageBuffer, {
            metadata: {
                contentType: 'image/png'
            }
        });

        // Get the public URL
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500' // Far future expiration
        });

        return NextResponse.json({
            imageUrl: url,
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