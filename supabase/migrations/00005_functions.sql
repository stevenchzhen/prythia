-- Migration 00005: Functions and triggers

-- ============================================
-- Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_events_updated_at ON events;
CREATE TRIGGER trigger_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_alerts_updated_at ON alerts;
CREATE TRIGGER trigger_alerts_updated_at
    BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_ai_conversations_updated_at ON ai_conversations;
CREATE TRIGGER trigger_ai_conversations_updated_at
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_source_contracts_updated_at ON source_contracts;
CREATE TRIGGER trigger_source_contracts_updated_at
    BEFORE UPDATE ON source_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================
-- Auto-create user preferences and default watchlist group on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);
    INSERT INTO public.watchlist_groups (user_id, name, sort_order) VALUES (NEW.id, 'Default', 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================
-- Update category event count on event insert/update/delete
-- ============================================
CREATE OR REPLACE FUNCTION update_category_event_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate for affected categories
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        UPDATE categories SET event_count = (
            SELECT COUNT(*) FROM events WHERE category = OLD.category AND is_active = TRUE
        ) WHERE slug = OLD.category;
    END IF;

    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE categories SET event_count = (
            SELECT COUNT(*) FROM events WHERE category = NEW.category AND is_active = TRUE
        ) WHERE slug = NEW.category;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_category_count ON events;
CREATE TRIGGER trigger_update_category_count
    AFTER INSERT OR UPDATE OR DELETE ON events
    FOR EACH ROW EXECUTE FUNCTION update_category_event_count();
