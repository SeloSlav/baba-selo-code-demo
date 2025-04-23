import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '../../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { SpoonPointSystem } from '../../lib/spoonPoints';

// Image style options with their prompts - must match settings page
const imageStyleOptions = {
    "rustic-traditional": {
        prompt: "Create this in a rustic, traditional style with a focus on the food's homemade appeal. The dish should be presented on richly detailed traditional tablecloths with classic red and white embroidery patterns. Capture the food with soft, warm natural lighting that highlights its hearty, homestyle qualities. Use deep reds and cream whites in the food styling, with rustic garnishes and traditional serving pieces. The food should look lovingly prepared, with the kind of imperfect, handmade touches that make traditional cooking so appealing. The overall effect should make the food appear nostalgic and heartwarming, like a cherished family recipe brought to life."
    },
    "modern-cookbook": {
        prompt: "Create this in a modern cookbook photography style with clean, professional lighting. Use soft, natural light with subtle shadows to highlight textures and details. The style should be crisp and appetizing with a shallow depth of field effect. Add a hint of styled food photography elements like carefully placed herbs or droplets. The overall effect should be contemporary and magazine-worthy."
    },
    "social-snap": {
        prompt: "Create this in a modern social media photography style. Use bright, even lighting with enhanced dynamic range to capture rich details and textures. Frame the shot from a slightly elevated angle with a lifestyle-focused composition. The colors should be vibrant yet natural, with crisp details and subtle depth of field. Add gentle highlights to create an appetizing glow, making the food look fresh and inviting. The overall effect should feel contemporary and shareable, like a professional food influencer's content."
    },
    "whimsical-cartoon": {
        prompt: "Create this in a whimsical, animated style with exaggerated, friendly features. Use bright, cheerful colors and smooth, rounded shapes. The style should be reminiscent of modern animated films with a touch of Studio Ghibli charm. Add subtle textures and warm lighting effects. The overall effect should be playful and inviting."
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

        // Get user's preferred style from Firebase
        let stylePrompt = imageStyleOptions["rustic-traditional"].prompt; // Default style
        if (userId) {
            try {
                console.log("Fetching user preferences for userId:", userId);
                const userDocRef = doc(db, "users", userId);
                const userDocSnap = await getDoc(userDocRef);
                console.log("User doc exists:", userDocSnap.exists());
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    console.log("User data:", userData);
                    const userStyle = userData.preferredImageStyle;
                    console.log("User's preferred style:", userStyle);
                    if (userStyle && imageStyleOptions[userStyle]) {
                        stylePrompt = imageStyleOptions[userStyle].prompt;
                        console.log("Using style prompt:", userStyle);
                    } else {
                        console.log("No valid style found, using default");
                    }
                }
            } catch (error) {
                console.error("Error fetching user style preference:", error);
                // Continue with default style if there's an error
            }
        } else {
            console.log("No userId provided, using default style");
        }

        console.log("Final style prompt being used:", stylePrompt);

        // Generate image with DALL-E
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `${prompt}. ${stylePrompt}`,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "vivid"
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