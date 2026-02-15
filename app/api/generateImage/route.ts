import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { admin } from '../../firebase/firebaseAdmin';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { SpoonPointSystem } from '../../lib/spoonPoints';

// Image style options - must match settings page (platform & vibe focused)
const imageStyleOptions: Record<string, { prompt: string }> = {
    "photorealistic-recipe": {
        prompt: "Photorealistic food photograph. Natural lighting, authentic styling, realistic textures. Professional food photography—genuine and appetizing. No artificial or exaggerated elements."
    },
    "instagram-flatlay": {
        prompt: "Overhead flat-lay food photography for Instagram. Bird's-eye view, clean composition, minimal props, marble or wood surface. Soft natural light, shallow depth of field. Aesthetic, fresh, organized, highly shareable."
    },
    "bright-viral": {
        prompt: "Viral social media food photography. Bright punchy lighting, saturated colors, slight 45° angle. Steam rising if applicable. Fresh, eye-catching, thumbnail-worthy. The kind of food shot that gets saved and shared."
    },
    "dark-moody": {
        prompt: "Dark moody food photography. Deep shadows, dramatic side lighting, dark charcoal or black background. Sophisticated, atmospheric. Rich colors, fine dining editorial. Moody food blogger aesthetic."
    },
    "pinterest-cozy": {
        prompt: "Cozy Pinterest-style food photography. Warm natural light, kitchen or dining table setting. Steam rising, casual plating, linen napkin or wooden cutting board. Aspirational but approachable. Recipe blog aesthetic."
    },
    "minimalist-white": {
        prompt: "Minimalist food photography on pure white background. Clean elegant plating, soft diffused lighting, no distractions. Sophisticated—like a high-end restaurant menu or cookbook cover."
    },
    "golden-hour": {
        prompt: "Food photography in golden hour lighting. Warm sunset glow through window, soft shadows, romantic restaurant ambiance. Dish bathed in amber light. Elegant, inviting, magazine-quality."
    },
    "street-food": {
        prompt: "Authentic street food photography. Casual setting—paper plate, market stall, or food truck. Natural daylight, unpretentious plating. Real, approachable, the way food actually looks when you buy it. No fancy styling."
    },
    "vintage-retro": {
        prompt: "Vintage 1970s-80s cookbook food photography. Slightly faded warm tones, retro styling, old-fashioned plating. Nostalgic charm—like a well-loved recipe card from grandma's kitchen."
    },
    "whimsical-cartoon": {
        prompt: "Whimsical animated food illustration. Bright cheerful colors, smooth rounded shapes. Studio Ghibli-inspired charm. Playful, friendly, inviting—like food from an animated film."
    }
};

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Define storageBucketName from env var
const storageBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

// Ensure Firebase Admin is initialized (this might be redundant if already done globally)
if (!getApps().length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)
        initializeApp({
            credential: cert(serviceAccount),
            storageBucket: storageBucketName // Keep config here for clarity or potential direct use
        });
         console.log("Firebase Admin SDK initialized locally in generateImage route.");
    } catch (error) {
        console.error("Local Firebase Admin SDK initialization error in generateImage:", error);
        // Handle error appropriately, maybe return 500
    }
}

export async function POST(req: Request) {
    try {
        const { prompt, userId, recipeId } = await req.json();
        console.log("Received request with userId:", userId);

        if (!prompt || !recipeId) {
            return NextResponse.json({ 
                error: "Missing prompt or recipeId",
                message: "Something went wrong. Please try again."
            }, { status: 400 });
        }

        // Check if user can generate an image (cooldown/limits) but don't block generation
        let canAwardPoints = false;
        if (userId) {
            const actionCheck = await SpoonPointSystem.isActionAvailable(
                userId,
                'GENERATE_IMAGE',
                recipeId
            );
            canAwardPoints = actionCheck.available;
        }

        // Get user's preferred style from Firebase (Admin SDK for server-side read)
        let stylePrompt = imageStyleOptions["photorealistic-recipe"].prompt; // Default style
        if (userId) {
            try {
                const userDoc = await admin.firestore().collection('users').doc(userId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const userStyle = userData?.preferredImageStyle;
                    if (userStyle && imageStyleOptions[userStyle]) {
                        stylePrompt = imageStyleOptions[userStyle].prompt;
                    }
                }
            } catch (error) {
                console.error("Error fetching user style preference:", error);
                // Continue with default style if there's an error
            }
        }

        console.log("Final style prompt being used:", stylePrompt);

        // Generate image with DALL-E 3 (standard quality for speed; natural style for photorealistic output)
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `${prompt}. ${stylePrompt}`,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "natural"  // More photorealistic than "vivid"
        });

        if (!response.data?.[0]?.url) {
            return NextResponse.json({
                error: "No image URL in response",
                message: "Failed to generate image. Please try again."
            }, { status: 500 });
        }

        // Download the image
        const imageResponse = await fetch(response.data[0].url);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        // Upload to Firebase Storage
        if (!storageBucketName) {
             console.error("Storage Bucket Name is not configured in environment variables.");
             return NextResponse.json({ error: "Server configuration error for storage.", message: "Image generated but failed to save."}, { status: 500 });
        }
        const bucket = getStorage().bucket(storageBucketName);
        const file = bucket.file(`recipe-images/${recipeId}.png`);
        
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
            revisedPrompt: response.data[0].revised_prompt,
            canAwardPoints
        });
    } catch (error) {
        console.error('Error generating image:', error);
        // Check if it's the bucket error
        if (error.message && error.message.includes("Bucket name not specified")) {
             return NextResponse.json({
                error: "Storage configuration error",
                message: "Image generated but could not be saved due to server configuration."
            }, { status: 500 });
        }
        return NextResponse.json({
            error: "Failed to generate image",
            message: "Something went wrong while generating the image. Please try again later."
        }, { status: 500 });
    }
} 