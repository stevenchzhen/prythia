interface WatchlistSummaryProps {
  avgMove: number
  biggestUp: { title: string; change: number } | null
  biggestDown: { title: string; change: number } | null
  alertsToday: number
}

export function WatchlistSummary({ avgMove, biggestUp, biggestDown, alertsToday }: WatchlistSummaryProps) {
  return (
    <div className="sticky bottom-0 grid grid-cols-4 gap-4 border-t border-slate-800 bg-slate-950 p-4">
      <div>
        <p className="text-xs text-slate-400">Avg Move</p>
        <p className="text-sm font-medium tabular-nums">
          {avgMove > 0 ? '+' : ''}{(avgMove * 100).toFixed(1)}%
        </p>
      </div>
      <div>
        <p className="text-xs text-slate-400">Biggest ▲</p>
        <p className="text-sm font-medium text-green-500 truncate">
          {biggestUp ? `${biggestUp.title} +${(biggestUp.change * 100).toFixed(0)}%` : '—'}
        </p>
      </div>
      <div>
        <p className="text-xs text-slate-400">Biggest ▼</p>
        <p className="text-sm font-medium text-red-500 truncate">
          {biggestDown ? `${biggestDown.title} ${(biggestDown.change * 100).toFixed(0)}%` : '—'}
        </p>
      </div>
      <div>
        <p className="text-xs text-slate-400">Alerts</p>
        <p className="text-sm font-medium">{alertsToday} today</p>
      </div>
    </div>
  )
}
