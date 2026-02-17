/**
 * Shared TypeScript type definitions for the Prythia application.
 */

// ─── Core Data Models ──────────────────────────────────────────────

export interface Event {
  id: string
  title: string
  slug: string
  description: string | null

  // Taxonomy
  category: string
  subcategory: string | null
  topic: string | null
  tags: string[]

  // Current aggregated probability
  probability: number | null
  prob_change_24h: number | null
  prob_change_7d: number | null
  prob_change_30d: number | null
  prob_high_30d: number | null
  prob_low_30d: number | null

  // Aggregated volume & quality
  volume_24h: number | null
  volume_total: number | null
  liquidity_total: number | null
  trader_count: number | null
  source_count: number | null
  quality_score: number | null

  // Resolution
  resolution_date: string | null
  resolution_status: 'open' | 'resolved_yes' | 'resolved_no' | 'voided'
  resolution_criteria: string | null
  resolved_at: string | null

  // AI Analysis
  ai_analysis: AIAnalysis | null
  ai_analysis_updated_at: string | null

  // Divergence
  max_spread: number | null

  // Metadata
  created_at: string
  updated_at: string
  is_featured: boolean
  is_active: boolean
}

export interface AIAnalysis {
  summary: string
  key_drivers: string[]
  key_dates: Array<{ date: string; description: string }>
  related_events: Array<{ id: string; title: string; probability: number }>
}

export interface SourceContract {
  id: string
  event_id: string
  platform: string
  platform_contract_id: string
  platform_url: string | null
  contract_title: string | null
  price: number | null
  volume_24h: number | null
  volume_total: number | null
  liquidity: number | null
  num_traders: number | null
  last_trade_at: string | null
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface ProbabilitySnapshot {
  event_id: string
  source: string
  captured_at: string
  probability: number
  volume: number | null
  liquidity: number | null
  num_traders: number | null
  quality_score: number | null
}

export interface DailyStat {
  event_id: string
  date: string
  prob_open: number | null
  prob_close: number | null
  prob_high: number | null
  prob_low: number | null
  volume_total: number | null
  liquidity_avg: number | null
  trader_count: number | null
  quality_score_avg: number | null
}

export interface Category {
  slug: string
  name: string
  parent_slug: string | null
  description: string | null
  icon: string | null
  sort_order: number
  event_count: number
}

// ─── User Models ───────────────────────────────────────────────────

export interface ApiKey {
  id: string
  user_id: string
  key_prefix: string
  name: string
  scopes: string[]
  tier: string
  last_used_at: string | null
  created_at: string
  is_active: boolean
}

export interface WatchlistGroup {
  id: string
  user_id: string
  name: string
  sort_order: number
  created_at: string
}

export interface WatchlistItem {
  id: string
  group_id: string
  user_id: string
  event_id: string
  sort_order: number
  added_at: string
}

export interface Alert {
  id: string
  user_id: string
  event_id: string | null
  category: string | null
  alert_type: 'threshold_cross' | 'movement' | 'volume_spike' | 'new_event' | 'resolution' | 'divergence'
  condition: Record<string, unknown>
  channels: string[]
  webhook_url: string | null
  slack_webhook_url: string | null
  frequency: 'realtime' | 'once_per_hour' | 'once_per_24h' | 'daily_digest'
  last_triggered_at: string | null
  trigger_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  user_id: string
  display_density: 'compact' | 'default' | 'expanded'
  theme: 'dark' | 'light'
  default_category: string | null
  timezone: string
  email_alerts: boolean
  email_digest: boolean
  digest_time: string
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  show_ai_analysis: boolean
}

// ─── AI Models ─────────────────────────────────────────────────────

export interface AIConversation {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface AIMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  events_referenced: string[]
  created_at: string
}

// ─── Divergence Models ────────────────────────────────────────────

export interface DivergenceSnapshot {
  id: string
  event_id: string
  platform_a: string
  platform_b: string
  price_a: number
  price_b: number
  spread: number
  higher_platform: string
  captured_at: string
}

export interface DivergencePairSummary {
  platform_a: string
  platform_b: string
  price_a: number
  price_b: number
  spread: number
  higher_platform: string
  captured_at: string
}

export interface ResolutionAccuracy {
  window: string
  closer_platform: string | null
  price_a: number
  price_b: number
  outcome: number
  distance_a: number
  distance_b: number
}

// ─── API Response Types ────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    limit: number
    offset: number
    has_more: boolean
    request_id?: string
  }
}

export interface APIError {
  error: {
    code: string
    message: string
    details?: unknown
  }
}
