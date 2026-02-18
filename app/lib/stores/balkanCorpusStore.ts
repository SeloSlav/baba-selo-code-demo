/**
 * Balkan recipe corpus vector store for RAG.
 * Pre-ingested authentic Balkan recipes; used for retrieval and direct return.
 */
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pool, PoolConfig } from "pg";
import { Document } from "@langchain/core/documents";

const TABLE_NAME = "balkan_recipe_corpus";
const DEFAULT_LIMIT = 5;

export interface CorpusRecipe {
  title: string;
  ingredients: string[];
  directions: string[];
  cuisine?: string;
  region?: string;
}

export interface CorpusSearchResult {
  recipe: CorpusRecipe;
  score: number; // cosine distance; lower = more similar
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
    console.error("Failed to init balkan corpus store:", err);
    return null;
  }
}

function recipeToPageContent(recipe: CorpusRecipe): string {
  const parts: string[] = [recipe.title];
  if (Array.isArray(recipe.ingredients) && recipe.ingredients.length) {
    parts.push("Ingredients:\n" + recipe.ingredients.join("\n"));
  }
  if (Array.isArray(recipe.directions) && recipe.directions.length) {
    parts.push("Directions:\n" + recipe.directions.join("\n"));
  }
  return parts.join("\n\n");
}

/**
 * Query the corpus for similar recipes. Returns results with cosine distance scores.
 */
export async function queryCorpus(
  text: string,
  limit = DEFAULT_LIMIT
): Promise<CorpusSearchResult[]> {
  const store = await getVectorStore();
  if (!store) return [];

  try {
    const results = await store.similaritySearchWithScore(text, limit);
    return results.map(([doc, score]) => {
      const metadata = doc.metadata as Record<string, unknown>;
      const recipe: CorpusRecipe = {
        title: (metadata?.title as string) ?? "",
        ingredients: (metadata?.ingredients as string[]) ?? [],
        directions: (metadata?.directions as string[]) ?? [],
        cuisine: metadata?.cuisine as string | undefined,
        region: metadata?.region as string | undefined,
      };
      return { recipe, score };
    });
  } catch (err) {
    console.error("Corpus query failed:", err);
    return [];
  }
}

/**
 * Ingest recipes into the corpus. Each recipe becomes one document.
 */
export async function ingestRecipes(recipes: CorpusRecipe[]): Promise<number> {
  const store = await getVectorStore();
  if (!store) return 0;

  const docs = recipes.map((recipe) => {
    const pageContent = recipeToPageContent(recipe);
    return new Document({
      pageContent,
      metadata: {
        title: recipe.title,
        cuisine: recipe.cuisine,
        region: recipe.region,
        ingredients: recipe.ingredients,
        directions: recipe.directions,
      },
    });
  });

  try {
    await store.addDocuments(docs);
    return docs.length;
  } catch (err) {
    console.error("Corpus ingest failed:", err);
    throw err;
  }
}

/**
 * Get the count of recipes in the corpus.
 */
export async function getCorpusCount(): Promise<number> {
  const config = getConnectionConfig();
  if (!config) return 0;

  const pool = new Pool(config);
  try {
    const res = await pool.query(
      `SELECT COUNT(*)::int FROM ${TABLE_NAME}`
    );
    return res.rows[0]?.count ?? 0;
  } catch {
    return 0;
  } finally {
    await pool.end();
  }
}
