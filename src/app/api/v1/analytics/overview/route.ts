import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = getSupabaseAdmin()

  try {
    // Fetch all active events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, category, probability, volume_24h, volume_total, prob_change_24h, source_count, is_active')
      .eq('is_active', true)

    if (eventsError) {
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: eventsError.message } },
        { status: 500 }
      )
    }

    const activeEvents = events ?? []

    // Totals
    const totalEvents = activeEvents.length
    const totalVolume = activeEvents.reduce((sum, e) => sum + (e.volume_24h ?? 0), 0)
    const avgProbability =
      totalEvents > 0
        ? activeEvents.reduce((sum, e) => sum + (e.probability ?? 0), 0) / totalEvents
        : 0
    const totalSources = activeEvents.reduce((sum, e) => sum + (e.source_count ?? 0), 0)

    // Group by category
    const categoryMap = new Map<string, { count: number; volume: number; probSum: number }>()
    for (const e of activeEvents) {
      const cat = e.category ?? 'unknown'
      const existing = categoryMap.get(cat) ?? { count: 0, volume: 0, probSum: 0 }
      existing.count++
      existing.volume += e.volume_24h ?? 0
      existing.probSum += e.probability ?? 0
      categoryMap.set(cat, existing)
    }
    const byCategory = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        volume_24h: stats.volume,
        avg_probability: stats.count > 0 ? stats.probSum / stats.count : 0,
      }))
      .sort((a, b) => b.count - a.count)

    // Fetch source contracts grouped by platform
    const { data: contracts, error: contractsError } = await supabase
      .from('source_contracts')
      .select('platform, price, volume_total, is_active')
      .eq('is_active', true)

    if (contractsError) {
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: contractsError.message } },
        { status: 500 }
      )
    }

    const platformMap = new Map<string, { count: number; volume: number; priceSum: number }>()
    for (const c of contracts ?? []) {
      const plat = c.platform
      const existing = platformMap.get(plat) ?? { count: 0, volume: 0, priceSum: 0 }
      existing.count++
      existing.volume += c.volume_total ?? 0
      existing.priceSum += c.price ?? 0
      platformMap.set(plat, existing)
    }
    const byPlatform = Array.from(platformMap.entries())
      .map(([platform, stats]) => ({
        platform,
        count: stats.count,
        volume_total: stats.volume,
        avg_price: stats.count > 0 ? stats.priceSum / stats.count : 0,
      }))
      .sort((a, b) => b.volume_total - a.volume_total)

    // Probability distribution (10% buckets)
    const probBuckets = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}-${(i + 1) * 10}%`,
      count: 0,
    }))
    for (const e of activeEvents) {
      const p = e.probability ?? 0
      const idx = Math.min(Math.floor(p * 10), 9)
      probBuckets[idx].count++
    }

    return NextResponse.json({
      totals: {
        events: totalEvents,
        volume_24h: totalVolume,
        avg_probability: avgProbability,
        sources: totalSources,
      },
      by_category: byCategory,
      by_platform: byPlatform,
      prob_distribution: probBuckets,
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to compute analytics' } },
      { status: 500 }
    )
  }
}
