import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { queryFast, parseResponse } from '@/lib/ai/client'
import { buildDailyBriefingPrompt } from '@/lib/ai/prompts'
import { sendAlertEmail } from '@/lib/notifications/email'

const MAX_USERS_PER_RUN = 50
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://prythia.com'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()

    // 1. Get users who opted in to email digest
    const { data: prefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('email_digest', true)
      .limit(MAX_USERS_PER_RUN)

    if (prefsError) throw prefsError
    if (!prefs || prefs.length === 0) {
      return NextResponse.json({ success: true, digests_sent: 0, timestamp: new Date().toISOString() })
    }

    let digestsSent = 0

    for (const pref of prefs) {
      try {
        // 2. Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(pref.user_id)
        const userEmail = userData?.user?.email
        if (!userEmail) continue

        // 3. Get user's watchlist items with event data
        const { data: watchlistItems } = await supabase
          .from('watchlist_items')
          .select('event_id, events(id, title, slug, probability, prob_change_24h, prob_change_7d, volume_24h, resolution_status, resolution_date)')
          .eq('user_id', pref.user_id)
          .limit(50)

        if (!watchlistItems || watchlistItems.length === 0) continue

        // 4. Build watchlist summary string
        const watchlistData = watchlistItems
          .map((item) => {
            const e = item.events as unknown as Record<string, unknown> | null
            if (!e) return null
            const prob = ((Number(e.probability) || 0) * 100).toFixed(1)
            const change24h = ((Number(e.prob_change_24h) || 0) * 100).toFixed(1)
            const change7d = ((Number(e.prob_change_7d) || 0) * 100).toFixed(1)
            const volume = Number(e.volume_24h) || 0
            return `- ${e.title}: ${prob}% (24h: ${change24h}%, 7d: ${change7d}%, vol: $${volume.toLocaleString()}, status: ${e.resolution_status})`
          })
          .filter(Boolean)
          .join('\n')

        if (!watchlistData) continue

        // 5. Generate AI briefing
        const response = await queryFast(
          [{ role: 'user', content: buildDailyBriefingPrompt(watchlistData) }],
          { maxTokens: 1500, temperature: 0.3 }
        )
        const { text: briefing } = await parseResponse(response)

        // 6. Send email
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f7d74c; font-size: 20px;">Prythia Daily Briefing</h1>
            <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">
${briefing}
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 13px; color: #888;">
              Tracking ${watchlistItems.length} events on your watchlist.
              <a href="${APP_URL}/watchlist" style="color: #f7d74c;">View watchlist</a> |
              <a href="${APP_URL}/settings" style="color: #f7d74c;">Manage preferences</a>
            </p>
          </div>
        `

        await sendAlertEmail(userEmail, 'Prythia Daily Briefing', html)
        digestsSent++
      } catch (err) {
        console.error(`Digest failed for user ${pref.user_id}:`, err)
        // Continue to next user
      }
    }

    return NextResponse.json({
      success: true,
      digests_sent: digestsSent,
      users_eligible: prefs.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Daily digest error:', error)
    return NextResponse.json({ error: 'Daily digest failed' }, { status: 500 })
  }
}
