-- PryCalibration: backtest company decisions against prediction market data
-- Users upload past decisions, Prythia scores them against what markets knew at the time

-- Decision uploads (a batch of decisions from a user)
CREATE TABLE IF NOT EXISTS calibration_sessions (
  id TEXT PRIMARY KEY DEFAULT 'cal_' || substr(gen_random_uuid()::text, 1, 12),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, processing, complete, error
  total_decisions INTEGER DEFAULT 0,
  avg_calibration_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Individual decisions within a session
CREATE TABLE IF NOT EXISTS calibration_decisions (
  id TEXT PRIMARY KEY DEFAULT 'dec_' || substr(gen_random_uuid()::text, 1, 12),
  session_id TEXT NOT NULL REFERENCES calibration_sessions(id) ON DELETE CASCADE,

  -- What the user did
  decision_date DATE NOT NULL,
  decision_type TEXT NOT NULL, -- 'hedge', 'expand', 'contract', 'price_change', 'supplier_switch', 'hold', 'other'
  description TEXT NOT NULL,

  -- What event it relates to
  event_category TEXT, -- matched category (tariffs, rates, etc.)
  matched_event_id TEXT REFERENCES events(id),
  search_query TEXT, -- what was searched in historical data

  -- Market state at decision time
  market_probability NUMERIC, -- what the market said at decision_date
  market_prob_7d_before NUMERIC, -- 7 days before decision
  market_prob_30d_after NUMERIC, -- 30 days after decision
  actual_outcome TEXT, -- what actually happened

  -- Scoring
  timing_score NUMERIC, -- -1 to 1: how well-timed vs market consensus
  direction_score NUMERIC, -- 0 or 1: did the decision align with eventual outcome
  calibration_score NUMERIC, -- 0 to 1: overall calibration
  analysis TEXT, -- AI-generated analysis of this decision

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Market calibration curves (pre-computed from historical data)
-- How accurate were prediction markets at each probability level?
CREATE TABLE IF NOT EXISTS market_calibration (
  id SERIAL PRIMARY KEY,
  platform TEXT NOT NULL, -- 'polymarket', 'kalshi', 'aggregated'
  category TEXT, -- null = overall, or specific category
  prob_bucket NUMERIC NOT NULL, -- 0.0, 0.1, 0.2, ... 0.9
  actual_rate NUMERIC NOT NULL, -- what % actually happened
  sample_count INTEGER NOT NULL,
  time_period TEXT NOT NULL, -- '2020-2026', '2024-2026', etc.
  computed_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cal_sessions_user ON calibration_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cal_decisions_session ON calibration_decisions(session_id);
CREATE INDEX IF NOT EXISTS idx_market_cal_platform ON market_calibration(platform, category);

-- RLS
ALTER TABLE calibration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_calibration ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions/decisions
CREATE POLICY cal_sessions_user ON calibration_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY cal_decisions_user ON calibration_decisions
  FOR ALL USING (
    session_id IN (SELECT id FROM calibration_sessions WHERE user_id = auth.uid())
  );

-- Market calibration is readable by all authenticated users
CREATE POLICY market_cal_read ON market_calibration
  FOR SELECT USING (auth.uid() IS NOT NULL);
