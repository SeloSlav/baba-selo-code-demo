/**
 * Similar recipes via pgvector.
 * Recipes are synced from Firestore; similarity search by embedding.
 */
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pool, PoolConfig } from "pg";
import { Document } from "@langchain/core/documents";

const TABLE_NAME = "recipe_index";
const DEFAULT_LIMIT = 6;

export interface IndexedRecipe {
  id: string;
  recipeTitle: string;
  userId: string;
  cuisineType?: string;
  cookingDifficulty?: string;
  cookingTime?: string;
  diet?: string[];
  directions?: string[];
  ingredients?: string[];
  imageURL?: string;
  recipeSummary?: string;
  username?: string;
  [key: string]: unknown;
}

let vectorStore: PGVectorStore | null = null;

function getConnectionConfig(): PoolConfig | null {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) return null;
  return { connectionString: url };
}

async function ensurePgVectorExtension(config: PoolConfig): Promise<void> {
  const pool = new Pool(config);
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
  } finally {
    await pool.end();
  }
}

async function getVectorStore(): Promise<PGVectorStore | null> {
  if (vectorStore) return vectorStore;
  const config = getConnectionConfig();
  if (!config) return null;

  try {
    await ensurePgVectorExtension(config);

    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    vectorStore = await PGVectorStore.initialize(embeddings, {
      postgresConnectionOptions: config,
      tableName: TABLE_NAME,
      distanceStrategy: "cosine",
    });
    return vectorStore;
  } catch (err) {
    console.error("Failed to init similar recipes store:", err);
    return null;
  }
}

/** Build text for embedding from recipe (title + ingredients + directions + summary) */
export function recipeToEmbeddingText(recipe: {
  recipeTitle?: string;
  ingredients?: string[];
  directions?: string[];
  recipeSummary?: string;
}): string {
  const parts: string[] = [];
  if (recipe.recipeTitle) parts.push(recipe.recipeTitle);
  if (Array.isArray(recipe.ingredients) && recipe.ingredients.length)
    parts.push("Ingredients: " + recipe.ingredients.join(", "));
  if (Array.isArray(recipe.directions) && recipe.directions.length)
    parts.push("Directions: " + recipe.directions.join(" "));
  if (recipe.recipeSummary) parts.push(recipe.recipeSummary);
  return parts.join("\n\n").slice(0, 8000);
}

/** Add or update a recipe in the index */
export async function indexRecipe(recipe: IndexedRecipe): Promise<void> {
  const store = await getVectorStore();
  if (!store) return;

  const text = recipeToEmbeddingText(recipe);
  if (!text.trim()) return;

  try {
    const doc = new Document({
      pageContent: text,
      metadata: { recipeId: recipe.id, recipe },
    });
    await store.addDocuments([doc]);
  } catch (err) {
    console.error("Failed to index recipe:", err);
  }
}

/** Add multiple recipes (batch). Clears table first if clearFirst. */
export async function indexRecipes(
  recipes: IndexedRecipe[],
  clearFirst = false
): Promise<void> {
  const config = getConnectionConfig();
  if (!config) return;

  if (clearFirst) {
    const pool = new Pool(config);
    try {
      await pool.query(`TRUNCATE TABLE ${TABLE_NAME}`);
    } catch (e) {
      // Table might not exist yet
    } finally {
      await pool.end();
    }
  }

  const store = await getVectorStore();
  if (!store) return;

  const docs = recipes
    .filter((r) => recipeToEmbeddingText(r).trim().length > 0)
    .map((r) => ({
      pageContent: recipeToEmbeddingText(r),
      metadata: { recipeId: r.id, recipe: r },
    }));

  if (docs.length === 0) return;

  try {
    await store.addDocuments(
      docs.map((d) => new Document({ pageContent: d.pageContent, metadata: d.metadata }))
    );
  } catch (err) {
    console.error("Failed to index recipes:", err);
  }
}

/** Find similar recipes by recipe ID (excludes the given recipe) */
export async function getSimilarRecipes(
  recipeId: string,
  recipeText: string,
  limit = DEFAULT_LIMIT
): Promise<IndexedRecipe[]> {
  const store = await getVectorStore();
  if (!store) return [];

  try {
    const results = await store.similaritySearchWithScore(recipeText, limit + 5);
    const seen = new Set<string>();
    const out: IndexedRecipe[] = [];

    for (const [doc, _score] of results) {
      const meta = doc.metadata as Record<string, unknown>;
      const recipe = meta?.recipe as IndexedRecipe | undefined;
      const rid = (meta?.recipeId ?? recipe?.id) as string | undefined;
      if (!rid || rid === recipeId || seen.has(rid)) continue;
      seen.add(rid);
      if (recipe) out.push(recipe);
      if (out.length >= limit) break;
    }

    return out;
  } catch (err) {
    console.error("Similar recipes search failed:", err);
    return [];
  }
}
