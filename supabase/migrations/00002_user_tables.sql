-- Migration 00002: User tables
-- api_keys, watchlist_groups, watchlist_items, alerts, alert_history, user_preferences

-- ============================================
-- API_KEYS: External API access keys
-- ============================================
CREATE TABLE api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    name TEXT NOT NULL,
    scopes TEXT[] DEFAULT '{read}',
    tier TEXT DEFAULT 'free',

    -- Rate limit tracking
    requests_today INTEGER DEFAULT 0,
    requests_reset_at TIMESTAMPTZ,

    -- Metadata
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);


-- ============================================
-- WATCHLIST_GROUPS: Named groups within a user's watchlist
-- ============================================
CREATE TABLE watchlist_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Default',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- WATCHLIST_ITEMS: Individual events in a watchlist group
-- ============================================
CREATE TABLE watchlist_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES watchlist_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, event_id)
);


-- ============================================
-- ALERTS: User-configured notification rules
-- ============================================
CREATE TABLE alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Target (event-specific or category-wide)
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    category TEXT,

    -- Condition
    alert_type TEXT NOT NULL
        CHECK (alert_type IN ('threshold_cross', 'movement', 'volume_spike', 'new_event', 'resolution', 'divergence')),
    condition JSONB NOT NULL,

    -- Delivery
    channels TEXT[] DEFAULT '{in_app}',
    webhook_url TEXT,
    slack_webhook_url TEXT,

    -- Throttle
    frequency TEXT DEFAULT 'once_per_24h'
        CHECK (frequency IN ('realtime', 'once_per_hour', 'once_per_24h', 'daily_digest')),
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- ALERT_HISTORY: Log of fired alerts
-- ============================================
CREATE TABLE alert_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id TEXT REFERENCES events(id),

    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    trigger_data JSONB,
    channels_sent TEXT[],
    delivery_status TEXT DEFAULT 'sent'
);


-- ============================================
-- USER_PREFERENCES: Display and notification settings
-- ============================================
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    display_density TEXT DEFAULT 'default'
        CHECK (display_density IN ('compact', 'default', 'expanded')),
    theme TEXT DEFAULT 'dark'
        CHECK (theme IN ('dark', 'light')),
    default_category TEXT,
    timezone TEXT DEFAULT 'America/Los_Angeles',

    -- Notification prefs
    email_alerts BOOLEAN DEFAULT TRUE,
    email_digest BOOLEAN DEFAULT TRUE,
    digest_time TEXT DEFAULT '07:00',
    quiet_hours_start TEXT,
    quiet_hours_end TEXT,

    -- AI prefs
    show_ai_analysis BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
