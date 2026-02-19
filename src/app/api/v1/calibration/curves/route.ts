import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// GET: fetch market calibration curves
// Shows how accurate prediction markets are at each probability level
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const platform = sp.get('platform') || 'aggregated'
  const category = sp.get('category') || null

  const admin = getSupabaseAdmin()

  // Check for pre-computed curves
  let query = admin
    .from('market_calibration')
    .select('*')
    .eq('platform', platform)
    .order('prob_bucket', { ascending: true })

  if (category) {
    query = query.eq('category', category)
  } else {
    query = query.is('category', null)
  }

  const { data: curves } = await query

  if (curves && curves.length > 0) {
    return NextResponse.json({
      data: curves,
      source: 'precomputed',
    })
  }

  // Fall back to computing from resolved events in real time
  const { data: resolved } = await admin
    .from('events')
    .select('probability, resolution_status')
    .in('resolution_status', ['resolved_yes', 'resolved_no'])
    .is('parent_event_id', null)
    .or('outcome_type.eq.binary,outcome_type.is.null')
    .not('probability', 'is', null)

  if (!resolved || resolved.length === 0) {
    return NextResponse.json({
      data: [],
      source: 'live',
      message: 'No resolved events available for calibration',
    })
  }

  // Bucket into deciles
  const buckets: Array<{ predicted: number; actual_yes: number; total: number }> = Array.from(
    { length: 10 },
    (_, i) => ({ predicted: i / 10 + 0.05, actual_yes: 0, total: 0 })
  )

  for (const event of resolved) {
    const p = event.probability as number
    const idx = Math.min(Math.floor(p * 10), 9)
    buckets[idx].total++
    if (event.resolution_status === 'resolved_yes') {
      buckets[idx].actual_yes++
    }
  }

  const calibrationCurve = buckets
    .filter((b) => b.total > 0)
    .map((b) => ({
      prob_bucket: b.predicted,
      actual_rate: b.actual_yes / b.total,
      sample_count: b.total,
      platform,
      category: category || null,
      time_period: 'all',
    }))

  return NextResponse.json({
    data: calibrationCurve,
    source: 'live',
    total_resolved: resolved.length,
  })
}
