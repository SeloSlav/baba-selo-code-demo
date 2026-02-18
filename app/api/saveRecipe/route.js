import { NextResponse } from 'next/server';
// REMOVE Client SDK imports for Firestore write
// import { db } from "../../firebase/firebase"; 
// import { doc, setDoc } from "firebase/firestore";
import { admin } from '../../firebase/firebaseAdmin'; // Import Firebase Admin SDK

// Get the Firestore instance from the Admin SDK
const adminDb = admin.firestore();

export async function POST(req) {
    let verifiedUserId;
    try {
        const authorization = req.headers.get('authorization');
        if (!authorization?.startsWith('Bearer ')) {
            // Allow anonymous writes if no token is provided, maybe? Or enforce login?
            // For now, let's assume anonymous writes might be intended if no token.
            // If strict auth is needed, return 401 here.
            // console.warn("No auth token provided for saveRecipe");
            // verifiedUserId = 'anonymous'; // Or handle as error
            // Let's enforce authentication for saving recipes:
             return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
        }
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        verifiedUserId = decodedToken.uid; // Use this verified UID
    } catch (error) {
        console.error("Auth Error in saveRecipe:", error);
        // If token is expired or invalid, return 401
        return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    }

    // Now use verifiedUserId instead of userId from body
    const {
        recipeContent,
        // userId, // REMOVED: Don't use userId from body
        cuisineType,
        cookingDifficulty,
        cookingTime,
        diet,
        docId // Ensure docId is still passed if needed
    } = await req.json();

    // Ensure docId is provided since we use setDoc
    if (!recipeContent || !docId) {
        return NextResponse.json({ error: "Missing recipe content or document ID" }, { status: 400 });
    }

    try {
        // Robust parser: handles "Ingredients:", commentary before recipe, mixed formats
        const parseRecipe = (text) => {
            const raw = (text || "").trim();
            const lower = raw.toLowerCase();
            const ingPos = lower.indexOf("ingredients");
            const dirPos = lower.indexOf("directions");

            if (ingPos === -1 || dirPos === -1 || dirPos <= ingPos) {
                return { recipeTitle: raw.split("\n")[0]?.trim() || "Untitled Recipe", ingredients: [], directions: [] };
            }

            const ingredientsBlock = raw.slice(ingPos + 11, dirPos).trim();
            const directionsBlock = raw.slice(dirPos + 10).trim();

            const ingredients = [];
            for (const line of ingredientsBlock.split("\n")) {
                const parts = line.split(/(?=\s*[-•*]\s+)/);
                for (const p of parts) {
                    const cleaned = p.replace(/^[\s\-•*]+\s*/, "").trim();
                    if (cleaned && !cleaned.toLowerCase().startsWith("equipment") && cleaned.length > 2) {
                        ingredients.push(cleaned);
                    }
                }
            }

            const directions = [];
            for (const line of directionsBlock.split("\n")) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                const cleaned = trimmed.replace(/^\d+[\.\)]\s*/, "").replace(/^[\-•*]\s*/, "").trim();
                if (cleaned && !cleaned.toLowerCase().startsWith("ah,") && !cleaned.toLowerCase().startsWith("na zdravlje")) {
                    directions.push(cleaned);
                }
            }

            const beforeIng = raw.slice(0, ingPos);
            const titleMatch = beforeIng.match(/([A-Za-z][^:\n]+(?:\([^)]+\))?)\s*Ingredients?/i)
                || beforeIng.match(/(?:^|[:.\n])\s*([^\n:]+?)\s*$/);
            let recipeTitle = (titleMatch ? titleMatch[1].trim() : beforeIng.split("\n").pop()?.trim() || raw.split("\n")[0]?.trim() || "Untitled Recipe");
            recipeTitle = recipeTitle.replace(/^Ah,?\s+[\w\s!.,]+:\s*/i, "").replace(/\s+Ingredients?\s*:?\s*$/i, "").trim();

            return { recipeTitle: recipeTitle || "Untitled Recipe", ingredients, directions };
        };

        // Parse the recipe content
        const parsedRecipe = parseRecipe(recipeContent);

        // Prepare the data to save (add extra fields like userId, cuisineType, etc.)
        const newRecipe = {
            ...parsedRecipe,
            userId: verifiedUserId, // Use the VERIFIED user ID here
            cuisineType,
            cookingDifficulty,
            cookingTime,
            diet,  // Include the diet field here
            // Use Admin SDK serverTimestamp for consistency if needed, else new Date() is fine
            createdAt: admin.firestore.FieldValue.serverTimestamp() 
        };

        // ---> ADDED LOGGING HERE <--- 
        console.log(`==> Attempting Admin SDK setDoc for docId: ${docId}`);
        console.log(`==> Authenticated User ID (verified): ${verifiedUserId}`);
        // Avoid logging potentially large recipe content, focus on key fields for rules
        console.log(`==> Data being written (userId field): ${newRecipe.userId}`); 
        // console.log("==> Full data being written:", JSON.stringify(newRecipe)); // Optional: uncomment for full data if needed

        // Use the docId provided by the client
        const recipeDocRef = adminDb.collection("recipes").doc(docId);
        await recipeDocRef.set(newRecipe); // Use Admin SDK set method

        // Index for similar-recipe search (pgvector)
        try {
            const { indexRecipe } = await import("../../lib/similarRecipesStore");
            await indexRecipe({
                id: docId,
                recipeTitle: newRecipe.recipeTitle,
                userId: verifiedUserId,
                cuisineType: newRecipe.cuisineType || "Unknown",
                cookingDifficulty: newRecipe.cookingDifficulty || "Unknown",
                cookingTime: newRecipe.cookingTime || "Unknown",
                diet: newRecipe.diet || [],
                ingredients: newRecipe.ingredients || [],
                directions: newRecipe.directions || [],
            });
        } catch (e) {
            console.error("Recipe index error (non-fatal):", e);
        }

        // Since Admin SDK bypasses rules, success here means the write happened
        console.log(`==> Admin SDK setDoc successful for docId: ${docId}`);
        return NextResponse.json({ success: true, id: docId });

    } catch (error) {
        // Errors here are likely programming errors or issues connecting to Firestore,
        // not security rule violations (unless you configured Admin SDK differently)
        console.error("Error saving recipe using Admin SDK:", error);
        return NextResponse.json({ error: "Failed to save recipe (server error)" }, { status: 500 });
    }
}
