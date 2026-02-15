'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ProbabilityChartProps {
  data: Array<{
    timestamp: string
    probability: number
    volume?: number
  }>
  timeRange?: '1D' | '1W' | '1M' | '3M' | '6M' | 'ALL'
}

export function ProbabilityChart({ data, timeRange = '3M' }: ProbabilityChartProps) {
  // TODO: Implement interactive time-series chart
  // - Time range buttons (1D, 1W, 1M, 3M, 6M, ALL)
  // - Hover tooltip with exact date, probability, volume
  // - Event markers for notable news
  // - Multi-source overlay toggle
  // - Volume bar overlay toggle
  // - Click-drag zoom

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="timestamp" stroke="#64748b" fontSize={12} />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            stroke="#64748b"
            fontSize={12}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="probability"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-2">
        {(['1D', '1W', '1M', '3M', '6M', 'ALL'] as const).map((range) => (
          <button
            key={range}
            className={`px-2 py-1 text-xs rounded ${
              range === timeRange
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  )
}
