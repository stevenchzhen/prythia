-- Migration 00006: Performance indexes

-- ============================================
-- Events indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_subcategory ON events(subcategory);
CREATE INDEX IF NOT EXISTS idx_events_probability ON events(probability);
CREATE INDEX IF NOT EXISTS idx_events_volume ON events(volume_24h DESC);
CREATE INDEX IF NOT EXISTS idx_events_quality ON events(quality_score);
CREATE INDEX IF NOT EXISTS idx_events_resolution_date ON events(resolution_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(resolution_status);
CREATE INDEX IF NOT EXISTS idx_events_updated ON events(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING GIN(tags);

-- Trigram index for fuzzy text search
CREATE INDEX IF NOT EXISTS idx_events_title_trgm ON events USING GIN(title gin_trgm_ops);

-- Full-text search: use a trigger-maintained column instead of GENERATED ALWAYS
-- (Postgres requires IMMUTABLE functions for generated columns, but to_tsvector is STABLE)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'fts'
    ) THEN
        ALTER TABLE events ADD COLUMN fts tsvector;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_fts ON events USING GIN(fts);

-- Trigger to keep fts column updated
CREATE OR REPLACE FUNCTION events_fts_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fts :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_events_fts ON events;
CREATE TRIGGER trigger_events_fts
    BEFORE INSERT OR UPDATE OF title, description, tags ON events
    FOR EACH ROW EXECUTE FUNCTION events_fts_update();

-- Backfill existing rows
UPDATE events SET fts =
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C');

-- ============================================
-- Source contracts indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_source_contracts_event ON source_contracts(event_id);
CREATE INDEX IF NOT EXISTS idx_source_contracts_platform ON source_contracts(platform);

-- ============================================
-- Probability snapshots indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_snapshots_event_time ON probability_snapshots(event_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_time ON probability_snapshots(captured_at DESC);

-- ============================================
-- User table indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_user ON watchlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_event ON alerts(event_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active) WHERE is_active = TRUE;
