/**
 * Recipe vector store for semantic caching.
 * Uses pgvector when POSTGRES_URL (Vercel/Neon) or DATABASE_URL (Railway) is set.
 */
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pool, PoolConfig } from "pg";

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
    console.error("Failed to init recipe vector store:", err);
    return null;
  }
}

export async function checkRecipeCache(
  queryText: string
): Promise<CachedRecipeData | null> {
  const store = await getVectorStore();
  if (!store) return null;

  try {
    const results = await store.similaritySearchWithScore(queryText, 1);
    if (results.length === 0) return null;

    const [doc, score] = results[0];
    if (score > SIMILARITY_THRESHOLD) return null;

    const metadata = doc.metadata as Record<string, unknown>;
    const recipeData = metadata?.recipeData as CachedRecipeData | undefined;
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
  const store = await getVectorStore();
  if (!store) return;

  try {
    const { Document } = await import("@langchain/core/documents");
    const doc = new Document({
      pageContent: queryText,
      metadata: { recipeData },
    });
    await store.addDocuments([doc]);
  } catch (err) {
    console.error("Recipe cache store failed:", err);
  }
}
