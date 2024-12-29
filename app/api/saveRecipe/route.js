import { NextResponse } from 'next/server';
import { db } from "../../firebase/firebase";  // Ensure Firebase is initialized correctly
import { doc, setDoc } from "firebase/firestore";  // Firestore methods

export async function POST(req) {
    // IMPORTANT: we now read docId from the request body
    const {
        recipeContent,
        userId,
        cuisineType,
        cookingDifficulty,
        cookingTime,
        diet,
        docId
    } = await req.json();

    if (!recipeContent) {
        return NextResponse.json({ error: "No recipe content provided" }, { status: 400 });
    }

    try {
        // Function to parse the recipe text
        const parseRecipe = (text) => {
            const lines = text.split("\n").map(line => line.trim()).filter(line => line !== "");

            // The title is assumed to be the first line of the recipe text
            const recipeTitle = lines[0];

            // Ingredients and directions
            const ingredientsIndex = lines.findIndex(line => line.toLowerCase() === "ingredients");
            const directionsIndex = lines.findIndex(line => line.toLowerCase() === "directions");

            const ingredients = ingredientsIndex !== -1
                ? lines.slice(ingredientsIndex + 1, directionsIndex).map(ing => ing.replace(/^-+\s*/, ''))
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
            userId,
            cuisineType,
            cookingDifficulty,
            cookingTime,
            diet,  // Include the diet field here
            createdAt: new Date() // Adding a timestamp field for sorting and tracking
        };

        // Log the received data and final recipe object for confirmation
        // console.log("Received Data:");
        // console.log("Recipe Content:", recipeContent);
        // console.log("User ID:", userId);
        // console.log("Cuisine Type:", cuisineType);
        // console.log("Cooking Difficulty:", cookingDifficulty);
        // console.log("Cooking Time:", cookingTime);
        // console.log("Diet:", diet);
        // console.log("Parsed Recipe:", parsedRecipe);
        // console.log("Final Recipe Object:", newRecipe);
        // console.log("docId:", docId);

        // Use the docId provided by the client
        const recipeDocRef = doc(db, "recipes", docId);
        await setDoc(recipeDocRef, newRecipe); // Set the document in Firestore

        return NextResponse.json({ success: true, id: recipeDocRef.id });

    } catch (error) {
        console.error("Error saving recipe:", error);
        return NextResponse.json({ error: "Failed to save recipe" }, { status: 500 });
    }
}
