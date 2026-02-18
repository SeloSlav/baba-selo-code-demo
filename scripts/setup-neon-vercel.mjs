#!/usr/bin/env node
/**
 * Setup Neon Postgres for pgvector on Vercel.
 * Run: node scripts/setup-neon-vercel.mjs
 *
 * This script:
 * 1. Links the project to Vercel (if not already)
 * 2. Opens the Vercel dashboard to add Neon Postgres
 * 3. Pulls env vars after you complete the setup
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: ROOT, stdio: "inherit", ...opts });
  } catch (e) {
    if (opts.ignoreError) return;
    throw e;
  }
}

console.log("\n🔧 Neon Postgres + pgvector setup for Vercel\n");

// 1. Ensure linked
if (!existsSync(join(ROOT, ".vercel"))) {
  console.log("Linking project to Vercel...");
  run("vercel link --yes");
} else {
  console.log("✓ Project already linked to Vercel");
}

// 2. Install Neon integration (opens browser for auth if needed)
console.log("\nAdding Neon Postgres integration...");
console.log("  → If prompted, choose to link to this project (Y)\n");

try {
  run("vercel install neon", { timeout: 120000 });
} catch (e) {
  console.log("\n⚠ If the install was interrupted, you can add Neon manually:");
  console.log("  1. Run: vercel open");
  console.log("  2. Go to Storage → Create Database → Postgres (Neon)");
  console.log("  3. Link it to your project");
  console.log("  4. Redeploy\n");
}

// 3. Pull env vars
console.log("\nPulling environment variables...");
run("vercel env pull .env.local", { ignoreError: true });

console.log("\n✅ Setup complete!");
console.log("\nNext steps:");
console.log("  1. Ensure POSTGRES_URL is in .env.local (from Neon integration)");
console.log("  2. Run: npm run dev");
console.log("  3. Generate a recipe - pgvector extension is auto-created on first use\n");
