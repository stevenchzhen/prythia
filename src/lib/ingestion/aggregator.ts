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
 * Normalize Kalshi contract-count volumes to dollar-equivalent.
 * Kalshi contracts are $1 each, but their volume numbers represent contract counts
 * while Polymarket volumes are in actual dollars. Multiplying by the contract price
 * converts to dollar-notional for apples-to-apples comparison.
 */
function normalizeVolume(source: SourceData): SourceData {
  if (source.platform === 'kalshi') {
    const price = Math.max(source.price, 0.01) // avoid divide-by-zero edge
    return {
      ...source,
      // Kalshi volume = contract count. Notional value ≈ contracts × price.
      // This makes a 50,000-contract Kalshi market at $0.70 weigh as ~$35K,
      // comparable to a Polymarket market with $35K dollar volume.
      volume_total: source.volume_total * price,
      volume_24h: source.volume_24h * price,
      liquidity: source.liquidity, // already in dollars (liquidity_dollars)
    }
  }
  return source
}

/**
 * Clamp a probability to [0, 1] range.
 */
function clampProbability(p: number): number {
  return Math.min(1, Math.max(0, p))
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

  // 1b. Deduplicate by platform — keep the one with most recent last_trade_at
  const groupedByPlatform: Record<string, typeof sources> = {}
  for (const s of sources) {
    if (!groupedByPlatform[s.platform]) groupedByPlatform[s.platform] = []
    groupedByPlatform[s.platform].push(s)
  }
  const dedupedSources = Object.values(groupedByPlatform).map(group =>
    group.sort((a, b) =>
      new Date(b.last_trade_at).getTime() - new Date(a.last_trade_at).getTime()
    )[0]
  )

  // 2. Normalize volume units across platforms (Kalshi contracts → dollar-notional)
  const normalizedSources = (dedupedSources as SourceData[]).map(normalizeVolume)

  // 3. Apply staleness penalty
  const adjustedSources = applyStalenessPenalty(normalizedSources)

  // 4. Calculate aggregated probability (clamped to [0, 1])
  const rawProbability = volumeWeightedAverage(adjustedSources)
  const probability = clampProbability(rawProbability)

  // 5. Calculate totals — use normalized volumes for consistency
  const totalVolume24h = await derive24hVolume(eventId, normalizedSources)
  const totalVolume = normalizedSources.reduce((sum, s) => sum + (s.volume_total || 0), 0)
  const totalLiquidity = normalizedSources.reduce((sum, s) => sum + (s.liquidity || 0), 0)
  const totalTraders = normalizedSources.reduce((sum, s) => sum + (s.num_traders || 0), 0)

  // 6. Calculate cross-platform spread (use original prices, not volume-adjusted)
  const prices = normalizedSources.map((s) => s.price).filter((p): p is number => p != null)
  const spread = prices.length > 1 ? Math.max(...prices) - Math.min(...prices) : 0

  // 7. Calculate quality score
  const lastTradeMinutesAgo = normalizedSources.reduce((min, s) => {
    if (!s.last_trade_at) return min
    const ago = (Date.now() - new Date(s.last_trade_at).getTime()) / (1000 * 60)
    return Math.min(min, ago)
  }, Infinity)

  const hasMarketSources = normalizedSources.some(
    (s) => s.platform === 'polymarket' || s.platform === 'kalshi'
  )

  const qualityScore = calculateQualityScore({
    totalVolume: totalVolume,
    sourceCount: normalizedSources.length,
    lastTradeMinutesAgo: lastTradeMinutesAgo === Infinity ? 1440 : lastTradeMinutesAgo,
    crossPlatformSpread: spread,
    totalTraders: totalTraders,
    hasMarketSources,
  })

  // 7b. Compute probability change fields from historical snapshots
  const probChanges: Record<string, number | null> = {
    prob_change_24h: null,
    prob_change_7d: null,
    prob_change_30d: null,
  }
  const timepoints = [
    { field: 'prob_change_24h', hours: 24 },
    { field: 'prob_change_7d', hours: 168 },
    { field: 'prob_change_30d', hours: 720 },
  ]
  for (const { field, hours } of timepoints) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    const { data: snapshot } = await supabaseAdmin
      .from('probability_snapshots')
      .select('probability')
      .eq('event_id', eventId)
      .eq('source', 'aggregated')
      .lte('captured_at', cutoff)
      .order('captured_at', { ascending: false })
      .limit(1)
      .single()

    if (snapshot?.probability != null) {
      probChanges[field] = Math.round((probability - snapshot.probability) * 10000) / 10000
    }
  }

  // Compute prob_high_30d / prob_low_30d from snapshots over last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 720 * 60 * 60 * 1000).toISOString()
  const { data: rangeSnapshots } = await supabaseAdmin
    .from('probability_snapshots')
    .select('probability')
    .eq('event_id', eventId)
    .eq('source', 'aggregated')
    .gte('captured_at', thirtyDaysAgo)
    .order('captured_at', { ascending: false })

  let probHigh30d: number | null = null
  let probLow30d: number | null = null
  if (rangeSnapshots && rangeSnapshots.length > 0) {
    const probs = rangeSnapshots.map(s => s.probability).filter((p): p is number => p != null)
    if (probs.length > 0) {
      probHigh30d = Math.max(...probs)
      probLow30d = Math.min(...probs)
    }
  }

  // 8. Update the events table with denormalized data
  const { error: updateError } = await supabaseAdmin
    .from('events')
    .update({
      probability,
      volume_24h: totalVolume24h,
      volume_total: totalVolume,
      liquidity_total: totalLiquidity,
      trader_count: totalTraders,
      source_count: normalizedSources.length,
      quality_score: qualityScore,
      prob_change_24h: probChanges.prob_change_24h,
      prob_change_7d: probChanges.prob_change_7d,
      prob_change_30d: probChanges.prob_change_30d,
      prob_high_30d: probHigh30d,
      prob_low_30d: probLow30d,
      max_spread: spread,
    })
    .eq('id', eventId)

  if (updateError) {
    console.error(`Aggregation update error [${eventId}]:`, updateError)
    return { eventId, updated: false, reason: 'update_error' }
  }

  // 9. Insert probability snapshot for historical tracking
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

  // Also insert per-source snapshots (always store volume_total for consistent 24h delta computation)
  for (const source of normalizedSources) {
    if (source.price == null) continue
    const { error: srcSnapshotError } = await supabaseAdmin
      .from('probability_snapshots')
      .insert({
        event_id: eventId,
        source: source.platform,
        captured_at: new Date().toISOString(),
        probability: clampProbability(source.price),
        volume: source.volume_total, // Always volume_total — never mix with volume_24h
        liquidity: source.liquidity,
        num_traders: source.num_traders,
      })
    if (srcSnapshotError) {
      console.error(`Per-source snapshot error [${eventId}/${source.platform}]:`, srcSnapshotError)
    }
  }

  // 10. Insert divergence snapshots for each platform pair
  if (normalizedSources.length > 1) {
    const now = new Date().toISOString()
    for (let i = 0; i < normalizedSources.length; i++) {
      for (let j = i + 1; j < normalizedSources.length; j++) {
        const a = normalizedSources[i]
        const b = normalizedSources[j]
        if (a.price === null || b.price === null) continue

        // Alphabetically order the pair
        const [first, second] = a.platform < b.platform ? [a, b] : [b, a]
        const pairSpread = Math.round(Math.abs(first.price - second.price) * 10000) / 10000
        const higherPlatform = first.price >= second.price ? first.platform : second.platform

        const { error: divError } = await supabaseAdmin
          .from('divergence_snapshots')
          .insert({
            event_id: eventId,
            platform_a: first.platform,
            platform_b: second.platform,
            price_a: first.price,
            price_b: second.price,
            spread: pairSpread,
            higher_platform: higherPlatform,
            captured_at: now,
          })
        if (divError) {
          console.error(`[Divergence] Error [${eventId}/${first.platform}-${second.platform}]:`, divError)
        } else if (pairSpread >= 0.05) {
          // Only log notable spreads (>= 5%)
          console.log(`[Divergence] ${eventId}: ${first.platform}(${first.price}) vs ${second.platform}(${second.price}), spread=${pairSpread}`)
        }
      }
    }
  }

  return {
    eventId,
    updated: true,
    probability,
    qualityScore,
    sourceCount: normalizedSources.length,
  }
}

