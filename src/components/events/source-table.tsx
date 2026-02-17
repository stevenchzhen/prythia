'use client'

import type { SourceContract } from '@/lib/types'

interface SourceTableProps {
  sources: SourceContract[]
  spread?: number
}

export function SourceTable({ sources, spread }: SourceTableProps) {
  if (sources.length === 0) return null

  // If only 1 source, show inline instead of table
  if (sources.length === 1) {
    const s = sources[0]
    return (
      <p className="text-sm text-slate-400">
        Data source: <span className="text-white capitalize">{s.platform}</span> — {((s.price ?? 0) * 100).toFixed(1)}%
      </p>
    )
  }

  const spreadLabel = spread !== undefined
    ? spread < 0.05 ? 'strong' : spread < 0.10 ? 'moderate' : 'weak'
    : null

  // Compute average price for outlier detection
  const prices = sources.map((s) => s.price ?? 0)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-slate-300">Data Sources</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-800">
            <th className="text-left py-2">Source</th>
            <th className="text-right py-2">Likelihood</th>
            <th className="text-right py-2">Activity</th>
            <th className="text-right py-2">Market Depth</th>
            <th className="text-right py-2">Participants</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => {
            const isOutlier = Math.abs((s.price ?? 0) - avgPrice) > 0.10
            return (
            <tr key={s.platform} className="border-b border-slate-800/50">
              <td className="py-2 capitalize">{s.platform}</td>
              <td className={`py-2 text-right tabular-nums ${isOutlier ? 'text-amber-400' : ''}`}>{((s.price ?? 0) * 100).toFixed(1)}%</td>
              <td className="py-2 text-right tabular-nums">
                {s.volume_24h
                  ? `$${(s.volume_24h / 1000).toFixed(0)}K`
                  : s.volume_total
                  ? `$${(s.volume_total / 1000).toFixed(0)}K*`
                  : '—'}
              </td>
              <td className="py-2 text-right tabular-nums">${((s.liquidity ?? 0) / 1000).toFixed(0)}K</td>
              <td className="py-2 text-right tabular-nums">{(s.num_traders ?? 0).toLocaleString()}</td>
            </tr>
            )
          })}
        </tbody>
      </table>
      {spreadLabel && (
        <p className="text-xs text-slate-400">
          Source agreement: {(spread! * 100).toFixed(1)}% spread ({spreadLabel}{' '}
          {spreadLabel === 'strong' ? '✓' : spreadLabel === 'moderate' ? '~' : '⚠'})
        </p>
      )}
      {sources.some(s => !s.volume_24h && s.volume_total) && (
        <p className="text-xs text-slate-500">* Total activity (24h not available from this source)</p>
      )}
    </div>
  )
}
