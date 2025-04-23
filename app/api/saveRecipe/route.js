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
        // Function to parse the recipe text
        const parseRecipe = (text) => {
            const lines = text.split("\n").map(line => line.trim()).filter(line => line !== "");

            // The title is assumed to be the first line of the recipe text
            const recipeTitle = lines[0] || 'Untitled Recipe'; // Handle empty title

            // Ingredients and directions
            const ingredientsIndex = lines.findIndex(line => line.toLowerCase() === "ingredients");
            const directionsIndex = lines.findIndex(line => line.toLowerCase() === "directions");

            const ingredients = ingredientsIndex !== -1
                ? lines.slice(ingredientsIndex + 1, directionsIndex !== -1 ? directionsIndex : undefined).map(ing => ing.replace(/^-+\s*/, ''))
                : [];

            const directions = directionsIndex !== -1
                ? lines.slice(directionsIndex + 1).map(dir => dir.replace(/^([0-9]+\.\s*)+/, '').replace(/^-+\s*/, ''))
                : [];

            return {
                recipeTitle,
                ingredients,
                directions
            };
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
