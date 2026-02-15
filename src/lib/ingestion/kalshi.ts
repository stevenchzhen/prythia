import { supabaseAdmin } from '@/lib/supabase/admin'

const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2'

/**
 * Kalshi market from the /markets endpoint.
 * Prices in dollars as fixed-point strings (e.g., "0.5600").
 */
interface KalshiMarket {
  ticker: string
  event_ticker: string
  title: string
  subtitle: string
  yes_sub_title: string
  market_type: string          // "binary" | "scalar"
  status: string               // "active" | "closed" | "settled" etc.
  last_price: number           // deprecated cents
  last_price_dollars: string   // "0.5600"
  yes_bid: number              // deprecated cents
  yes_bid_dollars: string
  yes_ask: number              // deprecated cents
  yes_ask_dollars: string
  previous_price_dollars: string
  volume: number
  volume_24h: number
  liquidity: number            // deprecated
  liquidity_dollars: string
  open_interest: number
  close_time: string
  open_time: string
  created_time: string
  updated_time: string
  result: string
  rules_primary: string
}

interface KalshiResponse {
  markets: KalshiMarket[]
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
 * Fetch all active Kalshi markets.
 * Uses cursor-based pagination.
 */
async function fetchAllMarkets(): Promise<KalshiMarket[]> {
  const allMarkets: KalshiMarket[] = []
  let cursor = ''
  let hasMore = true
  const PAGE_SIZE = 200

  while (hasMore) {
    const params = new URLSearchParams({
      status: 'open',
      limit: String(PAGE_SIZE),
    })
    if (cursor) params.set('cursor', cursor)

    const response = await fetch(`${KALSHI_API}/markets?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.status}`)
    }

    const data: KalshiResponse = await response.json()
    allMarkets.push(...(data.markets || []))

    if (!data.cursor || (data.markets || []).length < PAGE_SIZE) {
      hasMore = false
    } else {
      cursor = data.cursor
    }

    // Safety cap
    if (allMarkets.length >= 5000) break
  }

  return allMarkets
}

/**
 * Full Kalshi ingestion pipeline:
 * 1. Fetch all active markets
 * 2. Filter to binary markets with valid prices
 * 3. Normalize to source_contracts schema
 * 4. Upsert into Supabase
 */
export async function fetchKalshi() {
  const markets = await fetchAllMarkets()

  // Filter: binary only, with actual price data
  const contracts = markets
    .filter((m) => m.market_type === 'binary' && m.status === 'active')
    .map((m) => {
      // Use mid of yes_bid and yes_ask as price, fall back to last_price
      const bid = parseDollars(m.yes_bid_dollars)
      const ask = parseDollars(m.yes_ask_dollars)
      const last = parseDollars(m.last_price_dollars)
      const price = bid > 0 && ask > 0 ? (bid + ask) / 2 : last

      return {
        platform: 'kalshi' as const,
        platform_contract_id: m.ticker,
        platform_url: `https://kalshi.com/markets/${m.event_ticker}/${m.ticker}`,
        contract_title: m.title || m.yes_sub_title,
        price: Math.round(price * 10000) / 10000, // Round to 4 decimal places
        volume_24h: m.volume_24h || 0,
        volume_total: m.volume || 0,
        liquidity: parseDollars(m.liquidity_dollars),
        num_traders: 0, // Not available from this endpoint
        last_trade_at: m.updated_time || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      }
    })
    .filter((c) => c.price > 0 && c.price < 1) // Valid probability range

  // Deduplicate by ticker
  const seen = new Set<string>()
  const deduped = contracts.filter((c) => {
    if (seen.has(c.platform_contract_id)) return false
    seen.add(c.platform_contract_id)
    return true
  })

  if (deduped.length === 0) {
    return { source: 'kalshi', count: 0, upserted: 0 }
  }

  // Upsert in batches
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
    markets_fetched: markets.length,
  }
}
