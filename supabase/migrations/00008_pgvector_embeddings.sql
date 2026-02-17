-- Embedding-based cross-platform contract matching via pgvector

CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns (Voyage voyage-3-lite = 512 dimensions)
ALTER TABLE events ADD COLUMN IF NOT EXISTS embedding vector(512);
ALTER TABLE source_contracts ADD COLUMN IF NOT EXISTS embedding vector(512);

-- HNSW indexes for fast cosine similarity search
CREATE INDEX idx_events_embedding
    ON events USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_source_contracts_embedding
    ON source_contracts USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Track which contracts have been checked by the cross-matcher
-- so we don't re-check rejected matches every run
ALTER TABLE source_contracts ADD COLUMN IF NOT EXISTS cross_match_checked_at TIMESTAMPTZ;

-- RPC: find events by embedding similarity
CREATE OR REPLACE FUNCTION match_events_by_embedding(
    query_embedding vector(512),
    match_threshold float DEFAULT 0.70,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    event_id TEXT,
    title TEXT,
    category TEXT,
    similarity float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        e.id AS event_id,
        e.title,
        e.category,
        1 - (e.embedding <=> query_embedding) AS similarity
    FROM events e
    WHERE e.is_active = TRUE
      AND e.embedding IS NOT NULL
      AND 1 - (e.embedding <=> query_embedding) > match_threshold
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
$$;
