-- Run this on Neon/Railway PostgreSQL (or any Postgres with pgvector)
-- psql $POSTGRES_URL -f scripts/init-pgvector.sql
--
-- PGVectorStore.initialize() creates tables on first use.
-- This script ensures the pgvector extension is enabled.

CREATE EXTENSION IF NOT EXISTS vector;

-- Tables created automatically by LangChain on first use:
-- - recipe_embeddings (semantic cache for generated recipes)
-- - recipe_index (similar recipes - synced from Firestore)
-- - enrichment_cache (classify, summary, macro, pairing cache)
-- - conversation_memory (Pro users - chat history for recall)
