/**
 * App-wide constants for the Prythia application.
 */

// ─── Taxonomy ──────────────────────────────────────────────────────

export const CATEGORIES = {
  GEOPOLITICS: 'geopolitics',
  TRADE_TARIFFS: 'trade_tariffs',
  SANCTIONS: 'sanctions_export_controls',
  MILITARY_CONFLICT: 'military_conflict',
  DIPLOMACY: 'diplomacy_treaties',
  ELECTIONS: 'elections_political',
  MONETARY_POLICY: 'monetary_policy',
  FISCAL_POLICY: 'fiscal_policy',
  REGULATION: 'regulation',
  ECONOMIC_INDICATORS: 'economic_indicators',
  TECHNOLOGY: 'technology_industry',
  SCIENCE_ENVIRONMENT: 'science_environment',
} as const

export const CATEGORY_LABELS: Record<string, string> = {
  geopolitics: 'Geopolitics',
  trade_tariffs: 'Trade & Tariffs',
  sanctions_export_controls: 'Sanctions',
  military_conflict: 'Military & Conflict',
  diplomacy_treaties: 'Diplomacy',
  elections_political: 'Elections',
  monetary_policy: 'Monetary Policy',
  fiscal_policy: 'Fiscal Policy',
  regulation: 'Regulation',
  economic_indicators: 'Economic Indicators',
  technology_industry: 'Technology',
  science_environment: 'Science & Environment',
}

// ─── Platforms ─────────────────────────────────────────────────────

export const PLATFORMS = {
  POLYMARKET: 'polymarket',
  KALSHI: 'kalshi',
  METACULUS: 'metaculus',
  PREDICTIT: 'predictit', // v1
  MANIFOLD: 'manifold', // v1
} as const

export const PLATFORM_LABELS: Record<string, string> = {
  polymarket: 'Polymarket',
  kalshi: 'Kalshi',
  metaculus: 'Metaculus',
  predictit: 'PredictIt',
  manifold: 'Manifold',
}

// ─── Quality Thresholds ────────────────────────────────────────────

export const QUALITY_THRESHOLDS = {
  LOW: 0.3,
  MEDIUM: 0.5,
  HIGH: 0.7,
} as const

// ─── Volume Thresholds ─────────────────────────────────────────────

export const MIN_VOLUME_FOR_MOVERS = 50_000 // $50K minimum to appear in Biggest Movers
export const MIN_VOLUME_FOR_AI_ANALYSIS = 100_000 // $100K to auto-generate AI analysis

// ─── Alert Limits ──────────────────────────────────────────────────

export const MAX_ALERTS_PER_USER = {
  free: 5,
  starter: 25,
  pro: 100,
  enterprise: 1000,
} as const

// ─── API Limits ────────────────────────────────────────────────────

export const API_RATE_LIMITS = {
  free: 30,
  starter: 300,
  pro: 3000,
  enterprise: 100000,
} as const

// ─── Display ───────────────────────────────────────────────────────

export const MOVEMENT_THRESHOLD = 0.01 // ±1% is considered "stable"
export const OUTLIER_THRESHOLD = 0.15 // 15% divergence flags an outlier
export const STALENESS_24H_PENALTY = 0.5
export const STALENESS_72H_PENALTY = 0.2
