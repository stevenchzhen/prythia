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
        <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
          stroke="#64748b"
          fontSize={10}
        />
        <Tooltip />
        <Bar dataKey="volume" fill="#334155" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
