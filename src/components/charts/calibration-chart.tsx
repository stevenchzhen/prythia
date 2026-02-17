'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'

interface CalibrationBucket {
  bin: string
  midpoint: number
  total: number
  resolved_yes: number
  actual_rate: number
}

interface CalibrationChartProps {
  data: CalibrationBucket[]
  resolvedCount: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CalibrationBucket }> }) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-[var(--primary-border)] bg-[#0e0f14] px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-zinc-200 mb-1">{d.bin} predicted</p>
      <p className="text-zinc-400">
        Actual: <span className="mono text-[var(--primary-text)]">{d.actual_rate}%</span>
      </p>
      <p className="text-zinc-500">
        {d.resolved_yes}/{d.total} resolved yes
      </p>
    </div>
  )
}

export function CalibrationChart({ data, resolvedCount }: CalibrationChartProps) {
  // Only show buckets that have data
  const withData = data.filter((d) => d.total > 0)

  if (resolvedCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <div className="h-8 w-8 rounded-full border border-dashed border-zinc-700 flex items-center justify-center">
          <span className="text-zinc-600 text-xs">?</span>
        </div>
        <p className="text-sm text-zinc-500">No resolved events yet</p>
        <p className="text-xs text-zinc-600">
          Calibration data will appear as events resolve
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {resolvedCount} resolved event{resolvedCount !== 1 ? 's' : ''}
          {withData.length > 0 && ` across ${withData.length} probability bins`}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(247,215,76,0.06)"
            vertical={false}
          />
          <XAxis
            type="number"
            dataKey="midpoint"
            domain={[0, 100]}
            ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
            stroke="#3f3f46"
            fontSize={10}
            tick={{ fill: '#71717a' }}
            label={{ value: 'Predicted %', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#52525b' }}
          />
          <YAxis
            type="number"
            dataKey="actual_rate"
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            stroke="#3f3f46"
            fontSize={10}
            tick={{ fill: '#71717a' }}
            label={{ value: 'Actual %', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: '#52525b' }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Perfect calibration line */}
          <ReferenceLine
            segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
            stroke="rgba(247,215,76,0.25)"
            strokeDasharray="6 4"
            strokeWidth={1}
          />

          {/* Data points — size based on sample count */}
          <Scatter
            data={withData}
            fill="#f7d74c"
            fillOpacity={0.8}
            stroke="rgba(247,215,76,0.4)"
            strokeWidth={1}
          />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 text-[10px] text-zinc-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t border-dashed border-[rgba(247,215,76,0.25)]" />
          Perfect calibration
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#f7d74c] opacity-80" />
          Market accuracy
        </span>
      </div>
    </div>
  )
}
