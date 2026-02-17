import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY!)
  }
  return _resend
}

const FROM_ADDRESS = process.env.EMAIL_FROM || 'alerts@prythia.com'

export async function sendAlertEmail(
  to: string,
  subject: string,
  html: string
) {
  const { data, error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  })

  if (error) {
    console.error('Email send error:', error)
    throw error
  }

  return data
}

export async function sendWelcomeEmail(to: string, name?: string) {
  return sendAlertEmail(
    to,
    'Welcome to Prythia',
    `<h2>Welcome to Prythia${name ? `, ${name}` : ''}!</h2>
     <p>You now have access to aggregated prediction market intelligence.</p>
     <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/feed">Go to your dashboard →</a></p>`
  )
}
