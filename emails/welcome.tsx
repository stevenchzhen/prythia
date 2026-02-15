/**
 * Welcome email template (React Email / Resend).
 *
 * Sent on signup to new users.
 */

interface WelcomeProps {
  userName?: string
}

export function Welcome({ userName }: WelcomeProps) {
  // TODO: Convert to React Email components
  return (
    <div>
      <h1>Welcome to Prythia{userName ? `, ${userName}` : ''}!</h1>
      <p>
        You now have access to aggregated prediction market intelligence —
        real-time probabilities, AI analysis, and alerts across Polymarket,
        Kalshi, and Metaculus.
      </p>

      <h3>Get started:</h3>
      <ol>
        <li>
          <a href="https://app.prythia.com/feed">Explore the Global Feed</a> —
          see what&apos;s moving across all prediction markets
        </li>
        <li>
          <a href="https://app.prythia.com/watchlist">Build your Watchlist</a> —
          track the events that matter to you
        </li>
        <li>
          <a href="https://app.prythia.com/chat">Ask Prythia AI</a> — get
          AI-powered analysis of any event
        </li>
        <li>
          <a href="https://app.prythia.com/settings">Generate an API key</a> —
          access data programmatically
        </li>
      </ol>

      <p>
        Questions? Reply to this email — we read every message.
      </p>
    </div>
  )
}
