import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // TODO: Return aggregate stats for a category
  // event_count, avg_probability, avg_movement, total_volume, most_active_events
  return NextResponse.json({
    category: slug,
    event_count: 0,
    avg_probability: 0,
    total_volume: 0,
    events: [],
  })
}
