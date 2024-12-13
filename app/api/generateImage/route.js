import { OpenAIApi, Configuration } from "openai";
import { storage } from "../../firebase/firebase"; // Import initialized storage
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Initialize OpenAI
const openai = new OpenAIApi(
    new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    })
);

export async function POST(req) {
    try {
        const body = await req.json();
        const { prompt, recipeId } = body;

        if (!prompt || !recipeId) {
            return new Response(
                JSON.stringify({ error: "Missing required fields: prompt or recipeId" }),
                { status: 400 }
            );
        }

        const validPrompt = prompt || "A placeholder image for a recipe";

        // Generate the image using OpenAI DALL·E
        const aiResponse = await openai.createImage({
            prompt: validPrompt,
            n: 1,
            size: "1024x1024", // Supported size
        });

        if (!aiResponse?.data?.data?.[0]?.url) {
            throw new Error("Invalid response from OpenAI API");
        }
        const imageUrl = aiResponse.data.data[0].url;

        // Fetch the image blob
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image from OpenAI: ${imageResponse.statusText}`);
        }
        const arrayBuffer = await imageResponse.arrayBuffer();
        const imageBlob = new Blob([arrayBuffer]);

        // Upload the image to Firebase Storage
        const storageRef = ref(storage, `/${recipeId}.png`);
        await uploadBytes(storageRef, imageBlob);

        // Get the Firebase Storage URL
        const uploadedImageUrl = await getDownloadURL(storageRef);

        return new Response(
            JSON.stringify({ imageUrl: uploadedImageUrl }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error generating or uploading image:", error.message);
        return new Response(
            JSON.stringify({ error: error.message || "Failed to generate or upload image" }),
            { status: 500 }
        );
    }
}
