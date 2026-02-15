import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // TODO: Return time-series probability data
  // Query params: start, end, interval (5min/1h/1d), source, fields, format (json/csv)
  return NextResponse.json({
    event_id: id,
    interval: '1d',
    data: [],
  })
}
