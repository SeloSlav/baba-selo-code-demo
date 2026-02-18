-- Run this on Railway PostgreSQL (or any Postgres with pgvector)
-- psql $DATABASE_URL -f scripts/init-pgvector.sql
--
-- PGVectorStore.initialize() will create the table if it doesn't exist.
-- This script only ensures the pgvector extension is enabled.

CREATE EXTENSION IF NOT EXISTS vector;
