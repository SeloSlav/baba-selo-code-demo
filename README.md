This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Vector Store Features (pgvector)

The app uses **pgvector** with LangChain for semantic search and caching. All vector stores use the `text-embedding-3-small` model and cosine distance. Tables are created automatically by LangChain on first use.

### Vector Stores

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **recipe_embeddings** | Semantic cache for generated recipes | Before generating, checks if a similar query exists. Cache hit → 0 API calls. Cache miss → generate via OpenAI, then store for future hits. Reduces 5+ LLM calls to near-zero on repeats. |
| **recipe_index** | Similar recipes search | Recipes synced from Firestore; similarity search by embedding (title + ingredients + directions + summary). Powers "Similar recipes" on recipe pages. |
| **enrichment_cache** | Granular enrichment cache | Caches classify, summary, macro, and pairing results by semantic similarity on input text. Avoids redundant API calls for similar recipe content. |
| **conversation_memory** | Pro users chat recall | Stores chat turns for semantic search. Enables queries like "what was that chicken recipe?" by retrieving relevant past turns. |

### Setup

1. **Database**: PostgreSQL with pgvector (Neon or Railway).
2. **Env vars**: `POSTGRES_URL` (Neon) or `DATABASE_URL` (Railway), plus `OPENAI_API_KEY`.

```bash
# Enable pgvector (run once)
psql $POSTGRES_URL -f scripts/init-pgvector.sql
```

**Neon + Vercel:**
```bash
node scripts/setup-neon-vercel.mjs
```

### Syncing Recipes to Vector Store

Firestore recipes are synced to `recipe_index` for similar-recipe search:

```bash
npm run sync:recipes
# Or: npx tsx scripts/sync-recipes.ts [--dry-run] [--batch=50] [--delay=500]
```

Admin API: `POST /api/admin/sync-recipes` (admin-only).

### Cost / Latency Impact

| Scenario | Before | After |
|----------|--------|-------|
| Recipe cache hit | 5+ API calls, ~3–5s | 0 API calls, ~100–200ms |
| Similar recipes | N/A | Semantic search over indexed recipes |
| Pro chat recall | N/A | Semantic retrieval of past turns |

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
