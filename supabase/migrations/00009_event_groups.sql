-- Multi-outcome event grouping
-- Supports topics with multiple markets (price brackets, categorical outcomes)

-- Add grouping columns to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS parent_event_id TEXT REFERENCES events(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS outcome_type TEXT DEFAULT 'binary';
  -- binary: standard yes/no event (default)
  -- price_bracket: one of N price ranges (e.g. "$50k-$60k")
  -- categorical: one of N named outcomes (e.g. "next pope")
ALTER TABLE events ADD COLUMN IF NOT EXISTS outcome_label TEXT;
  -- human-readable label for this outcome within the group
  -- e.g. "$50k-$60k", "Cardinal Tagle", "Above 3%"
ALTER TABLE events ADD COLUMN IF NOT EXISTS outcome_index INTEGER;
  -- sort order within the group (0-indexed)

CREATE INDEX IF NOT EXISTS idx_events_parent ON events(parent_event_id)
  WHERE parent_event_id IS NOT NULL;

-- Parent events use outcome_type to indicate they're a group container
-- Child events have parent_event_id set to the parent's ID
-- Parent probability = null (doesn't make sense to aggregate brackets)
-- Each child has its own probability from aggregation

-- RLS: parent events are publicly readable (same as regular events)
-- No new policies needed — existing events RLS covers this
