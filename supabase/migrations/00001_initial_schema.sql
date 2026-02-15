-- Migration 00001: Core tables
-- events, source_contracts, probability_snapshots, daily_stats, categories, event_source_mappings

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- EVENTS: Core prediction market events
-- ============================================
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,

    -- Taxonomy
    category TEXT NOT NULL,
    subcategory TEXT,
    topic TEXT,
    tags TEXT[] DEFAULT '{}',

    -- Current aggregated probability (denormalized for fast queries)
    probability DECIMAL(5,4),
    prob_change_24h DECIMAL(5,4),
    prob_change_7d DECIMAL(5,4),
    prob_change_30d DECIMAL(5,4),
    prob_high_30d DECIMAL(5,4),
    prob_low_30d DECIMAL(5,4),

    -- Aggregated volume & quality
    volume_24h DECIMAL(15,2) DEFAULT 0,
    volume_total DECIMAL(15,2) DEFAULT 0,
    liquidity_total DECIMAL(15,2) DEFAULT 0,
    trader_count INTEGER DEFAULT 0,
    source_count INTEGER DEFAULT 0,
    quality_score DECIMAL(3,2) DEFAULT 0,

    -- Resolution
    resolution_date TIMESTAMPTZ,
    resolution_status TEXT DEFAULT 'open'
        CHECK (resolution_status IN ('open', 'resolved_yes', 'resolved_no', 'voided')),
    resolution_criteria TEXT,
    resolved_at TIMESTAMPTZ,

    -- AI Analysis (stored as JSONB for flexibility)
    ai_analysis JSONB,
    ai_analysis_updated_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);


-- ============================================
-- SOURCE_CONTRACTS: Individual platform contracts linked to events
-- ============================================
CREATE TABLE source_contracts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,

    platform TEXT NOT NULL,
    platform_contract_id TEXT NOT NULL,
    platform_url TEXT,
    contract_title TEXT,

    -- Current data
    price DECIMAL(5,4),
    volume_24h DECIMAL(15,2) DEFAULT 0,
    volume_total DECIMAL(15,2) DEFAULT 0,
    liquidity DECIMAL(15,2) DEFAULT 0,
    num_traders INTEGER DEFAULT 0,
    last_trade_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,

    UNIQUE(platform, platform_contract_id)
);


-- ============================================
-- PROBABILITY_SNAPSHOTS: Time-series data (every 5 min)
-- ============================================
CREATE TABLE probability_snapshots (
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL,

    probability DECIMAL(5,4) NOT NULL,
    volume DECIMAL(15,2),
    liquidity DECIMAL(15,2),
    num_traders INTEGER,
    quality_score DECIMAL(3,2),

    PRIMARY KEY (event_id, source, captured_at)
);


-- ============================================
-- DAILY_STATS: Pre-aggregated daily data (for fast historical charts)
-- ============================================
CREATE TABLE daily_stats (
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    prob_open DECIMAL(5,4),
    prob_close DECIMAL(5,4),
    prob_high DECIMAL(5,4),
    prob_low DECIMAL(5,4),

    volume_total DECIMAL(15,2),
    liquidity_avg DECIMAL(15,2),
    trader_count INTEGER,
    quality_score_avg DECIMAL(3,2),

    PRIMARY KEY (event_id, date)
);


-- ============================================
-- CATEGORIES: Taxonomy reference table
-- ============================================
CREATE TABLE categories (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_slug TEXT REFERENCES categories(slug),
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    event_count INTEGER DEFAULT 0
);


-- ============================================
-- EVENT_SOURCE_MAPPINGS: Manual contract-to-event mapping (v0)
-- ============================================
CREATE TABLE event_source_mappings (
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    platform_contract_id TEXT NOT NULL,
    confidence TEXT DEFAULT 'manual',
    mapped_by TEXT DEFAULT 'admin',
    mapped_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (platform, platform_contract_id)
);
