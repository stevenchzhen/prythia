import { supabaseAdmin } from '@/lib/supabase/admin'
import { calculateQualityScore } from './quality-scorer'

interface SourceData {
  platform: string
  price: number
  volume_24h: number
  liquidity: number
  num_traders: number
  last_trade_at: string
}

/**
 * Calculate volume-weighted average probability across platforms.
 * Higher volume = more informed signal.
 */
export function volumeWeightedAverage(sources: SourceData[]): number {
  const totalVolume = sources.reduce((sum, s) => sum + s.volume_24h, 0)
  if (totalVolume === 0) {
    // Equal weight fallback
    return sources.reduce((sum, s) => sum + s.price, 0) / sources.length
  }
  return sources.reduce((sum, s) => sum + s.price * (s.volume_24h / totalVolume), 0)
}

/**
 * Apply staleness penalty: downweight platforms with old last trades.
 */
export function applyStalenessPenalty(sources: SourceData[]): SourceData[] {
  const now = Date.now()
  return sources.map((s) => {
    const lastTrade = new Date(s.last_trade_at).getTime()
    const hoursAgo = (now - lastTrade) / (1000 * 60 * 60)

    let weight = 1.0
    if (hoursAgo > 72) weight = 0.2
    else if (hoursAgo > 24) weight = 0.5

    return {
      ...s,
      volume_24h: s.volume_24h * weight,
    }
  })
}

/**
 * Detect outliers: flag platforms diverging >15% from the mean.
 */
export function detectOutliers(sources: SourceData[]): string[] {
  if (sources.length < 2) return []

  const mean = sources.reduce((sum, s) => sum + s.price, 0) / sources.length
  return sources
    .filter((s) => Math.abs(s.price - mean) > 0.15)
    .map((s) => s.platform)
}

/**
 * Aggregate event data from all source contracts and update the events table.
 */
export async function aggregateEvent(eventId: string) {
  // TODO: Full aggregation pipeline
  // 1. Fetch all source_contracts for this event
  // 2. Apply staleness penalty
  // 3. Calculate volume-weighted average probability
  // 4. Detect outliers
  // 5. Calculate quality score
  // 6. Calculate 24h/7d/30d changes from probability_snapshots
  // 7. Upsert events table with denormalized data
  // 8. Insert new probability_snapshot row
}
