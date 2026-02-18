/**
 * Granular cache for enrichment APIs: classify, summary, macro, pairing.
 * Uses pgvector metadata filtering so a "classify" lookup never returns a "summary" hit.
 */
import { Document } from "@langchain/core/documents";
import { getOrCreateStore } from "./vectorStoreFactory";

const TABLE_NAME = "enrichment_cache";
const SIMILARITY_THRESHOLD = 0.08;

export type EnrichmentType = "classify" | "summary" | "macro" | "pairing";

export async function checkEnrichmentCache<T>(
  type: EnrichmentType,
  inputText: string
): Promise<T | null> {
  const store = await getOrCreateStore(TABLE_NAME);
  if (!store) return null;

  const key = `[${type}] ${inputText.slice(0, 2000)}`;

  try {
    // Filter by type via pgvector metadata (avoids cross-type false positives)
    const results = await store.similaritySearchWithScore(key, 1, { type });
    if (results.length === 0) return null;

    const [doc, score] = results[0];
    if (score > SIMILARITY_THRESHOLD) return null;

    return (doc.metadata as Record<string, unknown>).result as T;
  } catch (err) {
    console.error("Enrichment cache lookup failed:", err);
    return null;
  }
}

export async function storeEnrichmentCache<T>(
  type: EnrichmentType,
  inputText: string,
  result: T
): Promise<void> {
  const store = await getOrCreateStore(TABLE_NAME);
  if (!store) return;

  try {
    await store.addDocuments([
      new Document({
        pageContent: `[${type}] ${inputText.slice(0, 2000)}`,
        metadata: { type, result },
      }),
    ]);
  } catch (err) {
    console.error("Enrichment cache store failed:", err);
  }
}
