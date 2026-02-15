import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // TODO: Return full event object including source breakdowns and AI analysis
  return NextResponse.json({
    error: 'Not implemented',
    event_id: id,
  }, { status: 501 })
}
