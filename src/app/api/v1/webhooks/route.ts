import { NextRequest, NextResponse } from 'next/server'

export async function POST(_request: NextRequest) {
  // TODO: Register a webhook URL for alert notifications
  // Body: { url, events, filters, secret }
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}

export async function GET(_request: NextRequest) {
  // TODO: List user's registered webhooks
  return NextResponse.json({ data: [] })
}
