import { NextRequest, NextResponse } from 'next/server'
import { aggregateAllEvents } from '@/lib/ingestion/aggregator'

export const maxDuration = 30

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await aggregateAllEvents()

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Aggregation error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Aggregation failed',
    }, { status: 500 })
  }
}
