import { NextRequest, NextResponse } from 'next/server'
import { fetchPolymarket } from '@/lib/ingestion/polymarket'
import { fetchKalshi } from '@/lib/ingestion/kalshi'
import { fetchMetaculus } from '@/lib/ingestion/metaculus'
import { aggregateAllEvents } from '@/lib/ingestion/aggregator'

export const maxDuration = 60 // Allow up to 60s for ingestion (Vercel Pro)

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()

  try {
    // 1. Fetch from all three sources in parallel
    const [polymarketResult, kalshiResult, metaculusResult] = await Promise.allSettled([
      fetchPolymarket(),
      fetchKalshi(),
      fetchMetaculus(),
    ])

    const sourceResults = {
      polymarket: polymarketResult.status === 'fulfilled'
        ? polymarketResult.value
        : { source: 'polymarket', error: (polymarketResult as PromiseRejectedResult).reason?.message },
      kalshi: kalshiResult.status === 'fulfilled'
        ? kalshiResult.value
        : { source: 'kalshi', error: (kalshiResult as PromiseRejectedResult).reason?.message },
      metaculus: metaculusResult.status === 'fulfilled'
        ? metaculusResult.value
        : { source: 'metaculus', error: (metaculusResult as PromiseRejectedResult).reason?.message },
    }

    // 2. Only aggregate if at least one source fetch succeeded.
    // If all three failed, the DB still has stale prices and re-aggregating
    // would insert duplicate snapshots without any new data.
    const anySourceSucceeded = [polymarketResult, kalshiResult, metaculusResult]
      .some(r => r.status === 'fulfilled')

    let aggregationResult: Record<string, unknown>
    if (anySourceSucceeded) {
      aggregationResult = await aggregateAllEvents()
    } else {
      console.error('[Ingest] All source fetches failed — skipping aggregation')
      aggregationResult = { skipped: true, reason: 'all_sources_failed' }
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      sources: sourceResults,
      aggregation: aggregationResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('Ingestion error:', error)
    return NextResponse.json({
      success: false,
      duration_ms: duration,
      error: error instanceof Error ? error.message : 'Ingestion failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
