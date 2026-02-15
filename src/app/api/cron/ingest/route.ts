import { NextRequest, NextResponse } from 'next/server'
// import { supabaseAdmin } from '@/lib/supabase/admin'
// import { fetchPolymarket } from '@/lib/ingestion/polymarket'
// import { fetchKalshi } from '@/lib/ingestion/kalshi'
// import { fetchMetaculus } from '@/lib/ingestion/metaculus'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // TODO: Fetch from all sources in parallel
    // const [polymarket, kalshi, metaculus] = await Promise.allSettled([
    //   fetchPolymarket(),
    //   fetchKalshi(),
    //   fetchMetaculus(),
    // ])

    // TODO: Upsert source contracts
    // TODO: Insert probability snapshots

    return NextResponse.json({
      success: true,
      sources: {},
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Ingestion error:', error)
    return NextResponse.json({ error: 'Ingestion failed' }, { status: 500 })
  }
}
