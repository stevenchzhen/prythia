import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // TODO: Send daily digest emails
    // 1. Query users with email_digest = true
    // 2. For each user, get their watchlist events
    // 3. Summarize overnight changes
    // 4. Send formatted email via Resend

    return NextResponse.json({
      success: true,
      digests_sent: 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Daily digest error:', error)
    return NextResponse.json({ error: 'Daily digest failed' }, { status: 500 })
  }
}
