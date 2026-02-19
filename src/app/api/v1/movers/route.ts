import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { Event } from '@/lib/types'

// Minimum quality threshold to exclude low-volume noise from movers.
// Events with quality_score < 0.2 typically have minimal volume and single sources
// — a 10% move on a $500 market is noise, not signal.
const MIN_QUALITY_SCORE = 0.2

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const limit = Math.min(Number(sp.get('limit')) || 3, 10)

  try {
    const supabase = getSupabaseAdmin()

    // Run gainers and losers queries in parallel
    // Filter to events with minimum quality to prevent low-volume noise
    const [gainersResult, losersResult] = await Promise.all([
      supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .is('parent_event_id', null)
        .or('outcome_type.eq.binary,outcome_type.is.null')
        .not('prob_change_24h', 'is', null)
        .gt('prob_change_24h', 0)
        .gte('quality_score', MIN_QUALITY_SCORE)
        .order('prob_change_24h', { ascending: false })
        .limit(limit),
      supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .is('parent_event_id', null)
        .or('outcome_type.eq.binary,outcome_type.is.null')
        .not('prob_change_24h', 'is', null)
        .lt('prob_change_24h', 0)
        .gte('quality_score', MIN_QUALITY_SCORE)
        .order('prob_change_24h', { ascending: true })
        .limit(limit),
    ])

    if (gainersResult.error) {
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: gainersResult.error.message } },
        { status: 500 }
      )
    }
    if (losersResult.error) {
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: losersResult.error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      gainers: (gainersResult.data as Event[]) ?? [],
      losers: (losersResult.data as Event[]) ?? [],
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch movers' } },
      { status: 500 }
    )
  }
}
