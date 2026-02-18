/**
 * Conversation memory for Pro users.
 * Stores chat turns in pgvector for semantic search ("what was that chicken recipe?").
 */
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pool, PoolConfig } from "pg";
import { Document } from "@langchain/core/documents";

const TABLE_NAME = "conversation_memory";
const RETRIEVAL_LIMIT = 5;
const SIMILARITY_THRESHOLD = 0.35;

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
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
    console.error("Failed to init conversation memory:", err);
    return null;
  }
}

export async function storeConversationTurn(
  userId: string,
  userMessage: string,
  assistantMessage: string
): Promise<void> {
  const store = await getVectorStore();
  if (!store) return;

  const text = `User: ${userMessage}\nAssistant: ${assistantMessage}`.slice(0, 4000);
  const now = new Date().toISOString();

  try {
    const doc = new Document({
      pageContent: text,
      metadata: {
        userId,
        userMessage,
        assistantMessage,
        timestamp: now,
      },
    });
    await store.addDocuments([doc]);
  } catch (err) {
    console.error("Conversation memory store failed:", err);
  }
}

export async function getRelevantMemory(
  userId: string,
  query: string
): Promise<StoredMessage[]> {
  const store = await getVectorStore();
  if (!store) return [];

  try {
    const results = await store.similaritySearchWithScore(
      `userId:${userId} ${query}`,
      RETRIEVAL_LIMIT
    );

    const out: StoredMessage[] = [];
    for (const [doc, score] of results) {
      if (score > SIMILARITY_THRESHOLD) continue;
      const meta = doc.metadata as Record<string, unknown>;
      if (meta?.userId !== userId) continue;
      if (meta?.userMessage && meta?.assistantMessage) {
        out.push(
          { role: "user", content: String(meta.userMessage), timestamp: String(meta.timestamp || "") },
          { role: "assistant", content: String(meta.assistantMessage), timestamp: String(meta.timestamp || "") }
        );
      }
    }
    return out.slice(-6);
  } catch (err) {
    console.error("Conversation memory retrieval failed:", err);
    return [];
  }
}
