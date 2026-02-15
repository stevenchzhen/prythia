import { createHmac } from 'crypto'

interface WebhookPayload {
  event_type: string
  event_id: string
  data: Record<string, unknown>
  timestamp: string
}

/**
 * Deliver a webhook with HMAC signature for verification.
 */
export async function deliverWebhook(
  url: string,
  secret: string,
  payload: WebhookPayload
) {
  const body = JSON.stringify(payload)
  const signature = createHmac('sha256', secret).update(body).digest('hex')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Prythia-Signature': signature,
      'X-Prythia-Timestamp': payload.timestamp,
    },
    body,
  })

  return {
    status: response.status,
    ok: response.ok,
  }
}

/**
 * Verify an incoming webhook signature.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  return signature === expected
}
