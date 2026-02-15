import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // TODO: Bulk historical export endpoint
  // Query params: start, end, categories, interval, format (csv/parquet/json)
  // Returns download URL for gzipped dataset
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
