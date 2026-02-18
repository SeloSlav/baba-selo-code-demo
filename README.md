# Baba Selo

**Baba Selo** is an AI-powered Balkan recipe companion. Think of it as your digital grandma—warm, knowledgeable, and full of real advice. No generic bot nonsense: Baba gives you accurate recipes, cooking tips, ingredient substitutions, and meal planning help, all in a cozy, grandma-like tone.

## What the App Does

- **Recipe chat** – Ask for recipes, cooking tips, or anything food-related. Baba responds with detailed, culturally authentic Balkan recipes.
- **Recipe cards** – Save recipes, see nutrition info, pairings, and similar recipes. Recipe chat cards use FontAwesome icons and a polished layout.
- **Pro plan** – Baba’s memory, multiple chats. Upgrade page shows annual savings ($12) and clear CTAs.
- **Meal plans** – Free for everyone. Ask Baba in chat or go to Meal Plans for daily/weekly plans with shopping lists.’
- **Chat tools** – Baba can save recipes, find similar ones, convert servings, get nutrition, suggest substitutions, set timers, translate recipes, add to meal plans, give seasonal tips, find by ingredients, convert units, and generate food images.

---

## LangChain, LangGraph & Tool Calls

The app uses **LangChain** and **LangGraph** for all AI features. Chat runs as a **ReAct agent** with structured tool calls; recipe generation uses a **LangGraph StateGraph** pipeline; and vector stores (pgvector via LangChain) power semantic search and caching.

### Chat Agent (LangGraph ReAct)

- **Location**: `app/lib/chatGraph.ts`, `app/lib/chatToolsLangchain.ts`
- **Flow**: `createReactAgent` from `@langchain/langgraph/prebuilt` — a ReAct-style agent that decides when to call tools vs. respond directly.
- **Model**: `ChatOpenAI` (GPT-4o) from `@langchain/openai`.
- **Tools**: Defined with `tool()` from `@langchain/core/tools` and Zod schemas. Each tool wraps handlers in `chatTools.js`.
- **API**: `POST /api/chat` streams via `runChatGraphStream`, emitting `tool_started` when `generate_meal_plan` runs (for loader UX) and `done` with the final message, timer, and meal plan link.

### Recipe Generation (LangGraph StateGraph)

- **Location**: `app/lib/recipeGraph.ts`, `app/api/generateRecipeDetails/route.ts`
- **Flow**: `StateGraph` with nodes: `check_cache` → [hit] `__end__` | [miss] `generate` → `enrich` → `store_cache` → `__end__`.
- **Model**: `ChatOpenAI` (gpt-4o-mini) for JSON recipe generation.
- **Caching**: `recipeVectorStore` checks semantic similarity before generating; on miss, generates, enriches (classify, summary, macro, pairing), then stores in the vector cache.
- **Enrichment cache**: `enrichmentCache` caches classify/summary/macro/pairing API results by semantic similarity to avoid redundant calls.

### Chat Tools (Baba Selo)

When you chat with Baba, the ReAct agent can call these tools:

| Tool | Description |
|------|-------------|
| `generate_image` | Generates a food image when the user asks for a picture of a dish |
| `save_recipe` | Saves a recipe to Firestore for the user |
| `get_similar_recipes` | Finds similar recipes via pgvector semantic search (`recipe_index`) |
| `convert_servings` | Scales ingredients for different serving sizes |
| `get_nutrition` | Fetches macros via `/api/macroInfo` |
| `ingredient_substitution` | Balkan substitution lookup |
| `set_timer` | Sets a timer (seconds); client shows the timer UI |
| `translate_recipe` | Translates recipe content via OpenAI |
| `generate_meal_plan` | Generates a 7-day meal plan (requires login) |
| `add_to_meal_plan` | Adds a recipe to the user's meal plan for a given day |
| `seasonal_tips` | Monthly seasonal produce tips |
| `find_by_ingredients` | Finds recipes by ingredients (pgvector similarity search) |
| `unit_conversion` | Converts g↔cups, ml↔cups, tbsp↔tsp |

Timer handling: when Baba calls `set_timer`, the API returns `timerSeconds`; the client adds a `TIMER_REQUEST_<seconds>` message so the timer UI appears.

---

## Copy & CRO

- **Login** – Subtitle emphasizes Balkan companion, grandma vibes, real advice.
- **RecipeList** – Sign-up CTA for non-logged-in users.
- **ProfileMenu** – Tagline and “one click” copy.
- **ChatWindow** – Welcome message with Baba’s personality.
- **Upgrade page** – $7/mo annual, $8/mo monthly; “Save $12” badge; Pro on left; secondary CTA after FAQ.
- **Meal plans** – Free for all; Baba image at top for non-logged-in view.
- **ChatList** – Upgrade copy for free users.

---

## Recipe UI

- **Notes** – Hidden in the recipe UI (`SHOW_NOTES = false`); data kept, UI removed.
- **RecipeMessage** – Layout with title/subtitle, tags, buttons; FontAwesome icons for Save Recipe, Pairing, Calories, and tags.
- **RecipeNavigation** – `showNotes` prop hides Notes nav when notes are disabled.

---

## Vector Store Features (pgvector + LangChain)

The app uses **pgvector** via LangChain's `PGVectorStore` and `OpenAIEmbeddings` (`text-embedding-3-small`) for semantic search and caching. All stores use cosine distance. Tables are created automatically by LangChain on first use.

### Vector Stores

| Table | Lib | Purpose | Key Features |
|-------|-----|---------|--------------|
| **recipe_embeddings** | `recipeVectorStore.ts` | Semantic cache for generated recipes | Used by LangGraph `recipeGraph` pipeline. Before generating, checks if a similar query exists. Cache hit → 0 API calls. Cache miss → generate via OpenAI, enrich, then store for future hits. |
| **recipe_index** | `similarRecipesStore.ts` | Similar recipes search | Recipes synced from Firestore. Powers `get_similar_recipes` and `find_by_ingredients` chat tools. Similarity search by embedding (title + ingredients + directions + summary). |
| **enrichment_cache** | `enrichmentCache.ts` | Granular enrichment cache | Used by LangGraph `recipeGraph` enrich node. Caches classify, summary, macro, and pairing results by semantic similarity. Avoids redundant API calls for similar recipe content. |
| **conversation_memory** | `conversationMemoryStore.ts` | Pro users chat recall | Injected into chat system prompt. Stores chat turns for semantic search. Enables queries like "what was that chicken recipe?" by retrieving relevant past turns. |

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
