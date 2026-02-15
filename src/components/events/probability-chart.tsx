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
  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <XAxis
            dataKey="timestamp"
            stroke="#2a2d3b"
            fontSize={10}
            fontFamily='"JetBrains Mono", monospace'
            tickLine={false}
            axisLine={{ stroke: 'rgba(247,215,76,0.08)' }}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
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
          />
          <Line
            type="monotone"
            dataKey="probability"
            stroke="#f7d74c"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: '#f7d74c' }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Time range buttons */}
      <div className="flex gap-1">
        {(['1D', '1W', '1M', '3M', '6M', 'ALL'] as const).map((range) => (
          <button
            key={range}
            className={`mono px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors duration-150 ${
              range === timeRange
                ? 'bg-[var(--primary-subtle)] text-[rgba(247,215,76,0.9)] border border-[var(--primary-muted)]'
                : 'text-zinc-600 hover:text-zinc-400 hover:bg-[var(--primary-ghost)] border border-transparent'
            }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  )
}
