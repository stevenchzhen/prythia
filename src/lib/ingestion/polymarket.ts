import { supabaseAdmin } from '@/lib/supabase/admin'

const POLYMARKET_GAMMA_API = 'https://gamma-api.polymarket.com'

/**
 * Shape returned by the Gamma /events endpoint.
 * Each event contains nested markets[].
 */
interface PolymarketEvent {
  id: string
  slug: string
  title: string
  description: string
  active: boolean
  closed: boolean
  liquidity: number
  endDate: string
  createdAt: string
  updatedAt: string
  markets: PolymarketMarket[]
}

interface PolymarketMarket {
  id: string
  question: string
  conditionId: string
  slug: string
  outcomes: string         // JSON string: '["Yes", "No"]'
  outcomePrices: string    // JSON string: '["0.65", "0.35"]'
  liquidity: string        // string number
  volume: string           // total volume, string number (may be missing)
  active: boolean
  closed: boolean
  endDate: string
  startDate: string
  bestBid: number
  bestAsk: number
  spread: number
  liquidityNum: number
  createdAt: string
  updatedAt: string
}

/**
 * Fetch all active events from Polymarket's Gamma API.
 * Paginates automatically until all events are fetched.
 */
async function fetchAllEvents(): Promise<PolymarketEvent[]> {
  const allEvents: PolymarketEvent[] = []
  const PAGE_SIZE = 100
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const url = `${POLYMARKET_GAMMA_API}/events?order=id&ascending=false&closed=false&limit=${PAGE_SIZE}&offset=${offset}`
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`)
    }

    const events: PolymarketEvent[] = await response.json()
    allEvents.push(...events)

    if (events.length < PAGE_SIZE) {
      hasMore = false
    } else {
      offset += PAGE_SIZE
    }

    // Safety cap: don't fetch more than 2000 events
    if (offset >= 2000) break
  }

  return allEvents
}

/**
 * Parse the YES price from Polymarket's outcomePrices JSON string.
 * Returns a number between 0 and 1.
 */
function parseYesPrice(outcomePrices: string): number | null {
  try {
    const prices = JSON.parse(outcomePrices) as string[]
    const yesPrice = parseFloat(prices[0])
    return isNaN(yesPrice) ? null : yesPrice
  } catch {
    return null
  }
}

/**
 * Full Polymarket ingestion pipeline:
 * 1. Fetch all active events with their markets
 * 2. Flatten to individual markets (binary only)
 * 3. Normalize to source_contracts schema
 * 4. Upsert into Supabase
 */
export async function fetchPolymarket() {
  const events = await fetchAllEvents()

  // Flatten: each event can have multiple markets
  // Filter to active binary markets with valid prices
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

  for (const event of events) {
    if (!event.active || event.closed) continue
    for (const market of event.markets || []) {
      if (!market.active || market.closed) continue

      const yesPrice = parseYesPrice(market.outcomePrices)
      if (yesPrice === null) continue

      const liquidity = market.liquidityNum || parseFloat(market.liquidity) || 0

      contracts.push({
        platform: 'polymarket',
        platform_contract_id: market.conditionId,
        platform_url: `https://polymarket.com/event/${market.slug}`,
        contract_title: market.question,
        price: yesPrice,
        volume_24h: 0,  // Gamma API doesn't give 24h volume directly; we track via snapshots
        volume_total: parseFloat(market.volume) || 0,
        liquidity,
        num_traders: 0,  // Not available from this endpoint
        last_trade_at: market.updatedAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      })
    }
  }

  // Deduplicate by conditionId — Polymarket can return the same market in multiple events
  const seen = new Set<string>()
  const dedupedContracts = contracts.filter((c) => {
    if (seen.has(c.platform_contract_id)) return false
    seen.add(c.platform_contract_id)
    return true
  })

  if (dedupedContracts.length === 0) {
    return { source: 'polymarket', count: 0, upserted: 0 }
  }

  // Upsert in batches of 100 (Supabase limit)
  const BATCH_SIZE = 100
  let upserted = 0

  for (let i = 0; i < dedupedContracts.length; i += BATCH_SIZE) {
    const batch = dedupedContracts.slice(i, i + BATCH_SIZE)
    const { error } = await supabaseAdmin
      .from('source_contracts')
      .upsert(batch, {
        onConflict: 'platform,platform_contract_id',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`Polymarket upsert error (batch ${i}):`, error)
    } else {
      upserted += batch.length
    }
  }

  // Mark contracts not in current fetch as inactive
  const activeIds = dedupedContracts.map(c => c.platform_contract_id)
  const { error: deactivateError } = await supabaseAdmin
    .from('source_contracts')
    .update({ is_active: false })
    .eq('platform', 'polymarket')
    .eq('is_active', true)
    .not('platform_contract_id', 'in', `(${activeIds.join(',')})`)

  if (deactivateError) {
    console.error('Polymarket deactivation error:', deactivateError)
  }

  return {
    source: 'polymarket',
    count: dedupedContracts.length,
    upserted,
    events_fetched: events.length,
    duplicates_removed: contracts.length - dedupedContracts.length,
  }
}
