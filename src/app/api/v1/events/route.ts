import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { PaginatedResponse, Event } from '@/lib/types'

const SORT_MAP: Record<string, string> = {
  movement: 'prob_change_24h',
  volume: 'volume_24h',
  probability: 'probability',
  quality: 'quality_score',
  created: 'created_at',
  resolution_date: 'resolution_date',
  spread: 'max_spread',
}

// Parent category → subcategory expansion
const CATEGORY_CHILDREN: Record<string, string[]> = {
  geopolitics: ['trade_tariffs', 'military_conflict', 'diplomacy', 'sanctions'],
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams

  const category = sp.get('category') || undefined
  const search = sp.get('search') || undefined
  const probMin = sp.get('probMin') ? Number(sp.get('probMin')) : undefined
  const probMax = sp.get('probMax') ? Number(sp.get('probMax')) : undefined
  const volumeMin = sp.get('volumeMin') ? Number(sp.get('volumeMin')) : undefined
  const qualityMin = sp.get('qualityMin') ? Number(sp.get('qualityMin')) : undefined
  const minSpread = sp.get('min_spread') ? Number(sp.get('min_spread')) : undefined
  const minSources = sp.get('min_sources') ? Number(sp.get('min_sources')) : undefined
  const sort = sp.get('sort') || 'movement'
  const order = sp.get('order') === 'asc' ? true : false // ascending = true for Supabase
  const limit = Math.min(Number(sp.get('limit')) || 50, 100)
  const offset = Number(sp.get('offset')) || 0

  try {
    const includeChildren = sp.get('include_children') === 'true'

    let query = supabaseAdmin
      .from('events')
      .select('*', { count: 'exact' })
      .eq('is_active', true)

    // By default, exclude child events (outcome brackets) from the main list
    if (!includeChildren) {
      query = query.is('parent_event_id', null)
    }

    // Full-text search
    if (search) {
      query = query.textSearch('fts', search, { type: 'websearch' })
    }

    // Category filter with parent expansion
    if (category && category !== 'all') {
      const children = CATEGORY_CHILDREN[category]
      if (children) {
        query = query.in('category', [category, ...children])
      } else {
        query = query.eq('category', category)
      }
    }

    // Probability range (values come in as 0-100 from UI, stored as 0-1 in DB)
    if (probMin !== undefined) {
      query = query.gte('probability', probMin / 100)
    }
    if (probMax !== undefined) {
      query = query.lte('probability', probMax / 100)
    }

    // Volume minimum
    if (volumeMin !== undefined) {
      query = query.gte('volume_24h', volumeMin)
    }

    // Quality minimum (0-1)
    if (qualityMin !== undefined) {
      query = query.gte('quality_score', qualityMin / 100)
    }

    // Divergence filters
    if (minSpread !== undefined) {
      query = query.gt('max_spread', minSpread)
    }
    if (minSources !== undefined) {
      query = query.gte('source_count', minSources)
    }

    // Sorting
    const sortColumn = SORT_MAP[sort] || 'prob_change_24h'
    query = query.order(sortColumn, { ascending: order, nullsFirst: false })

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    const events = (data as Event[]) ?? []

    // Batch-fetch sparkline data (last 20 aggregated snapshots per event)
    let eventsWithSparklines = events
    if (events.length > 0) {
      const eventIds = events.map((e) => e.id)
      const { data: snapshots } = await supabaseAdmin
        .from('probability_snapshots')
        .select('event_id, probability, captured_at')
        .in('event_id', eventIds)
        .eq('source', 'aggregated')
        .order('captured_at', { ascending: false })

      if (snapshots && snapshots.length > 0) {
        // Group by event_id and take last 20 per event
        const sparklineMap = new Map<string, number[]>()
        for (const snap of snapshots) {
          const existing = sparklineMap.get(snap.event_id) ?? []
          if (existing.length < 20) {
            existing.push(snap.probability)
            sparklineMap.set(snap.event_id, existing)
          }
        }

        eventsWithSparklines = events.map((e) => ({
          ...e,
          sparkline_data: sparklineMap.get(e.id)?.reverse() ?? [],
        }))
      }
    }

    const response: PaginatedResponse<Event> = {
      data: eventsWithSparklines,
      meta: {
        total: count ?? 0,
        limit,
        offset,
        has_more: (count ?? 0) > offset + limit,
      },
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch events' } },
      { status: 500 }
    )
  }
}
