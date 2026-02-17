import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendAlertEmail } from '@/lib/notifications/email'
import { sendSlackAlert } from '@/lib/notifications/slack'
import { sendDiscordAlert } from '@/lib/notifications/discord'
import { deliverWebhook } from '@/lib/notifications/webhook'
import type { Alert, Event } from '@/lib/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://prythia.com'

interface AlertWithEvent extends Alert {
  events: Pick<Event, 'id' | 'title' | 'slug' | 'probability' | 'prob_change_24h' | 'volume_24h' | 'resolution_status'> | null
}

function shouldFire(alert: AlertWithEvent): boolean {
  const event = alert.events
  if (!event) return false

  const condition = alert.condition as Record<string, number | string>

  switch (alert.alert_type) {
    case 'threshold_cross': {
      const threshold = Number(condition.threshold)
      const direction = condition.direction as string
      const prob = event.probability ?? 0
      if (direction === 'above') return prob >= threshold
      if (direction === 'below') return prob <= threshold
      return false
    }
    case 'movement': {
      const threshold = Number(condition.threshold)
      const change = Math.abs(event.prob_change_24h ?? 0)
      return change >= threshold
    }
    case 'volume_spike': {
      const threshold = Number(condition.threshold)
      return (event.volume_24h ?? 0) >= threshold
    }
    case 'resolution': {
      return event.resolution_status !== 'open'
    }
    case 'new_event':
    case 'divergence':
      return false
    default:
      return false
  }
}

function isThrottled(alert: Alert): boolean {
  if (!alert.last_triggered_at) return false
  if (alert.frequency === 'realtime') return false
  if (alert.frequency === 'daily_digest') return true // handled by digest cron

  const last = new Date(alert.last_triggered_at).getTime()
  const now = Date.now()
  const hourMs = 60 * 60 * 1000

  if (alert.frequency === 'once_per_hour') return now - last < hourMs
  if (alert.frequency === 'once_per_24h') return now - last < 24 * hourMs

  return false
}

async function dispatchNotifications(
  alert: AlertWithEvent,
  userEmail: string | null
) {
  const event = alert.events!
  const eventUrl = `${APP_URL}/explore/${event.slug}`
  const payload = {
    eventTitle: event.title,
    probability: event.probability ?? 0,
    change24h: event.prob_change_24h ?? 0,
    alertType: alert.alert_type,
    eventUrl,
  }

  const promises: Promise<unknown>[] = []

  if (alert.channels.includes('email') && userEmail) {
    const prob = ((event.probability ?? 0) * 100).toFixed(1)
    const html = `
      <h2>Alert: ${event.title}</h2>
      <p><strong>Type:</strong> ${alert.alert_type.replace('_', ' ')}</p>
      <p><strong>Probability:</strong> ${prob}%</p>
      <p><a href="${eventUrl}">View on Prythia</a></p>
    `
    promises.push(
      sendAlertEmail(userEmail, `Prythia Alert: ${event.title}`, html)
    )
  }

  if (alert.slack_webhook_url) {
    promises.push(sendSlackAlert(alert.slack_webhook_url, payload))
  }

  if (alert.channels.includes('discord') && alert.webhook_url) {
    promises.push(sendDiscordAlert(alert.webhook_url, payload))
  }

  if (alert.channels.includes('webhook') && alert.webhook_url) {
    promises.push(
      deliverWebhook(alert.webhook_url, process.env.WEBHOOK_SECRET || 'prythia', {
        event_type: 'alert.triggered',
        event_id: event.id,
        data: { alert_type: alert.alert_type, probability: event.probability, change_24h: event.prob_change_24h },
        timestamp: new Date().toISOString(),
      })
    )
  }

  await Promise.allSettled(promises)
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()

    // 1. Get all active alerts with joined event data
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*, events(id, title, slug, probability, prob_change_24h, volume_24h, resolution_status)')
      .eq('is_active', true)

    if (alertsError) throw alertsError
    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ success: true, alerts_checked: 0, alerts_fired: 0, timestamp: new Date().toISOString() })
    }

    let alertsFired = 0

    for (const alert of alerts as AlertWithEvent[]) {
      // 2. Check condition
      if (!shouldFire(alert)) continue

      // 3. Apply throttle
      if (isThrottled(alert)) continue

      // 4. Get user email for email notifications
      let userEmail: string | null = null
      if (alert.channels.includes('email')) {
        const { data: userData } = await supabase.auth.admin.getUserById(alert.user_id)
        userEmail = userData?.user?.email ?? null
      }

      // 5. Dispatch notifications
      await dispatchNotifications(alert, userEmail)

      // 6. Log to alert_history
      await supabase.from('alert_history').insert({
        alert_id: alert.id,
        user_id: alert.user_id,
        event_id: alert.event_id,
        triggered_at: new Date().toISOString(),
        trigger_data: {
          alert_type: alert.alert_type,
          condition: alert.condition,
          event: {
            probability: alert.events?.probability,
            prob_change_24h: alert.events?.prob_change_24h,
            volume_24h: alert.events?.volume_24h,
          },
        },
        channels_sent: alert.channels,
        delivery_status: 'sent',
      })

      // 7. Update alert metadata
      await supabase
        .from('alerts')
        .update({
          last_triggered_at: new Date().toISOString(),
          trigger_count: alert.trigger_count + 1,
        })
        .eq('id', alert.id)

      alertsFired++
    }

    return NextResponse.json({
      success: true,
      alerts_checked: alerts.length,
      alerts_fired: alertsFired,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Alert check error:', error)
    return NextResponse.json({ error: 'Alert check failed' }, { status: 500 })
  }
}
