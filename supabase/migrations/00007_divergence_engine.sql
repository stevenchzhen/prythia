-- Divergence Engine: track cross-platform price divergence over time

CREATE TABLE divergence_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    platform_a TEXT NOT NULL,
    platform_b TEXT NOT NULL,
    price_a DECIMAL(5,4) NOT NULL,
    price_b DECIMAL(5,4) NOT NULL,
    spread DECIMAL(5,4) NOT NULL,
    higher_platform TEXT NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_platform_order CHECK (platform_a < platform_b)
);

-- Divergence history for an event
CREATE INDEX idx_divergence_event_time
    ON divergence_snapshots (event_id, captured_at DESC);

-- Specific pair history
CREATE INDEX idx_divergence_pair_time
    ON divergence_snapshots (event_id, platform_a, platform_b, captured_at DESC);

-- Find high-divergence events
CREATE INDEX idx_divergence_spread
    ON divergence_snapshots (spread DESC, captured_at DESC);

-- Add max_spread to events for fast sorting/filtering
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_spread DECIMAL(5,4) DEFAULT 0;

-- Sort active events by divergence
CREATE INDEX idx_events_max_spread
    ON events (max_spread DESC) WHERE is_active = TRUE;
