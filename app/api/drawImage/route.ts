import { NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

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

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

        const res = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-image-1',
                prompt,
                n: 1,
                size: '1536x1024',
                quality: 'low',
                output_format: 'png',
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || `API error ${res.status}`);
        }

        const data = await res.json();
        const b64 = data?.data?.[0]?.b64_json;
        if (!b64) throw new Error("No image in response");

        const imageBuffer = Buffer.from(b64, 'base64');

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

        return NextResponse.json({ imageUrl: url });
    } catch (error) {
        console.error('Error generating image:', error);
        return NextResponse.json(
            { error: "Failed to generate image" },
            { status: 500 }
        );
    }
} 