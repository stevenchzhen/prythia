'use client'

import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = '#8b5cf6',
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }))

  if (chartData.length === 0) {
    return <div style={{ width, height }} className="bg-slate-800/50 rounded" />
  }

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
