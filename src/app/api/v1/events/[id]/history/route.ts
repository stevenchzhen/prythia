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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const sp = request.nextUrl.searchParams

  const range = (sp.get('range') || '3M') as TimeRange
  const source = sp.get('source') || 'aggregated'

  try {
    let query = supabaseAdmin
      .from('probability_snapshots')
      .select('captured_at, probability, volume')
      .eq('event_id', id)
      .eq('source', source)
      .order('captured_at', { ascending: true })

    const rangeStart = getRangeStart(range)
    if (rangeStart) {
      query = query.gte('captured_at', rangeStart.toISOString())
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      event_id: id,
      range,
      source,
      data: (data ?? []).map((d) => ({
        timestamp: d.captured_at,
        probability: d.probability,
        volume: d.volume,
      })),
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch history' } },
      { status: 500 }
    )
  }
}
