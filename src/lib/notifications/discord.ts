/**
 * Discord webhook sender (v1).
 */

interface DiscordAlertPayload {
  eventTitle: string
  probability: number
  change24h: number
  alertType: string
  eventUrl: string
}

export async function sendDiscordAlert(
  webhookUrl: string,
  payload: DiscordAlertPayload
) {
  // TODO (v1): Implement Discord webhook delivery
  const changeSymbol = payload.change24h > 0 ? '▲' : '▼'
  const changePct = Math.abs(payload.change24h * 100).toFixed(1)

  const body = {
    embeds: [
      {
        title: `⚡ ${payload.eventTitle}`,
        description: `Probability: **${(payload.probability * 100).toFixed(1)}%** ${changeSymbol}${changePct}%\nAlert: ${payload.alertType}`,
        url: payload.eventUrl,
        color: payload.change24h > 0 ? 0x22c55e : 0xef4444,
      },
    ],
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Discord webhook error: ${response.status}`)
  }
}
