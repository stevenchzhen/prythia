import { supabaseAdmin } from '@/lib/supabase/admin'

const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2'

/** Categories to ingest — excludes Sports and Entertainment */
const DESIRED_CATEGORIES = new Set([
  'Politics',
  'Economics',
  'Financials',
  'Elections',
  'World',
  'Climate and Weather',
  'Science and Technology',
  'Companies',
  'Crypto',
  'Health',
  'Social',
  'Transportation',
  'Education',
  'Mentions',
])

/** Kalshi market nested inside an event */
interface KalshiMarket {
  ticker: string
  event_ticker: string
  title: string
  subtitle: string
  yes_sub_title: string
  market_type: string
  status: string
  last_price: number
  last_price_dollars: string
  yes_bid: number
  yes_bid_dollars: string
  yes_ask: number
  yes_ask_dollars: string
  previous_price_dollars: string
  volume: number
  volume_24h: number
  liquidity: number
  liquidity_dollars: string
  open_interest: number
  close_time: string
  open_time: string
  created_time: string
  updated_time: string
  result: string
  rules_primary: string
}

/** Kalshi event from the /events endpoint */
interface KalshiEvent {
  event_ticker: string
  series_ticker: string
  title: string
  category: string
  markets: KalshiMarket[]
}

interface KalshiEventsResponse {
  events: KalshiEvent[]
  cursor: string
}

/**
 * Parse Kalshi's dollar string ("0.5600") to a float.
 */
function parseDollars(s: string): number {
  const v = parseFloat(s)
  return isNaN(v) ? 0 : v
}

/**
 * Fetch all open Kalshi events with nested markets.
 * Uses cursor-based pagination on the /events endpoint.
 */
async function fetchAllEvents(): Promise<KalshiEvent[]> {
  const allEvents: KalshiEvent[] = []
  let cursor = ''
  let hasMore = true
  const PAGE_SIZE = 200

  while (hasMore) {
    const params = new URLSearchParams({
      status: 'open',
      with_nested_markets: 'true',
      limit: String(PAGE_SIZE),
    })
    if (cursor) params.set('cursor', cursor)

    const response = await fetch(`${KALSHI_API}/events?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.status}`)
    }

    const data: KalshiEventsResponse = await response.json()
    allEvents.push(...(data.events || []))

    if (!data.cursor || (data.events || []).length < PAGE_SIZE) {
      hasMore = false
    } else {
      cursor = data.cursor
    }

    // Safety cap
    if (allEvents.length >= 5000) break
  }

  return allEvents
}

/**
 * Full Kalshi ingestion pipeline:
 * 1. Fetch all open events with nested markets
 * 2. Filter out sports/entertainment categories
 * 3. Extract binary markets with valid prices
 * 4. Normalize to source_contracts schema
 * 5. Upsert into Supabase
 */
export async function fetchKalshi() {
  const events = await fetchAllEvents()

  // Filter to desired categories
  const filteredEvents = events.filter(e => DESIRED_CATEGORIES.has(e.category))

  // Extract individual binary markets from events
  const contracts: Array<{
    platform: string
    platform_contract_id: string
    platform_url: string
    contract_title: string
    price: number
    volume_24h: number
    volume_total: number
    liquidity: number
    num_traders: number
    last_trade_at: string
    updated_at: string
    is_active: boolean
  }> = []

  for (const event of filteredEvents) {
    for (const m of event.markets || []) {
      if (m.market_type !== 'binary' || m.status !== 'active') continue

      const bid = parseDollars(m.yes_bid_dollars)
      const ask = parseDollars(m.yes_ask_dollars)
      const last = parseDollars(m.last_price_dollars)
      const price = bid > 0 && ask > 0 ? (bid + ask) / 2 : last

      if (price <= 0 || price >= 1) continue

      // Kalshi's updated_time reflects metadata changes, not actual trades.
      // Don't fall back to now() — use a stale timestamp so the aggregator's
      // staleness penalty works honestly.
      const fallbackStale = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
      const lastTradeAt = m.updated_time || fallbackStale

      contracts.push({
        platform: 'kalshi',
        platform_contract_id: m.ticker,
        platform_url: `https://kalshi.com/markets/${m.event_ticker}/${m.ticker}`,
        contract_title: m.title || m.yes_sub_title || event.title,
        price: Math.round(price * 10000) / 10000,
        volume_24h: m.volume_24h || 0,
        volume_total: m.volume || 0,
        liquidity: parseDollars(m.liquidity_dollars),
        num_traders: 0,
        last_trade_at: lastTradeAt,
        updated_at: new Date().toISOString(),
        is_active: true,
      })
    }
  }

  // Deduplicate by ticker
  const seen = new Set<string>()
  const deduped = contracts.filter((c) => {
    if (seen.has(c.platform_contract_id)) return false
    seen.add(c.platform_contract_id)
    return true
  })

  if (deduped.length === 0) {
    return {
      source: 'kalshi',
      count: 0,
      upserted: 0,
      events_fetched: events.length,
      events_filtered: filteredEvents.length,
      sports_excluded: events.length - filteredEvents.length,
    }
  }

  // Mark all Kalshi contracts inactive first, then upsert re-activates current ones.
  // This avoids a massive NOT IN clause that can exceed URL length limits.
  const { error: deactivateError } = await supabaseAdmin
    .from('source_contracts')
    .update({ is_active: false })
    .eq('platform', 'kalshi')
    .eq('is_active', true)

  if (deactivateError) {
    console.error('Kalshi deactivation error:', deactivateError)
  }

  // Upsert in batches (re-activates current contracts via is_active: true)
  const BATCH_SIZE = 100
  let upserted = 0

  for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
    const batch = deduped.slice(i, i + BATCH_SIZE)
    const { error } = await supabaseAdmin
      .from('source_contracts')
      .upsert(batch, {
        onConflict: 'platform,platform_contract_id',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`Kalshi upsert error (batch ${i}):`, error)
    } else {
      upserted += batch.length
    }
  }

  return {
    source: 'kalshi',
    count: deduped.length,
    upserted,
    events_fetched: events.length,
    events_filtered: filteredEvents.length,
    sports_excluded: events.length - filteredEvents.length,
  }
}
