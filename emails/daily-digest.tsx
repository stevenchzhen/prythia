/**
 * Daily digest email template (React Email / Resend).
 *
 * Morning briefing of overnight changes across the user's watchlist.
 */

interface DigestEvent {
  title: string
  probability: number
  change24h: number
  url: string
}

interface DailyDigestProps {
  userName: string
  date: string
  watchlistEvents: DigestEvent[]
  biggestMover: DigestEvent | null
}

export function DailyDigest({
  userName,
  date,
  watchlistEvents,
  biggestMover,
}: DailyDigestProps) {
  // TODO: Convert to React Email components
  return (
    <div>
      <h2>Good morning{userName ? `, ${userName}` : ''}</h2>
      <p>Here&apos;s your Prythia briefing for {date}.</p>

      {biggestMover && (
        <div>
          <h3>Biggest Mover</h3>
          <p>
            <strong>{biggestMover.title}</strong>:{' '}
            {(biggestMover.probability * 100).toFixed(1)}%{' '}
            ({biggestMover.change24h > 0 ? '+' : ''}
            {(biggestMover.change24h * 100).toFixed(1)}%)
          </p>
        </div>
      )}

      <h3>Your Watchlist ({watchlistEvents.length} events)</h3>
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Probability</th>
            <th>24h Change</th>
          </tr>
        </thead>
        <tbody>
          {watchlistEvents.map((event) => (
            <tr key={event.url}>
              <td>
                <a href={event.url}>{event.title}</a>
              </td>
              <td>{(event.probability * 100).toFixed(1)}%</td>
              <td>
                {event.change24h > 0 ? '+' : ''}
                {(event.change24h * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        <a href="https://app.prythia.com/feed">Open Dashboard →</a>
      </p>
    </div>
  )
}
