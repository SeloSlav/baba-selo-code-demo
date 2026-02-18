#!/usr/bin/env node
/**
 * Test similar recipes store performance.
 * Run: npm run test:similar-recipes [recipeId]
 * Or: npm run test:similar-recipes [recipeId] --api  (test via HTTP API)
 *
 * Requires: .env.local with FIREBASE_SERVICE_ACCOUNT_KEY, POSTGRES_URL, OPENAI_API_KEY
 */
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import admin from "firebase-admin";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

// Load env before imports
for (const name of [".env.local", ".env"]) {
  const envPath = join(rootDir, name);
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const recipeId = args[0] || "random";
const useApi = process.argv.includes("--api");
const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

function ms(t: number) {
  return `${t}ms`;
}

async function getSampleRecipeId(): Promise<string> {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not set");

  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(key);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  const db = admin.firestore();
  const snap = await db.collection("recipes").limit(1).get();
  if (snap.empty) throw new Error("No recipes in Firestore");
  return snap.docs[0].id;
}

async function testViaApi(id: string) {
  console.log("\n📡 Testing via API (full request)\n");
  console.log(`  URL: ${BASE_URL}/api/similarRecipes?recipeId=${id}\n`);
  const start = Date.now();
  const res = await fetch(`${BASE_URL}/api/similarRecipes?recipeId=${id}&limit=4`);
  const elapsed = Date.now() - start;
  const data = await res.json();

  if (!res.ok) {
    console.error("  Error:", data?.error || res.statusText);
    if (res.status === 404) {
      console.error("  Tip: Recipe not found. Use 'random' to fetch a sample: npm run test:similar-recipes -- random --api");
    } else {
      console.error("  Is the dev server running? npm run dev");
    }
    return;
  }

  console.log(`  Total:     ${ms(elapsed)}`);
  console.log(`  Similar:   ${data.similar?.length ?? 0} recipes`);
  if (data.similar?.length) {
    console.log(`  Examples:  ${data.similar.slice(0, 2).map((r: { recipeTitle?: string }) => r.recipeTitle).join(", ")}`);
  }
  console.log("");
}

async function testViaStore(id: string) {
  console.log("\n🔬 Testing store directly (step-by-step timing)\n");

  const { getSimilarRecipesWithTiming, recipeToEmbeddingText } = await import("../app/lib/stores/similarRecipesStore");

  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not set");

  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(key);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  const db = admin.firestore();

  const runTest = async (label: string) => {
    const timings: Record<string, number> = {};

    // 1. Firestore: fetch recipe
    let t0 = Date.now();
    const recipeDoc = await db.collection("recipes").doc(id).get();
    timings["1_firestore_recipe"] = Date.now() - t0;

    if (!recipeDoc.exists) throw new Error(`Recipe ${id} not found`);

    const data = recipeDoc.data()!;
    const ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];
    const directions = Array.isArray(data.directions) ? data.directions : [];
    const recipeText = recipeToEmbeddingText({
      recipeTitle: data.recipeTitle,
      ingredients,
      directions,
      recipeSummary: data.recipeSummary,
    });

    // 2. getSimilarRecipes (store)
    t0 = Date.now();
    const { results: similar, timing: storeTiming } = await getSimilarRecipesWithTiming(id, recipeText, 4);
    const storeTotal = Date.now() - t0;
    timings["2a_store_getStoredEmbedding"] = storeTiming.getStoredEmbeddingMs ?? 0;
    timings["2b_store_similaritySearch"] = storeTiming.similaritySearchMs;
    const storeOverhead = storeTotal - (storeTiming.getStoredEmbeddingMs ?? 0) - storeTiming.similaritySearchMs;
    if (storeOverhead > 50) timings["2c_store_init_or_overhead"] = storeOverhead;
    timings["2_store_total"] = storeTotal;

    // 3. Firestore: fetch usernames
    const userIds = [...new Set(similar.map((r) => r.userId).filter(Boolean))].slice(0, 10);
    t0 = Date.now();
    if (userIds.length > 0) {
      const usersSnap = await db.collection("users").where("__name__", "in", userIds).get();
      usersSnap.docs.forEach((d) => d.data());
    }
    timings["3_firestore_usernames"] = Date.now() - t0;

    const total = Object.values(timings).reduce((a, b) => a + b, 0);
    return { timings, total, similar, storeTiming };
  };

  // Run 1 (cold)
  console.log("  Run 1 (cold start):");
  const r1 = await runTest("cold");
  for (const [label, ms_] of Object.entries(r1.timings)) {
    const pct = r1.total > 0 ? ((ms_ / r1.total) * 100).toFixed(0) : "0";
    console.log(`    ${label.padEnd(33)} ${ms(ms_).padStart(8)}  (${pct}%)`);
  }
  console.log(`    ${"TOTAL".padEnd(33)} ${ms(r1.total).padStart(8)}\n`);

  // Run 2 (warm)
  console.log("  Run 2 (warm - store/connections cached):");
  const r2 = await runTest("warm");
  for (const [label, ms_] of Object.entries(r2.timings)) {
    const pct = r2.total > 0 ? ((ms_ / r2.total) * 100).toFixed(0) : "0";
    console.log(`    ${label.padEnd(33)} ${ms(ms_).padStart(8)}  (${pct}%)`);
  }
  console.log(`    ${"TOTAL".padEnd(33)} ${ms(r2.total).padStart(8)}`);

  console.log(`\n  Store used stored embedding: ${r2.storeTiming.usedStoredEmbedding ? "yes" : "no (OpenAI embed)"}`);
  console.log(`  Similar: ${r2.similar.length} recipes`);
  if (r2.similar.length) {
    console.log(`  Examples: ${r2.similar.slice(0, 2).map((r) => r.recipeTitle).join(", ")}`);
  }
  console.log(`\n  Speedup (warm vs cold): ${(r1.total / r2.total).toFixed(1)}x`);
  console.log("");
}

async function main() {
  console.log("\n🧪 Similar recipes performance test\n");

  let id = recipeId;
  if (id === "random" || !id) {
    console.log("Fetching sample recipe ID from Firestore...");
    id = await getSampleRecipeId();
    console.log(`Using recipe: ${id}\n`);
  }

  if (useApi) {
    await testViaApi(id);
  } else {
    await testViaStore(id);
  }

  console.log("---");
  console.log("Usage: npm run test:similar-recipes -- [recipeId] [--api]");
  console.log("       npm run test:similar-recipes -- random --api   (use any recipe, via API)");
  console.log("       npm run test:similar-recipes -- random         (use any recipe, direct store)");
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
