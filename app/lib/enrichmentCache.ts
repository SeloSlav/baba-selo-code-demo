/**
 * Granular cache for enrichment APIs: classify, summary, macro, pairing.
 * Uses pgvector for semantic similarity on input text.
 */
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pool, PoolConfig } from "pg";
import { Document } from "@langchain/core/documents";

const TABLE_NAME = "enrichment_cache";
const SIMILARITY_THRESHOLD = 0.08; // stricter for enrichment (more exact match)

export type EnrichmentType = "classify" | "summary" | "macro" | "pairing";

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
    console.error("Failed to init enrichment cache:", err);
    return null;
  }
}

/** Check cache for enrichment result. Returns null on miss. */
export async function checkEnrichmentCache<T>(
  type: EnrichmentType,
  inputText: string
): Promise<T | null> {
  const store = await getVectorStore();
  if (!store) return null;

  const key = `[${type}] ${inputText.slice(0, 2000)}`;

  try {
    const results = await store.similaritySearchWithScore(key, 1);
    if (results.length === 0) return null;

    const [doc, score] = results[0];
    if (score > SIMILARITY_THRESHOLD) return null;

    const meta = doc.metadata as Record<string, unknown>;
    if (meta?.type !== type) return null;

    return meta.result as T;
  } catch (err) {
    console.error("Enrichment cache lookup failed:", err);
    return null;
  }
}

/** Store enrichment result in cache */
export async function storeEnrichmentCache<T>(
  type: EnrichmentType,
  inputText: string,
  result: T
): Promise<void> {
  const store = await getVectorStore();
  if (!store) return;

  const key = `[${type}] ${inputText.slice(0, 2000)}`;

  try {
    const doc = new Document({
      pageContent: key,
      metadata: { type, result },
    });
    await store.addDocuments([doc]);
  } catch (err) {
    console.error("Enrichment cache store failed:", err);
  }
}
