import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Fetch event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `Event ${id} not found` } },
        { status: 404 }
      )
    }

    // Fetch active source contracts
    const { data: sources, error: sourcesError } = await supabaseAdmin
      .from('source_contracts')
      .select('*')
      .eq('event_id', id)
      .eq('is_active', true)
      .order('platform', { ascending: true })

    if (sourcesError) {
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: sourcesError.message } },
        { status: 500 }
      )
    }

    // Fetch latest divergence snapshots per platform pair
    const { data: divergenceRows } = await supabaseAdmin
      .from('divergence_snapshots')
      .select('platform_a, platform_b, price_a, price_b, spread, higher_platform, captured_at')
      .eq('event_id', id)
      .order('captured_at', { ascending: false })
      .limit(10)

    // Deduplicate to latest per pair
    const pairMap = new Map<string, typeof divergenceRows extends (infer T)[] | null ? T : never>()
    for (const row of divergenceRows ?? []) {
      const key = `${row.platform_a}-${row.platform_b}`
      if (!pairMap.has(key)) pairMap.set(key, row)
    }

    // Fetch child outcomes if this is a parent event (price_bracket or categorical)
    let outcomes = null
    if (event.outcome_type && event.outcome_type !== 'binary') {
      const { data: children } = await supabaseAdmin
        .from('events')
        .select('id, title, probability, prob_change_24h, volume_24h, outcome_label, outcome_index')
        .eq('parent_event_id', id)
        .eq('is_active', true)
        .order('outcome_index', { ascending: true })

      outcomes = children ?? []
    }

    return NextResponse.json({
      ...event,
      sources: sources ?? [],
      outcomes,
      divergence: {
        max_spread: event.max_spread ?? 0,
        pairs: Array.from(pairMap.values()),
      },
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch event detail' } },
      { status: 500 }
    )
  }
}
