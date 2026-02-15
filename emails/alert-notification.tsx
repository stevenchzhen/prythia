/**
 * Alert notification email template (React Email / Resend).
 *
 * Sent when an alert condition is triggered (e.g., probability crosses a threshold).
 */

interface AlertNotificationProps {
  eventTitle: string
  eventUrl: string
  probability: number
  change24h: number
  alertType: string
  condition: string
}

export function AlertNotification({
  eventTitle,
  eventUrl,
  probability,
  change24h,
  alertType,
  condition,
}: AlertNotificationProps) {
  const changeSymbol = change24h > 0 ? '▲' : '▼'
  const changePct = Math.abs(change24h * 100).toFixed(1)

  // TODO: Convert to React Email components for proper email rendering
  return (
    <div>
      <h2>⚡ Prythia Alert</h2>
      <h3>{eventTitle}</h3>
      <p>
        Current probability: <strong>{(probability * 100).toFixed(1)}%</strong>{' '}
        {changeSymbol}{changePct}%
      </p>
      <p>
        Alert triggered: {alertType} — {condition}
      </p>
      <p>
        <a href={eventUrl}>View on Prythia →</a>
      </p>
    </div>
  )
}
