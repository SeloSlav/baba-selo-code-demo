/**
 * Recipe vector store for semantic caching.
 * Uses pgvector when POSTGRES_URL (Vercel/Neon) or DATABASE_URL (Railway) is set.
 */
import { Document } from "@langchain/core/documents";
import { getOrCreateStore } from "./vectorStoreFactory";

const TABLE_NAME = "recipe_embeddings";
const SIMILARITY_THRESHOLD = 0.12; // cosine distance; lower = more similar (~0.88 cosine sim)

export interface CachedRecipeData {
  ingredients: string[];
  directions: string[];
  cuisineType?: string;
  cookingTime?: string;
  cookingDifficulty?: string;
  diet?: string[];
  summary?: string;
  macroInfo?: unknown;
  dishPairings?: string;
  [key: string]: unknown;
}

export async function checkRecipeCache(
  queryText: string
): Promise<CachedRecipeData | null> {
  const store = await getOrCreateStore(TABLE_NAME);
  if (!store) return null;

  try {
    const results = await store.similaritySearchWithScore(queryText, 1);
    if (results.length === 0) return null;

    const [doc, score] = results[0];
    if (score > SIMILARITY_THRESHOLD) return null;

    const recipeData = (doc.metadata as Record<string, unknown>)
      ?.recipeData as CachedRecipeData | undefined;
    if (!recipeData?.ingredients?.length || !recipeData?.directions?.length) {
      return null;
    }
    return recipeData;
  } catch (err) {
    console.error("Recipe cache lookup failed:", err);
    return null;
  }
}

export async function storeRecipeCache(
  queryText: string,
  recipeData: CachedRecipeData
): Promise<void> {
  const store = await getOrCreateStore(TABLE_NAME);
  if (!store) return;

  try {
    await store.addDocuments([
      new Document({
        pageContent: queryText,
        metadata: { recipeData },
      }),
    ]);
  } catch (err) {
    console.error("Recipe cache store failed:", err);
  }
}
