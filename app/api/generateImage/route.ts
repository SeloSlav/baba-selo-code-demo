import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '../../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Image style options with their prompts - must match settings page
const imageStyleOptions = {
    "rustic-traditional": {
        prompt: "Create this in a rustic, traditional art style reminiscent of old European pen and ink drawings with watercolor washes on aged parchment paper. The style should be warm and charming, with a handcrafted feel like something a grandmother would lovingly sketch. Use a muted, earthy color palette with touches of warm browns, soft yellows, and gentle greens. Add subtle textures that suggest the grain of parchment paper and delicate ink lines. The overall effect should be nostalgic and heartwarming, like finding an old recipe book illustration."
    },
    "modern-cookbook": {
        prompt: "Create this in a modern cookbook photography style with clean, professional lighting. Use soft, natural light with subtle shadows to highlight textures and details. The style should be crisp and appetizing with a shallow depth of field effect. Add a hint of styled food photography elements like carefully placed herbs or droplets. The overall effect should be contemporary and magazine-worthy."
    },
    "vintage-poster": {
        prompt: "Create this in a vintage advertising poster style from the 1950s-60s. Use bold, saturated colors and simplified shapes with a slightly textured, printed look. The style should be reminiscent of mid-century commercial art with clean lines and graphic elements. Add subtle halftone patterns and slight misalignment effects to simulate vintage printing. The overall effect should be retro and cheerful."
    },
    "whimsical-cartoon": {
        prompt: "Create this in a whimsical, animated style with exaggerated, friendly features. Use bright, cheerful colors and smooth, rounded shapes. The style should be reminiscent of modern animated films with a touch of Studio Ghibli charm. Add subtle textures and warm lighting effects. The overall effect should be playful and inviting."
    }
};

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
    try {
        const { prompt, userId } = await req.json();
        console.log("Received request with userId:", userId);

        if (!prompt) {
            return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
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