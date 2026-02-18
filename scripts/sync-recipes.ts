#!/usr/bin/env node
/**
 * Sync Firestore recipes to pgvector for similar-recipe search.
 * Batched with cost estimation and verification.
 *
 * Run: npm run sync:recipes
 * Or: npx tsx scripts/sync-recipes.ts [--dry-run] [--batch=50] [--delay=500]
 *
 * Requires: .env.local with FIREBASE_SERVICE_ACCOUNT_KEY, POSTGRES_URL, OPENAI_API_KEY
 */
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import admin from "firebase-admin";
import type { IndexedRecipe } from "../app/lib/similarRecipesStore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

// Load env before any other imports
for (const name of [".env.local", ".env"]) {
  const envPath = join(rootDir, name);
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

// Cost: text-embedding-3-small = $0.02 per 1M input tokens (no output charge)
const COST_PER_1M_TOKENS = 0.02;
const CHARS_PER_TOKEN = 4; // rough estimate for English

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function estimateCost(tokens: number): number {
  return (tokens / 1_000_000) * COST_PER_1M_TOKENS;
}

function formatCost(cents: number): string {
  if (cents < 0.01) return "<$0.01";
  return `$${cents.toFixed(2)}`;
}

function recipeToEmbeddingText(recipe: IndexedRecipe): string {
  const parts: string[] = [];
  if (recipe.recipeTitle) parts.push(recipe.recipeTitle);
  if (Array.isArray(recipe.ingredients) && recipe.ingredients.length)
    parts.push("Ingredients: " + recipe.ingredients.join(", "));
  if (Array.isArray(recipe.directions) && recipe.directions.length)
    parts.push("Directions: " + recipe.directions.join(" "));
  if (recipe.recipeSummary) parts.push(recipe.recipeSummary);
  return parts.join("\n\n").slice(0, 8000);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const batchArg = args.find((a) => a.startsWith("--batch="));
  const delayArg = args.find((a) => a.startsWith("--delay="));
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const BATCH_SIZE = batchArg ? parseInt(batchArg.split("=")[1], 10) : 50;
  const DELAY_MS = delayArg ? parseInt(delayArg.split("=")[1], 10) : 500;
  const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : 0;

  console.log("\n📦 Recipe sync to pgvector (similar recipes)\n");

  // Validate env
  const firebaseKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const postgresUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!firebaseKey) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT_KEY not set in .env.local");
    process.exit(1);
  }
  if (!postgresUrl) {
    console.error("❌ POSTGRES_URL or DATABASE_URL not set in .env.local");
    process.exit(1);
  }
  if (!openaiKey && !dryRun) {
    console.error("❌ OPENAI_API_KEY not set in .env.local");
    process.exit(1);
  }

  // Init Firebase
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(firebaseKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  const db = admin.firestore();
  const snapshot = await db.collection("recipes").get();

  const recipes: IndexedRecipe[] = snapshot.docs
    .map((d) => {
      const data = d.data();
      const ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];
      const directions = Array.isArray(data.directions) ? data.directions : [];
      return {
        id: d.id,
        recipeTitle: data.recipeTitle || "Untitled",
        userId: data.userId || "",
        cuisineType: data.cuisineType || "Unknown",
        cookingDifficulty: data.cookingDifficulty || "Unknown",
        cookingTime: data.cookingTime || "Unknown",
        diet: data.diet || [],
        directions,
        ingredients,
        imageURL: data.imageURL || "",
        recipeSummary: data.recipeSummary || "",
        username: data.username || "Anonymous Chef",
      };
    })
    .filter((r) => {
      const text = [r.recipeTitle, r.ingredients?.join(" "), r.directions?.join(" "), r.recipeSummary].join(" ");
      return text.trim().length > 0;
    });

  const recipesToSync = LIMIT > 0 ? recipes.slice(0, LIMIT) : recipes;

  const totalTokens = recipesToSync.reduce((sum, r) => sum + estimateTokens(recipeToEmbeddingText(r)), 0);
  const estimatedCost = estimateCost(totalTokens);

  console.log(`Recipes to sync: ${recipesToSync.length}${LIMIT > 0 ? ` (limit of ${LIMIT} from ${recipes.length} total)` : ""}`);
  console.log(`Est. tokens:    ~${totalTokens.toLocaleString()}`);
  console.log(`Est. cost:      ${formatCost(estimatedCost)} (text-embedding-3-small)`);
  console.log(`Batch size:     ${BATCH_SIZE}`);
  console.log(`Delay between:  ${DELAY_MS}ms\n`);

  if (dryRun) {
    console.log("🔍 Dry run – no changes made. Remove --dry-run to sync.");
    process.exit(0);
  }

  // Confirm if cost is high
  if (estimatedCost > 1) {
    console.log("⚠️  Estimated cost exceeds $1. Consider running with --dry-run first.");
    console.log("   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n");
    await new Promise((r) => setTimeout(r, 5000));
  }

  // Dynamic import to ensure env is loaded
  const { indexRecipes } = await import("../app/lib/similarRecipesStore");

  let synced = 0;
  let runningTokens = 0;
  const startTime = Date.now();

  for (let i = 0; i < recipesToSync.length; i += BATCH_SIZE) {
    const batch = recipesToSync.slice(i, i + BATCH_SIZE);
    const batchTokens = batch.reduce((sum, r) => sum + estimateTokens(recipeToEmbeddingText(r)), 0);

    await indexRecipes(batch, i === 0);
    synced += batch.length;
    runningTokens += batchTokens;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const runningCost = estimateCost(runningTokens);
    console.log(
      `  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(recipesToSync.length / BATCH_SIZE)}: ` +
        `${synced}/${recipesToSync.length} recipes | ~${runningTokens.toLocaleString()} tokens | ` +
        `~${formatCost(runningCost)} spent | ${elapsed}s`
    );

    if (i + BATCH_SIZE < recipesToSync.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  const totalCost = estimateCost(runningTokens);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Synced ${synced} recipes in ${elapsed}s (~${formatCost(totalCost)} total)\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
