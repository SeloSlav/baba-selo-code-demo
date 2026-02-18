# LangChain + LangGraph + Vector DB Architecture

## Goal
Reduce novel OpenAI API calls when generating recipes by:
1. **Semantic caching**: Before generating, check if a similar recipe query exists in the vector store
2. **Cache hits**: Return cached recipe (ingredients, directions, summary, macros, pairings) → **0 API calls**
3. **Cache misses**: Generate via OpenAI, then store in vector DB for future hits

---

## Current Flow (High API Usage)

```
generateRecipeDetails (1 call)
  → classifyRecipe (1 call)
  → generateSummary (1 call)
  → macroInfo (1 call)
  → dishPairing (1 call)
= 5+ LLM calls per recipe
```

---

## Vector DB Choice: **pgvector** (Recommended)

| Factor | pgvector | ChromaDB |
|--------|----------|----------|
| **Railway** | ✅ Native PostgreSQL add-on with pgvector | ⚠️ Needs separate Docker/service |
| **Storage** | ~1GB for 100k vectors | ~10GB for same data |
| **Persistence** | ✅ Built-in | Depends on config |
| **LangChain** | ✅ `@langchain/community` | ✅ `langchain-chroma` |
| **Single DB** | ✅ One Postgres for app + vectors | ❌ Separate service |

**Recommendation**: Use **pgvector** on Railway PostgreSQL. One database, efficient, and Railway supports it out of the box.

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  VERCEL (Frontend + API Routes)                                  │
│  - Next.js app                                                   │
│  - /api/generateRecipeDetails, /api/chat, etc.                   │
│  - Connects to Railway Postgres via DATABASE_URL                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  RAILWAY                                                         │
│  - PostgreSQL + pgvector extension                              │
│  - Stores: recipe embeddings + metadata (ingredients, etc.)      │
└─────────────────────────────────────────────────────────────────┘
```

**Why keep API on Vercel?**
- No code changes to frontend or routing
- Vercel serverless can connect to external Postgres
- Only add `DATABASE_URL` (Railway Postgres) to Vercel env

**Alternative**: Deploy full Next.js to Railway if you prefer everything in one place.

---

## LangGraph Flow

```
                    ┌─────────────┐
                    │   START     │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ check_cache │  ← Embed query, similarity search
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
        similarity ≥ 0.92          similarity < 0.92
              │                         │
              ▼                         ▼
       ┌─────────────┐           ┌─────────────┐
       │ return_cached│          │   generate  │  ← OpenAI (ingredients, directions)
       └──────┬──────┘           └──────┬──────┘
              │                         │
              │                         ▼
              │                  ┌─────────────┐
              │                  │ enrich      │  ← classify, summary, macros, pairings
              │                  └──────┬──────┘
              │                         │
              │                         ▼
              │                  ┌─────────────┐
              │                  │ store_cache │  ← Embed + insert into pgvector
              │                  └──────┬──────┘
              │                         │
              └────────────┬────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │     END     │
                    └─────────────┘
```

---

## Implementation Steps

### 1. Railway Setup
- Create Railway project
- Add **PostgreSQL** plugin (includes pgvector)
- Copy `DATABASE_URL` → add to Vercel env vars

### 2. Dependencies
```bash
npm install @langchain/langgraph @langchain/openai @langchain/community @langchain/core pg --legacy-peer-deps
```
(Use `--legacy-peer-deps` if you hit zod peer dependency conflicts with jimp.)

### 3. Schema (pgvector)
```sql
-- Run once on Railway Postgres
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE recipe_embeddings (
  id SERIAL PRIMARY KEY,
  query_text TEXT NOT NULL,
  embedding vector(1536),
  recipe_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON recipe_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### 4. Cache Key Strategy
- **Query text**: `recipeTitle + (recipeContent || '')` — normalized (lowercase, trimmed)
- **Embedding**: `text-embedding-3-small` (1536 dims)
- **Similarity threshold**: 0.92 (cosine) — tune based on false positives

### 5. Integration Points
- **`/api/generateRecipeDetails`**: Replace current flow with LangGraph pipeline
- **`/api/chat`** (optional): When user asks for recipe, could call a shared “recipe generation” service that uses the cache

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `lib/vectorStore.ts` | pgvector client + similarity search |
| `lib/recipeGraph.ts` | LangGraph definition (check_cache → generate → store) |
| `app/api/generateRecipeDetails/route.ts` | Use graph instead of direct OpenAI |
| `scripts/init-pgvector.sql` | Schema for Railway |

---

## Cost / Latency Impact

| Scenario | Before | After |
|----------|--------|-------|
| **Cache hit** | 5+ API calls, ~3–5s | 0 API calls, ~100–200ms |
| **Cache miss** | 5+ API calls | Same, but result is cached |
| **Repeated queries** (e.g. "chicken stir fry") | Full cost every time | First: full cost; subsequent: near-free |

---

## Notes
- **ChromaDB** is fine if you prefer a simpler local dev setup (no Postgres); you can run it in Docker. For production on Railway, pgvector is the smoother path.
- **Caching granularity**: You could also cache at the "enrichment" level (e.g. cache `classifyRecipe` results for similar recipe text) for additional savings.
- **Eviction**: Consider TTL or max rows if the table grows large; pgvector scales well but you may want to prune old entries.
