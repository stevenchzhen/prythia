import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // TODO: Return biggest movers by absolute probability change
  // Query params: period (24h/7d/30d), category, direction (up/down/both), volume_min, limit
  return NextResponse.json({
    data: [],
    meta: { period: '24h', total: 0 },
  })
}
