-- 00012: User Context Profiles + Decision Journal
-- Extends user_preferences with business profile fields
-- Creates decision tracking tables with event linking

-- ─── Extend user_preferences with profile columns ────────────────────

ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS company_description TEXT;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS key_concerns TEXT[] DEFAULT '{}';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

-- ─── user_decisions ──────────────────────────────────────────────────

CREATE TABLE user_decisions (
  id TEXT PRIMARY KEY DEFAULT 'udec_' || substr(gen_random_uuid()::text, 1, 12),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  decision_type TEXT NOT NULL DEFAULT 'other'
    CHECK (decision_type IN (
      'hedge', 'expand', 'contract', 'price_change',
      'supplier_switch', 'hold', 'hire', 'invest', 'launch', 'other'
    )),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'decided', 'archived')),
  deadline DATE,
  decided_at TIMESTAMPTZ,
  outcome_notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_decisions_user_id ON user_decisions(user_id);
CREATE INDEX idx_user_decisions_status ON user_decisions(user_id, status);

-- ─── decision_event_links ────────────────────────────────────────────

CREATE TABLE decision_event_links (
  id TEXT PRIMARY KEY DEFAULT 'del_' || substr(gen_random_uuid()::text, 1, 12),
  decision_id TEXT NOT NULL REFERENCES user_decisions(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  link_source TEXT NOT NULL DEFAULT 'ai'
    CHECK (link_source IN ('ai', 'user', 'system')),
  prob_at_link NUMERIC,
  relevance_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(decision_id, event_id)
);

CREATE INDEX idx_decision_event_links_decision ON decision_event_links(decision_id);
CREATE INDEX idx_decision_event_links_event ON decision_event_links(event_id);

-- ─── RLS ─────────────────────────────────────────────────────────────

ALTER TABLE user_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_event_links ENABLE ROW LEVEL SECURITY;

-- Users can manage their own decisions
CREATE POLICY "Users manage own decisions"
  ON user_decisions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can manage links on their own decisions
CREATE POLICY "Users manage own decision links"
  ON decision_event_links FOR ALL
  USING (
    decision_id IN (
      SELECT id FROM user_decisions WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    decision_id IN (
      SELECT id FROM user_decisions WHERE user_id = auth.uid()
    )
  );

-- Service role bypass (for AI tool handlers)
CREATE POLICY "Service role full access decisions"
  ON user_decisions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access decision links"
  ON decision_event_links FOR ALL
  USING (auth.role() = 'service_role');
