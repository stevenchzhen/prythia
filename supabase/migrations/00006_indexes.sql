-- Migration 00006: Performance indexes

-- ============================================
-- Events indexes
-- ============================================
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_subcategory ON events(subcategory);
CREATE INDEX idx_events_probability ON events(probability);
CREATE INDEX idx_events_volume ON events(volume_24h DESC);
CREATE INDEX idx_events_quality ON events(quality_score);
CREATE INDEX idx_events_resolution_date ON events(resolution_date);
CREATE INDEX idx_events_status ON events(resolution_status);
CREATE INDEX idx_events_updated ON events(updated_at DESC);
CREATE INDEX idx_events_active ON events(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_events_tags ON events USING GIN(tags);

-- Trigram index for fuzzy text search
CREATE INDEX idx_events_title_trgm ON events USING GIN(title gin_trgm_ops);

-- Full-text search vector
ALTER TABLE events ADD COLUMN IF NOT EXISTS fts tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C')
    ) STORED;
CREATE INDEX idx_events_fts ON events USING GIN(fts);

-- ============================================
-- Source contracts indexes
-- ============================================
CREATE INDEX idx_source_contracts_event ON source_contracts(event_id);
CREATE INDEX idx_source_contracts_platform ON source_contracts(platform);

-- ============================================
-- Probability snapshots indexes
-- ============================================
CREATE INDEX idx_snapshots_event_time ON probability_snapshots(event_id, captured_at DESC);
CREATE INDEX idx_snapshots_time ON probability_snapshots(captured_at DESC);

-- ============================================
-- User table indexes
-- ============================================
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE is_active = TRUE;
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_watchlist_items_user ON watchlist_items(user_id);
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_event ON alerts(event_id) WHERE is_active = TRUE;
CREATE INDEX idx_alerts_active ON alerts(is_active) WHERE is_active = TRUE;
