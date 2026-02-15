/**
 * Weekly report email template (React Email / Resend).
 *
 * Auto-generated weekly summary of market movements by category.
 * v1 feature — stub for now.
 */

interface WeeklyReportProps {
  userName?: string
  weekOf: string
  // TODO: Add category summaries, top movers, resolved events
}

export function WeeklyReport({ userName, weekOf }: WeeklyReportProps) {
  // TODO (v1): Implement weekly report with AI-generated narrative
  return (
    <div>
      <h2>Prythia Weekly Report — {weekOf}</h2>
      <p>Hi{userName ? ` ${userName}` : ''},</p>
      <p>Here&apos;s your weekly prediction market summary.</p>
      <p>
        <em>Full weekly reports coming soon.</em>
      </p>
      <p>
        <a href="https://app.prythia.com/feed">View Dashboard →</a>
      </p>
    </div>
  )
}
