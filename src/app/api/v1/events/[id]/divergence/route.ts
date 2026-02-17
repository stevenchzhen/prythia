import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { subDays, subMonths } from 'date-fns'

type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | 'ALL'

function getRangeStart(range: TimeRange): Date | null {
  const now = new Date()
  switch (range) {
    case '1D': return subDays(now, 1)
    case '1W': return subDays(now, 7)
    case '1M': return subMonths(now, 1)
    case '3M': return subMonths(now, 3)
    case '6M': return subMonths(now, 6)
    case 'ALL': return null
  }
}

const RESOLUTION_WINDOWS = [
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
  { label: '7d', hours: 168 },
  { label: '14d', hours: 336 },
  { label: '30d', hours: 720 },
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const sp = request.nextUrl.searchParams
  const range = (sp.get('range') || '3M') as TimeRange

  try {
    // 1. Current: latest snapshot per pair
    const { data: latestRows, error: latestError } = await supabaseAdmin
      .from('divergence_snapshots')
      .select('platform_a, platform_b, price_a, price_b, spread, higher_platform, captured_at')
      .eq('event_id', id)
      .order('captured_at', { ascending: false })
      .limit(20)

    if (latestError) {
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: latestError.message } },
        { status: 500 }
      )
    }

    const pairMap = new Map<string, (typeof latestRows)[number]>()
    for (const row of latestRows ?? []) {
      const key = `${row.platform_a}-${row.platform_b}`
      if (!pairMap.has(key)) pairMap.set(key, row)
    }

    // 2. History: spread time-series grouped by pair
    let historyQuery = supabaseAdmin
      .from('divergence_snapshots')
      .select('platform_a, platform_b, spread, captured_at')
      .eq('event_id', id)
      .order('captured_at', { ascending: true })

    const rangeStart = getRangeStart(range)
    if (rangeStart) {
      historyQuery = historyQuery.gte('captured_at', rangeStart.toISOString())
    }

    const { data: historyRows } = await historyQuery

    // Group by pair
    const historyByPair: Record<string, Array<{ timestamp: string; spread: number }>> = {}
    for (const row of historyRows ?? []) {
      const key = `${row.platform_a}-${row.platform_b}`
      if (!historyByPair[key]) historyByPair[key] = []
      historyByPair[key].push({
        timestamp: row.captured_at,
        spread: Number(row.spread),
      })
    }

    // 3. Resolution accuracy (only for resolved events)
    let resolutionAccuracy: Array<{
      window: string
      closer_platform: string | null
      price_a: number
      price_b: number
      outcome: number
      distance_a: number
      distance_b: number
    }> | null = null

    const { data: eventData } = await supabaseAdmin
      .from('events')
      .select('resolution_status, resolved_at')
      .eq('id', id)
      .single()

    if (eventData && eventData.resolution_status !== 'open' && eventData.resolved_at) {
      const outcome = eventData.resolution_status === 'resolved_yes' ? 1 : 0
      const resolvedAt = new Date(eventData.resolved_at).getTime()
      resolutionAccuracy = []

      for (const { label, hours } of RESOLUTION_WINDOWS) {
        const targetTime = new Date(resolvedAt - hours * 60 * 60 * 1000).toISOString()

        // Find nearest divergence snapshot to that time
        const { data: snapshot } = await supabaseAdmin
          .from('divergence_snapshots')
          .select('platform_a, platform_b, price_a, price_b')
          .eq('event_id', id)
          .lte('captured_at', targetTime)
          .order('captured_at', { ascending: false })
          .limit(1)
          .single()

        if (snapshot) {
          const distA = Math.abs(Number(snapshot.price_a) - outcome)
          const distB = Math.abs(Number(snapshot.price_b) - outcome)
          resolutionAccuracy.push({
            window: label,
            closer_platform: distA < distB ? snapshot.platform_a : distB < distA ? snapshot.platform_b : null,
            price_a: Number(snapshot.price_a),
            price_b: Number(snapshot.price_b),
            outcome,
            distance_a: distA,
            distance_b: distB,
          })
        }
      }
    }

    return NextResponse.json({
      event_id: id,
      range,
      current: Array.from(pairMap.values()),
      history: historyByPair,
      resolution_accuracy: resolutionAccuracy,
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch divergence data' } },
      { status: 500 }
    )
  }
}
