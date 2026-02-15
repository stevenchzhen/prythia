-- Migration 00004: Row Level Security policies

-- ============================================
-- Events: Public read, admin write
-- ============================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are publicly readable"
    ON events FOR SELECT USING (true);
CREATE POLICY "Events are admin-writable"
    ON events FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Source contracts: Public read
ALTER TABLE source_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Source contracts are publicly readable"
    ON source_contracts FOR SELECT USING (true);

-- Probability snapshots: Public read
ALTER TABLE probability_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Snapshots are publicly readable"
    ON probability_snapshots FOR SELECT USING (true);

-- Daily stats: Public read
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Daily stats are publicly readable"
    ON daily_stats FOR SELECT USING (true);

-- Categories: Public read
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly readable"
    ON categories FOR SELECT USING (true);

-- Event source mappings: Public read
ALTER TABLE event_source_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mappings are publicly readable"
    ON event_source_mappings FOR SELECT USING (true);

-- ============================================
-- User tables: Only own data
-- ============================================

-- API Keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own API keys"
    ON api_keys FOR ALL USING (auth.uid() = user_id);

-- Watchlist groups
ALTER TABLE watchlist_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watchlist groups"
    ON watchlist_groups FOR ALL USING (auth.uid() = user_id);

-- Watchlist items
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watchlist items"
    ON watchlist_items FOR ALL USING (auth.uid() = user_id);

-- Alerts
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own alerts"
    ON alerts FOR ALL USING (auth.uid() = user_id);

-- Alert history
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own alert history"
    ON alert_history FOR SELECT USING (auth.uid() = user_id);

-- User preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own preferences"
    ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- AI tables: Only own data
-- ============================================

-- AI conversations
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own conversations"
    ON ai_conversations FOR ALL USING (auth.uid() = user_id);

-- AI messages (read through conversation ownership)
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own messages"
    ON ai_messages FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM ai_conversations WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Users insert own messages"
    ON ai_messages FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM ai_conversations WHERE user_id = auth.uid()
        )
    );
