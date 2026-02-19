import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const eventIds = request.nextUrl.searchParams.get('event_ids')
  const filterIds = eventIds ? eventIds.split(',').filter(Boolean) : null

  try {
    // Build all three queries in parallel
    let eventsQuery = supabase
      .from('events')
      .select('id, category, probability, volume_24h, volume_total, prob_change_24h, source_count, resolution_status, is_active')
      .eq('is_active', true)
      .is('parent_event_id', null)
      .or('outcome_type.eq.binary,outcome_type.is.null')

    let contractsQuery = supabase
      .from('source_contracts')
      .select('platform, price, volume_total, event_id, is_active')
      .eq('is_active', true)

    let calibrationQuery = supabase
      .from('events')
      .select('id, probability, resolution_status')
      .in('resolution_status', ['resolved_yes', 'resolved_no'])
      .is('parent_event_id', null)
      .or('outcome_type.eq.binary,outcome_type.is.null')

    if (filterIds && filterIds.length > 0) {
      eventsQuery = eventsQuery.in('id', filterIds)
      contractsQuery = contractsQuery.in('event_id', filterIds)
      calibrationQuery = calibrationQuery.in('id', filterIds)
    }

    // Execute all queries in parallel
    const [eventsResult, contractsResult, calibrationResult] = await Promise.all([
      eventsQuery.limit(10000),
      contractsQuery.limit(10000),
      calibrationQuery.limit(10000),
    ])

    if (eventsResult.error) {
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: eventsResult.error.message } },
        { status: 500 }
      )
    }

    const activeEvents = eventsResult.data ?? []

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

    // Platform stats from contracts
    const platformMap = new Map<string, { count: number; volume: number; priceSum: number }>()
    for (const c of contractsResult.data ?? []) {
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

    // Calibration data from resolved events
    const resolved = calibrationResult.data

    const calibrationBuckets = Array.from({ length: 10 }, (_, i) => ({
      bin: `${i * 10}-${(i + 1) * 10}%`,
      midpoint: i * 10 + 5,
      total: 0,
      resolved_yes: 0,
      actual_rate: 0,
    }))

    for (const e of resolved ?? []) {
      const p = e.probability ?? 0
      const idx = Math.min(Math.floor(p * 10), 9)
      calibrationBuckets[idx].total++
      if (e.resolution_status === 'resolved_yes') {
        calibrationBuckets[idx].resolved_yes++
      }
    }

    for (const b of calibrationBuckets) {
      b.actual_rate = b.total > 0 ? Math.round((b.resolved_yes / b.total) * 100) : 0
    }

    return NextResponse.json({
      totals: {
        events: totalEvents,
        volume_24h: totalVolume,
        avg_probability: avgProbability,
        sources: totalSources,
        resolved: (resolved ?? []).length,
      },
      by_category: byCategory,
      by_platform: byPlatform,
      prob_distribution: probBuckets,
      calibration: calibrationBuckets,
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to compute analytics' } },
      { status: 500 }
    )
  }
}
