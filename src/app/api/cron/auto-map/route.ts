import { NextRequest, NextResponse } from 'next/server'
import { runAutoMapper } from '@/lib/ingestion/auto-mapper'
import { aggregateAllEvents } from '@/lib/ingestion/aggregator'

export const maxDuration = 300 // 5 minutes (Vercel Pro max)

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Run auto-mapper with 240s budget (leaves 60s for aggregation)
    const mapResult = await runAutoMapper(240_000)

    // Re-aggregate if new events were created
    let aggResult = { eventsProcessed: 0, eventsUpdated: 0 }
    if (mapResult.eventsCreated > 0) {
      aggResult = await aggregateAllEvents()
    }

    return NextResponse.json({
      success: true,
      mapping: mapResult,
      aggregation: aggResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Auto-map cron error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Auto-map failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
