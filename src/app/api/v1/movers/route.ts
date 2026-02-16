import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Event } from '@/lib/types'

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const limit = Math.min(Number(sp.get('limit')) || 3, 10)

  try {
    // Gainers: largest positive prob_change_24h
    const { data: gainers, error: gErr } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('is_active', true)
      .not('prob_change_24h', 'is', null)
      .gt('prob_change_24h', 0)
      .order('prob_change_24h', { ascending: false })
      .limit(limit)

    if (gErr) {
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: gErr.message } },
        { status: 500 }
      )
    }

    // Losers: largest negative prob_change_24h
    const { data: losers, error: lErr } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('is_active', true)
      .not('prob_change_24h', 'is', null)
      .lt('prob_change_24h', 0)
      .order('prob_change_24h', { ascending: true })
      .limit(limit)

    if (lErr) {
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: lErr.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      gainers: (gainers as Event[]) ?? [],
      losers: (losers as Event[]) ?? [],
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch movers' } },
      { status: 500 }
    )
  }
}
