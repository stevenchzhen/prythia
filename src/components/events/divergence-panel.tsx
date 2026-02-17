'use client'

import useSWR from 'swr'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { PLATFORM_LABELS, DIVERGENCE_THRESHOLDS } from '@/lib/constants'
import type { DivergencePairSummary, ResolutionAccuracy } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | 'ALL'

interface DivergencePanelProps {
  eventId: string
  timeRange: TimeRange
  resolutionStatus: string
}

const PAIR_COLORS = [
  '#f7d74c',   // gold
  '#3b82f6',   // blue
  '#a855f7',   // purple
]

function getSeverity(spread: number): { label: string; color: string; bg: string; border: string } {
  if (spread < DIVERGENCE_THRESHOLDS.STRONG) {
    return { label: 'Strong Agreement', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
  }
  if (spread < DIVERGENCE_THRESHOLDS.MODERATE) {
    return { label: 'Moderate Divergence', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
  }
  return { label: 'Significant Divergence', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
}

function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform
}

export function DivergencePanel({ eventId, timeRange, resolutionStatus }: DivergencePanelProps) {
  const { data, isLoading } = useSWR(
    `/api/v1/events/${eventId}/divergence?range=${timeRange}`,
    fetcher,
    { refreshInterval: 60_000 }
  )

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-5">
        <div className="h-4 w-48 bg-zinc-800 rounded animate-pulse" />
      </div>
    )
  }

  const current = (data?.current ?? []) as DivergencePairSummary[]
  const history = (data?.history ?? {}) as Record<string, Array<{ timestamp: string; spread: number }>>
  const resolutionAccuracy = data?.resolution_accuracy as ResolutionAccuracy[] | null

  if (current.length === 0) return null

  const maxSpread = Math.max(...current.map((p) => Number(p.spread)))
  const severity = getSeverity(maxSpread)

  // Build chart data: merge all pairs into unified timeline
  const pairKeys = Object.keys(history)
  const allTimestamps = new Set<string>()
  for (const series of Object.values(history)) {
    for (const pt of series) allTimestamps.add(pt.timestamp)
  }
  const sortedTimestamps = Array.from(allTimestamps).sort()
  const chartData = sortedTimestamps.map((ts) => {
    const point: Record<string, unknown> = { timestamp: ts }
    for (const pair of pairKeys) {
      const match = history[pair]?.find((p) => p.timestamp === ts)
      if (match) point[pair] = match.spread
    }
    return point
  })

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      {/* Severity banner */}
      <div className={`flex items-center justify-between rounded-lg px-3 py-2 border ${severity.bg} ${severity.border}`}>
        <span className={`text-sm font-medium ${severity.color}`}>{severity.label}</span>
        <span className={`mono text-sm font-bold ${severity.color}`}>
          {(maxSpread * 100).toFixed(1)}pp
        </span>
      </div>

      {/* Per-pair price cards */}
      <div className="space-y-2">
        <h4 className="text-xs text-zinc-500 uppercase tracking-wider">Platform Pairs</h4>
        <div className="grid gap-2">
          {current.map((pair, i) => {
            const pairSpread = Number(pair.spread)
            const pairSeverity = getSeverity(pairSpread)
            return (
              <div
                key={`${pair.platform_a}-${pair.platform_b}`}
                className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-3 py-2"
              >
                <div className="flex items-center gap-3 text-sm">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: PAIR_COLORS[i % PAIR_COLORS.length] }}
                  />
                  <span className="text-zinc-300">{platformLabel(pair.platform_a)}</span>
                  <span className="mono text-zinc-400">{(Number(pair.price_a) * 100).toFixed(1)}%</span>
                  <span className="text-zinc-600">vs</span>
                  <span className="text-zinc-300">{platformLabel(pair.platform_b)}</span>
                  <span className="mono text-zinc-400">{(Number(pair.price_b) * 100).toFixed(1)}%</span>
                </div>
                <span className={`mono text-xs font-medium ${pairSeverity.color}`}>
                  {(pairSpread * 100).toFixed(1)}pp
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Spread history chart */}
      {chartData.length > 1 && (
        <div className="space-y-2">
          <h4 className="text-xs text-zinc-500 uppercase tracking-wider">Spread History</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="timestamp"
                stroke="#2a2d3b"
                fontSize={10}
                fontFamily='"JetBrains Mono", monospace'
                tickLine={false}
                axisLine={{ stroke: 'rgba(247,215,76,0.08)' }}
                tickFormatter={(v: string) => {
                  const d = new Date(v)
                  return `${d.getMonth() + 1}/${d.getDate()}`
                }}
              />
              <YAxis
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}pp`}
                stroke="#2a2d3b"
                fontSize={10}
                fontFamily='"JetBrains Mono", monospace'
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: '#0e0f14',
                  border: '1px solid rgba(247,215,76,0.14)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontFamily: '"JetBrains Mono", monospace',
                  color: '#f8f7f2',
                }}
                labelFormatter={(v) => {
                  const d = new Date(String(v))
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                }}
                formatter={(value, name) => [
                  `${(Number(value) * 100).toFixed(1)}pp`,
                  String(name).split('-').map(p => platformLabel(p)).join(' vs '),
                ]}
              />
              {pairKeys.map((pair, i) => (
                <Line
                  key={pair}
                  type="monotone"
                  dataKey={pair}
                  stroke={PAIR_COLORS[i % PAIR_COLORS.length]}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Resolution accuracy */}
      {resolutionStatus !== 'open' && resolutionAccuracy && resolutionAccuracy.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs text-zinc-500 uppercase tracking-wider">Resolution Accuracy</h4>
          <div className="space-y-1">
            {resolutionAccuracy.map((ra) => (
              <div key={ra.window} className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">{ra.window} before resolution</span>
                <span className="text-zinc-300">
                  {ra.closer_platform
                    ? `${platformLabel(ra.closer_platform)} was closer`
                    : 'Tied'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
