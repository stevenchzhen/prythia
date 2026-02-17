import { NextRequest, NextResponse } from 'next/server'
import { runCrossMatcher } from '@/lib/embeddings/cross-matcher'
import { aggregateAllEvents } from '@/lib/ingestion/aggregator'

export const maxDuration = 120

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stats = await runCrossMatcher(90_000)

    // Re-aggregate if contracts were linked to events
    let aggResult = { eventsProcessed: 0, eventsUpdated: 0 }
    if (stats.aiVerified > 0) {
      aggResult = await aggregateAllEvents()
    }

    return NextResponse.json({
      success: true,
      crossMatch: stats,
      aggregation: aggResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cross-match cron error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Cross-match failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
