/**
 * Conversation memory for Pro users.
 * Stores chat turns in pgvector for semantic search ("what was that chicken recipe?").
 */
import { Document } from "@langchain/core/documents";
import { getOrCreateStore } from "./vectorStoreFactory";

const TABLE_NAME = "conversation_memory";
const RETRIEVAL_LIMIT = 5;
const SIMILARITY_THRESHOLD = 0.35;

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export async function storeConversationTurn(
  userId: string,
  userMessage: string,
  assistantMessage: string
): Promise<void> {
  const store = await getOrCreateStore(TABLE_NAME);
  if (!store) return;

  const text = `User: ${userMessage}\nAssistant: ${assistantMessage}`.slice(
    0,
    4000
  );

  try {
    await store.addDocuments([
      new Document({
        pageContent: text,
        metadata: {
          userId,
          userMessage,
          assistantMessage,
          timestamp: new Date().toISOString(),
        },
      }),
    ]);
  } catch (err) {
    console.error("Conversation memory store failed:", err);
  }
}

export async function getRelevantMemory(
  userId: string,
  query: string
): Promise<StoredMessage[]> {
  const store = await getOrCreateStore(TABLE_NAME);
  if (!store) return [];

  try {
    // Filter by userId via pgvector metadata (pushes filter to SQL instead of post-hoc)
    const results = await store.similaritySearchWithScore(
      query,
      RETRIEVAL_LIMIT,
      { userId }
    );

    const out: StoredMessage[] = [];
    for (const [doc, score] of results) {
      if (score > SIMILARITY_THRESHOLD) continue;
      const meta = doc.metadata as Record<string, unknown>;
      if (meta?.userMessage && meta?.assistantMessage) {
        out.push(
          {
            role: "user",
            content: String(meta.userMessage),
            timestamp: String(meta.timestamp || ""),
          },
          {
            role: "assistant",
            content: String(meta.assistantMessage),
            timestamp: String(meta.timestamp || ""),
          }
        );
      }
    }
    return out.slice(-6);
  } catch (err) {
    console.error("Conversation memory retrieval failed:", err);
    return [];
  }
}
