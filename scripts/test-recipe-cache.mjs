#!/usr/bin/env node
/**
 * Test recipe pgvector cache via API.
 * Run with dev server: npm run dev (in another terminal)
 * Then: npm run test:cache "Punjene Paprike (Stuffed Peppers)"
 *
 * Or test against deployed: BASE_URL=https://your-app.vercel.app npm run test:cache "Punjene Paprike"
 */
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

// Load env (prefer .env.local)
for (const name of [".env.local", ".env"]) {
  const envPath = join(rootDir, name);
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const query = process.argv[2] || "Punjene Paprike (Stuffed Peppers)";

async function callApi() {
  const start = Date.now();
  const res = await fetch(`${BASE_URL}/api/generateRecipeDetails`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipeTitle: query,
      recipeContent: "",
      generateAll: true, // required for cache store
    }),
  });
  const elapsed = Date.now() - start;
  const data = await res.json();
  return { ok: res.ok, data, elapsed };
}

async function main() {
  console.log("\n🧪 Recipe cache test\n");
  console.log(`Query: "${query}"`);
  console.log(`API:   ${BASE_URL}/api/generateRecipeDetails\n`);

  // Call 1
  console.log("Call 1 (may be cache miss → generates via AI)...");
  const r1 = await callApi();
  if (!r1.ok) {
    console.error("Error:", r1.data?.error || r1.data?.message || "Request failed");
    console.error("Is the dev server running? Try: npm run dev");
    process.exit(1);
  }
  console.log(`  ✓ ${r1.elapsed}ms | fromCache: ${r1.data.fromCache ?? false}`);
  console.log(`  Ingredients: ${r1.data.ingredients?.length || 0}`);
  console.log(`  Directions:  ${r1.data.directions?.length || 0}\n`);

  // Call 2 (should hit cache if same query)
  console.log("Call 2 (expect cache hit → fast)...");
  const r2 = await callApi();
  if (!r2.ok) {
    console.error("Error:", r2.data?.error || r2.data?.message);
    process.exit(1);
  }
  console.log(`  ✓ ${r2.elapsed}ms | fromCache: ${r2.data.fromCache ?? false}`);
  console.log(`  Ingredients: ${r2.data.ingredients?.length || 0}`);
  console.log(`  Directions:  ${r2.data.directions?.length || 0}\n`);

  // Result
  console.log("---");
  console.log(`Call 1: ${r1.elapsed}ms ${r1.data.fromCache ? "(cache HIT)" : "(cache MISS)"}`);
  console.log(`Call 2: ${r2.elapsed}ms ${r2.data.fromCache ? "(cache HIT)" : "(cache MISS)"}`);
  if (r2.data.fromCache) {
    const speedup = r1.elapsed > 0 ? (r1.elapsed / r2.elapsed).toFixed(1) : "?";
    console.log(`\n✅ Cache working! 2nd call was from cache (~${speedup}x faster)`);
  } else if (r1.data.fromCache) {
    console.log(`\n✅ Call 1 was cache hit (recipe was already cached)`);
  } else {
    console.log(`\n⚠️  Both calls were cache MISS. Check POSTGRES_URL and Neon connection.`);
  }
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
