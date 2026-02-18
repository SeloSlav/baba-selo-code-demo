# Baba Selo

**Baba Selo** is an AI-powered Balkan recipe companion. Think of it as your digital grandma—warm, knowledgeable, and full of real advice. No generic bot nonsense: Baba gives you accurate recipes, cooking tips, ingredient substitutions, and meal planning help, all in a cozy, grandma-like tone.

Visit **[babaselo.com](https://babaselo.com)** to see a running version.

> This repo is made available for **educational and code showcase purposes**. Scraping scripts and ingested corpus data are ignored in this repository.

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

- **Location**: `app/lib/chatGraph.ts`, `app/lib/chatToolsLangchain.ts`, `app/lib/chatTools.ts`
- **Flow**: `createReactAgent` from `@langchain/langgraph/prebuilt` — a ReAct-style agent that decides when to call tools vs. respond directly.
- **Model**: `ChatOpenAI` (GPT-4o) from `@langchain/openai`.
- **Tools**: Defined with `tool()` from `@langchain/core/tools` and Zod schemas. Each tool wraps handlers in `chatTools.ts`.
- **API**: `POST /api/chat` streams via `runChatGraphStream`, emitting `tool_started` when `generate_meal_plan` runs (for loader UX) and `done` with the final message, timer, and meal plan link.

### Recipe Generation (LangGraph StateGraph)

- **Location**: `app/lib/recipeGraph.ts`, `app/api/generateRecipeDetails/route.ts`
- **Lib structure**: `app/lib/` is organized into `stores/` (vector stores), `meal-plan/` (meal plan logic), `models.ts` (centralized model config), and root-level AI/chat files.
- **Flow**: `StateGraph` with nodes: `check_cache` → [hit] `__end__` | [miss] `retrieve_corpus` → [direct match] `__end__` | [else] `generate` → `enrich` → `store_cache` → `__end__`.
- **RAG**: The `retrieve_corpus` node queries the Balkan recipe corpus via pgvector. A very close match (cosine distance < 0.1) is returned directly with zero LLM calls. Otherwise, similar corpus recipes are injected as context for the generation prompt.
- **Model**: `ChatOpenAI` (gpt-4o-mini) for JSON recipe generation — module-level singleton via `models.ts`.
- **Caching**: `recipeVectorStore` checks semantic similarity before generating; on miss, generates, enriches (classify, summary, macro, pairing), then stores in the vector cache.
- **Enrichment cache**: `enrichmentCache` caches classify/summary/macro/pairing results by semantic similarity with pgvector metadata filtering (each enrichment type is filtered at the SQL level to avoid cross-type false positives). Macro and pairing enrichment run in parallel via `Promise.all`.

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
| `translate_recipe` | Translates recipe content via LangChain `ChatOpenAI` |
| `generate_meal_plan` | Generates a 7-day meal plan (requires login) |
| `add_to_meal_plan` | Adds a recipe to the user's meal plan for a given day |
| `seasonal_tips` | Monthly seasonal produce tips |
| `find_by_ingredients` | Finds recipes by ingredients (pgvector similarity search) |
| `unit_conversion` | Converts g↔cups, ml↔cups, tbsp↔tsp |

Timer handling: when Baba calls `set_timer`, the API returns `timerSeconds`; the client adds a `TIMER_REQUEST_<seconds>` message so the timer UI appears.

---

## Vector Store Features (pgvector + LangChain)

The app uses **pgvector** via LangChain's `PGVectorStore` and `OpenAIEmbeddings` (`text-embedding-3-small`) for semantic search and caching. All stores use cosine distance. Tables are created automatically by LangChain on first use.

### Architecture

All vector stores share a single `OpenAIEmbeddings` instance, a single pgvector extension check, and a cached connection per table — managed by `lib/stores/vectorStoreFactory.ts`. Model names are centralized in `lib/models.ts`.

Chat corpus RAG is gated behind a keyword intent check so non-recipe messages (greetings, stories, etc.) skip the embedding + pgvector call entirely.

### Vector Stores

| Table | Lib | Purpose | Key Features |
|-------|-----|---------|--------------|
| **recipe_embeddings** | `lib/stores/recipeVectorStore.ts` | Semantic cache for generated recipes | Used by LangGraph `recipeGraph` pipeline. Before generating, checks if a similar query exists. Cache hit → 0 API calls. Cache miss → generate via OpenAI, enrich, then store for future hits. |
| **recipe_index** | `lib/stores/similarRecipesStore.ts` | Similar recipes search | Recipes synced from Firestore. Powers `get_similar_recipes` and `find_by_ingredients` chat tools. Similarity search by embedding (title + ingredients + directions + summary). |
| **enrichment_cache** | `lib/stores/enrichmentCache.ts` | Granular enrichment cache | Used by LangGraph `recipeGraph` enrich node. Caches classify, summary, macro, and pairing results. Uses pgvector metadata filtering by type (SQL-level) to prevent cross-type false positives. |
| **conversation_memory** | `lib/stores/conversationMemoryStore.ts` | Pro users chat recall | Injected into chat system prompt. Uses pgvector metadata filtering by userId (SQL-level) for accurate per-user retrieval. Enables queries like "what was that chicken recipe?" |
| **balkan_recipe_corpus** | `lib/stores/balkanCorpusStore.ts` | RAG corpus of authentic Balkan recipes | Pre-ingested via scraping pipeline. Queried by the `retrieve_corpus` node in the recipe graph and by the chat route for recipe-related messages. Direct match (distance < 0.1) = zero LLM calls. |

### Cost / Latency Impact

| Scenario | Before | After |
|----------|--------|-------|
| Recipe cache hit | 5+ API calls, ~3–5s | 0 API calls, ~100–200ms |
| Corpus direct match | Full LLM generation | 0 LLM calls (pgvector only) |
| Enrichment (macro + pairing) | Sequential (~2s) | Parallel via `Promise.all` (~1s) |
| Non-recipe chat message | Embedding + pgvector call | Skipped (intent gate) |
| Similar recipes | N/A | Semantic search over indexed recipes |
| Pro chat recall | N/A | Metadata-filtered semantic retrieval |
