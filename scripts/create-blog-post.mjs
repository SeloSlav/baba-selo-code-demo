#!/usr/bin/env node
/**
 * Creates a new blog post file from template.
 * Usage: node scripts/create-blog-post.mjs <slug>
 * Example: node scripts/create-blog-post.mjs my-new-article
 *
 * After running:
 * 1. Edit app/blog/posts/<slug>.tsx with your content
 * 2. Add entry to app/blog/posts-data.json
 * 3. Optionally add to RELATED_ARTICLES in blog-constants.ts
 * 4. Run: npm run generate-blog-images <slug>
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const slug = process.argv[2];

if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error("Usage: node scripts/create-blog-post.mjs <slug>");
  console.error("Slug must be lowercase letters, numbers, and hyphens only.");
  process.exit(1);
}

const postsDir = path.join(__dirname, "..", "app", "blog", "posts");
const templatePath = path.join(postsDir, "_template.tsx");
const outputPath = path.join(postsDir, `${slug}.tsx`);

if (fs.existsSync(outputPath)) {
  console.error(`Post already exists: ${outputPath}`);
  process.exit(1);
}

const template = fs.readFileSync(templatePath, "utf8");
fs.writeFileSync(outputPath, template);
console.log(`Created: app/blog/posts/${slug}.tsx`);
console.log("Next: Add entry to posts-data.json, then edit the post content.");