/**
 * Aggregate all events that have source contracts linked via event_source_mappings.
 * This runs after the ingestion step.
 */
export async function aggregateAllEvents() {
  // Find all aggregatable events:
  // - Binary events (top-level, have source contracts)
  // - Child outcome events (have parent_event_id, have source contracts)
  // Skip parent containers (outcome_type != 'binary' AND no parent_event_id)
  const { data: events, error } = await supabaseAdmin
    .from('events')
    .select('id')
    .eq('resolution_status', 'open')
    .eq('is_active', true)
    .or('outcome_type.eq.binary,outcome_type.is.null,parent_event_id.not.is.null')

  if (error || !events) {
    console.error('Failed to fetch events for aggregation:', error)
    return { eventsProcessed: 0, eventsUpdated: 0, zombiesDeactivated: 0 }
  }

  let eventsUpdated = 0
  const zombieIds: string[] = []

  for (const event of events) {
    const result = await aggregateEvent(event.id)
    if (result.updated) {
      eventsUpdated++
    } else if (result.reason === 'no sources') {
      zombieIds.push(event.id)
    }
  }

  // Deactivate zombie events: open events with zero active source contracts.
  // This happens when all contracts for an event were removed from source platforms
  // (typically because the market resolved). Marking is_active=false removes them
  // from the feed so clients don't see stale data.
  let zombiesDeactivated = 0
  if (zombieIds.length > 0) {
    const { error: deactivateError, count } = await supabaseAdmin
      .from('events')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in('id', zombieIds)
      .eq('is_active', true)

    if (deactivateError) {
      console.error('Failed to deactivate zombie events:', deactivateError)
    } else {
      zombiesDeactivated = count ?? zombieIds.length
      if (zombiesDeactivated > 0) {
        console.log(`[Aggregator] Deactivated ${zombiesDeactivated} zombie events (no active sources)`)
      }
    }
  }

  return {
    eventsProcessed: events.length,
    eventsUpdated,
    zombiesDeactivated,
  }
}
