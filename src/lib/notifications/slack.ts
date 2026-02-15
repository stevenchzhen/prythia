/**
 * Slack webhook sender (v1).
 * Sends formatted message blocks to a Slack incoming webhook URL.
 */

interface SlackAlertPayload {
  eventTitle: string
  probability: number
  change24h: number
  alertType: string
  eventUrl: string
}

export async function sendSlackAlert(
  webhookUrl: string,
  payload: SlackAlertPayload
) {
  // TODO (v1): Implement Slack webhook delivery
  const changeSymbol = payload.change24h > 0 ? '▲' : '▼'
  const changePct = Math.abs(payload.change24h * 100).toFixed(1)

  const body = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*⚡ Prythia Alert*\n*${payload.eventTitle}*\nProbability: ${(payload.probability * 100).toFixed(1)}% ${changeSymbol}${changePct}%\nType: ${payload.alertType}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View on Prythia' },
            url: payload.eventUrl,
          },
        ],
      },
    ],
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Slack webhook error: ${response.status}`)
  }
}
