'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface VolumeChartProps {
  data: Array<{
    timestamp: string
    volume: number
  }>
}

export function VolumeChart({ data }: VolumeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data}>
        <XAxis dataKey="timestamp" stroke="#3f3f46" fontSize={10} tick={{ fill: '#71717a' }} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
          stroke="#3f3f46"
          fontSize={10}
          tick={{ fill: '#71717a' }}
        />
        <Tooltip
          contentStyle={{ background: '#0e0f14', border: '1px solid rgba(247,215,76,0.12)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#e4e4e7' }}
        />
        <Bar dataKey="volume" fill="rgba(247,215,76,0.4)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
