import { supabaseAdmin } from '@/lib/supabase/admin'
import { calculateQualityScore } from './quality-scorer'

interface SourceData {
  platform: string
  price: number
  volume_24h: number
  volume_total: number
  liquidity: number
  num_traders: number
  last_trade_at: string
}

/**
 * Calculate volume-weighted average probability across platforms.
 * Higher volume = more informed signal.
 */
function volumeWeightedAverage(sources: SourceData[]): number {
  // Use liquidity as weight if volume_24h is 0 (common for Polymarket Gamma API)
  const weights = sources.map((s) => s.volume_total || s.liquidity || 1)
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)

  if (totalWeight === 0) {
    // Equal weight fallback
    return sources.reduce((sum, s) => sum + s.price, 0) / sources.length
  }

  return sources.reduce((sum, s, i) => sum + s.price * (weights[i] / totalWeight), 0)
}

/**
 * Apply staleness penalty: downweight platforms with old last trades.
 */
function applyStalenessPenalty(sources: SourceData[]): SourceData[] {
  const now = Date.now()
  return sources.map((s) => {
    const lastTrade = new Date(s.last_trade_at).getTime()
    const hoursAgo = (now - lastTrade) / (1000 * 60 * 60)

    let weight = 1.0
    if (hoursAgo > 72) weight = 0.2
    else if (hoursAgo > 24) weight = 0.5

    return {
      ...s,
      volume_total: s.volume_total * weight,
      liquidity: s.liquidity * weight,
    }
  })
}

/**
 * Derive 24h volume from volume_total snapshots for platforms that don't
 * provide volume_24h directly (e.g. Polymarket).
 */
async function derive24hVolume(eventId: string, sources: SourceData[]): Promise<number> {
  let totalVolume24h = 0

  for (const source of sources) {
    // If the platform already provides 24h volume, use it
    if (source.volume_24h > 0) {
      totalVolume24h += source.volume_24h
      continue
    }

    // Skip sources with no total volume (e.g. Metaculus)
    if (!source.volume_total || source.volume_total === 0) continue

    // Look up the snapshot from ~24h ago to compute the delta
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: oldSnapshot } = await supabaseAdmin
      .from('probability_snapshots')
      .select('volume')
      .eq('event_id', eventId)
      .eq('source', source.platform)
      .lte('captured_at', twentyFourHoursAgo)
      .order('captured_at', { ascending: false })
      .limit(1)
      .single()

    if (oldSnapshot?.volume != null && source.volume_total > oldSnapshot.volume) {
      totalVolume24h += source.volume_total - oldSnapshot.volume
    }
  }

  return totalVolume24h
}

/**
 * Aggregate event data from all source contracts, update the events table,
 * and insert a probability snapshot.
 */
export async function aggregateEvent(eventId: string) {
  // 1. Fetch all active source_contracts for this event
  const { data: sources, error: fetchError } = await supabaseAdmin
    .from('source_contracts')
    .select('platform, price, volume_24h, volume_total, liquidity, num_traders, last_trade_at')
    .eq('event_id', eventId)
    .eq('is_active', true)

  if (fetchError || !sources || sources.length === 0) {
    return { eventId, updated: false, reason: 'no sources' }
  }

  // 2. Apply staleness penalty
  const adjustedSources = applyStalenessPenalty(sources as SourceData[])

  // 3. Calculate aggregated probability
  const probability = volumeWeightedAverage(adjustedSources)

  // 4. Calculate totals — derive 24h volume from snapshots when API doesn't provide it
  const totalVolume24h = await derive24hVolume(eventId, sources as SourceData[])
  const totalVolume = sources.reduce((sum, s) => sum + (s.volume_total || 0), 0)
  const totalLiquidity = sources.reduce((sum, s) => sum + (s.liquidity || 0), 0)
  const totalTraders = sources.reduce((sum, s) => sum + (s.num_traders || 0), 0)

  // 5. Calculate cross-platform spread
  const prices = sources.map((s) => s.price).filter((p): p is number => p !== null)
  const spread = prices.length > 1 ? Math.max(...prices) - Math.min(...prices) : 0

  // 6. Calculate quality score
  const lastTradeMinutesAgo = sources.reduce((min, s) => {
    if (!s.last_trade_at) return min
    const ago = (Date.now() - new Date(s.last_trade_at).getTime()) / (1000 * 60)
    return Math.min(min, ago)
  }, Infinity)

  const hasMarketSources = sources.some(
    (s) => s.platform === 'polymarket' || s.platform === 'kalshi'
  )

  const qualityScore = calculateQualityScore({
    totalVolume: totalVolume,
    sourceCount: sources.length,
    lastTradeMinutesAgo: lastTradeMinutesAgo === Infinity ? 1440 : lastTradeMinutesAgo,
    crossPlatformSpread: spread,
    totalTraders: totalTraders,
    hasMarketSources,
  })

  // 7. Update the events table with denormalized data
  const { error: updateError } = await supabaseAdmin
    .from('events')
    .update({
      probability,
      volume_24h: totalVolume24h,
      volume_total: totalVolume,
      liquidity_total: totalLiquidity,
      trader_count: totalTraders,
      source_count: sources.length,
      quality_score: qualityScore,
    })
    .eq('id', eventId)

  if (updateError) {
    console.error(`Aggregation update error [${eventId}]:`, updateError)
    return { eventId, updated: false, reason: 'update_error' }
  }

  // 8. Insert probability snapshot for historical tracking
  const { error: snapshotError } = await supabaseAdmin
    .from('probability_snapshots')
    .insert({
      event_id: eventId,
      source: 'aggregated',
      captured_at: new Date().toISOString(),
      probability,
      volume: totalVolume24h,
      liquidity: totalLiquidity,
      num_traders: totalTraders,
      quality_score: qualityScore,
    })

  if (snapshotError) {
    console.error(`Snapshot insert error [${eventId}]:`, snapshotError)
  }

  // Also insert per-source snapshots (store volume_total for 24h delta computation)
  for (const source of sources) {
    if (source.price === null) continue
    await supabaseAdmin
      .from('probability_snapshots')
      .insert({
        event_id: eventId,
        source: source.platform,
        captured_at: new Date().toISOString(),
        probability: source.price,
        volume: source.volume_total || source.volume_24h,
        liquidity: source.liquidity,
        num_traders: source.num_traders,
      })
  }

  return {
    eventId,
    updated: true,
    probability,
    qualityScore,
    sourceCount: sources.length,
  }
}

/**
 * Aggregate all events that have source contracts linked via event_source_mappings.
 * This runs after the ingestion step.
 */
export async function aggregateAllEvents() {
  // Find all events that have at least one active source contract
  const { data: events, error } = await supabaseAdmin
    .from('events')
    .select('id')
    .eq('resolution_status', 'open')
    .eq('is_active', true)

  if (error || !events) {
    console.error('Failed to fetch events for aggregation:', error)
    return { eventsProcessed: 0, eventsUpdated: 0 }
  }

  let eventsUpdated = 0

  for (const event of events) {
    const result = await aggregateEvent(event.id)
    if (result.updated) eventsUpdated++
  }

  return {
    eventsProcessed: events.length,
    eventsUpdated,
  }
}
