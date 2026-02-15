import { NextRequest, NextResponse } from 'next/server'
import { fetchPolymarket } from '@/lib/ingestion/polymarket'
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
    // 1. Fetch from all sources in parallel
    const [polymarketResult] = await Promise.allSettled([
      fetchPolymarket(),
      // TODO Step 5: Add fetchKalshi() and fetchMetaculus()
    ])

    const sourceResults = {
      polymarket: polymarketResult.status === 'fulfilled'
        ? polymarketResult.value
        : { source: 'polymarket', error: (polymarketResult as PromiseRejectedResult).reason?.message },
    }

    // 2. Aggregate probabilities for all mapped events
    const aggregationResult = await aggregateAllEvents()

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
