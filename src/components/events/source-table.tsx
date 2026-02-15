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
        Source: <span className="text-white capitalize">{s.platform}</span> — {((s.price ?? 0) * 100).toFixed(1)}%
      </p>
    )
  }

  const spreadLabel = spread !== undefined
    ? spread < 0.05 ? 'tight' : spread < 0.10 ? 'moderate' : 'wide'
    : null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-slate-300">Source Breakdown</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-800">
            <th className="text-left py-2">Platform</th>
            <th className="text-right py-2">Price</th>
            <th className="text-right py-2">Volume</th>
            <th className="text-right py-2">Liquidity</th>
            <th className="text-right py-2">Traders</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.platform} className="border-b border-slate-800/50">
              <td className="py-2 capitalize">{s.platform}</td>
              <td className="py-2 text-right tabular-nums">{((s.price ?? 0) * 100).toFixed(1)}%</td>
              <td className="py-2 text-right tabular-nums">${((s.volume_24h ?? 0) / 1000).toFixed(0)}K</td>
              <td className="py-2 text-right tabular-nums">${((s.liquidity ?? 0) / 1000).toFixed(0)}K</td>
              <td className="py-2 text-right tabular-nums">{(s.num_traders ?? 0).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {spreadLabel && (
        <p className="text-xs text-slate-400">
          Cross-platform spread: {(spread! * 100).toFixed(1)}% ({spreadLabel}{' '}
          {spreadLabel === 'tight' ? '✓' : spreadLabel === 'moderate' ? '~' : '⚠'})
        </p>
      )}
    </div>
  )
}
