'use client'

import useSWR from 'swr'
import { BarChart2, Activity, Globe } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { CalibrationChart } from '@/components/charts/calibration-chart'
import { CATEGORY_LABELS, PLATFORM_LABELS } from '@/lib/constants'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface AnalyticsData {
  totals: {
    events: number
    volume_24h: number
    avg_probability: number
    sources: number
  }
  by_category: Array<{
    category: string
    count: number
    volume_24h: number
    avg_probability: number
  }>
  by_platform: Array<{
    platform: string
    count: number
    volume_total: number
    avg_price: number
  }>
  prob_distribution: Array<{
    range: string
    count: number
  }>
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

const CHART_COLORS = [
  '#f7d74c', '#22c55e', '#8b5cf6', '#ef4444',
  '#06b6d4', '#f97316', '#ec4899', '#64748b',
  '#facc15', '#a78bfa', '#34d399', '#f87171',
]

export default function AnalyticsPage() {
  const { data, isLoading } = useSWR<AnalyticsData>(
    '/api/v1/analytics/overview',
    fetcher,
    { refreshInterval: 120_000 }
  )

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary-muted)] border-t-transparent" />
      </div>
    )
  }

  const categoryChartData = data.by_category.map((c) => ({
    name: CATEGORY_LABELS[c.category] ?? c.category,
    count: c.count,
    volume: c.volume_24h,
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart2 className="h-5 w-5 text-[rgba(247,215,76,0.7)]" />
        <h1 className="text-xl font-bold text-zinc-100">Analytics</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Events" value={String(data.totals.events)} />
        <SummaryCard label="24h Volume" value={formatVolume(data.totals.volume_24h)} />
        <SummaryCard label="Avg Probability" value={`${(data.totals.avg_probability * 100).toFixed(0)}%`} />
        <SummaryCard label="Active Sources" value={String(data.totals.sources)} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events by Category */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Events by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryChartData} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" stroke="#3f3f46" fontSize={10} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#3f3f46"
                fontSize={10}
                width={120}
                tick={{ fill: '#a1a1aa' }}
              />
              <Tooltip
                contentStyle={{ background: '#0e0f14', border: '1px solid rgba(247,215,76,0.12)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e4e4e7' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {categoryChartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Volume by Category */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Volume by Category (24h)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryChartData} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis
                type="number"
                stroke="#3f3f46"
                fontSize={10}
                tickFormatter={(v: number) => formatVolume(v)}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#3f3f46"
                fontSize={10}
                width={120}
                tick={{ fill: '#a1a1aa' }}
              />
              <Tooltip
                contentStyle={{ background: '#0e0f14', border: '1px solid rgba(247,215,76,0.12)', borderRadius: 8, fontSize: 12 }}
                formatter={(value: number | undefined) => [formatVolume(value ?? 0), 'Volume']}
                labelStyle={{ color: '#e4e4e7' }}
              />
              <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                {categoryChartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.5} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Probability Distribution */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-zinc-500" />
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Probability Distribution</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.prob_distribution}>
            <XAxis dataKey="range" stroke="#3f3f46" fontSize={10} tick={{ fill: '#71717a' }} />
            <YAxis stroke="#3f3f46" fontSize={10} tick={{ fill: '#71717a' }} />
            <Tooltip
              contentStyle={{ background: '#0e0f14', border: '1px solid rgba(247,215,76,0.12)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#e4e4e7' }}
            />
            <Bar dataKey="count" fill="#f7d74c" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Platform Comparison */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4 text-zinc-500" />
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Platform Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--primary-ghost)]">
                <th className="text-left py-2 px-3 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Platform</th>
                <th className="text-right py-2 px-3 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Contracts</th>
                <th className="text-right py-2 px-3 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Total Volume</th>
                <th className="text-right py-2 px-3 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Avg Price</th>
              </tr>
            </thead>
            <tbody>
              {data.by_platform.map((p) => (
                <tr key={p.platform} className="border-b border-[var(--primary-ghost)] hover:bg-[var(--primary-ghost)] transition-colors">
                  <td className="py-2.5 px-3 text-zinc-300 font-medium">
                    {PLATFORM_LABELS[p.platform] ?? p.platform}
                  </td>
                  <td className="py-2.5 px-3 text-right mono text-zinc-400">{p.count}</td>
                  <td className="py-2.5 px-3 text-right mono text-zinc-400">{formatVolume(p.volume_total)}</td>
                  <td className="py-2.5 px-3 text-right mono text-[rgba(247,215,76,0.8)]">
                    {(p.avg_price * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
              {data.by_platform.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-zinc-600">
                    No platform data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calibration Chart */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Accuracy & Calibration</h3>
        <CalibrationChart />
      </div>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="mono text-lg font-bold text-zinc-200">{value}</p>
    </div>
  )
}
