'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { ArrowLeft, Bookmark, Calendar, BarChart3, Star } from 'lucide-react'
import { format } from 'date-fns'
import { useEventDetail } from '@/hooks/use-event-detail'
import { useWatchlist } from '@/hooks/use-watchlist'
import { ProbabilityChart } from '@/components/events/probability-chart'
import { SourceTable } from '@/components/events/source-table'
import { QualityDots } from '@/components/events/quality-dots'
import { MovementBadge } from '@/components/events/movement-badge'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | 'ALL'

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { event, isLoading } = useEventDetail(id)
  const { isWatched, toggleWatchlist } = useWatchlist()
  const [timeRange, setTimeRange] = useState<TimeRange>('3M')

  // History data
  const { data: history } = useSWR(
    id ? `/api/v1/events/${id}/history?range=${timeRange}` : null,
    fetcher,
    { refreshInterval: 60_000 }
  )

  const resolutionDate = event?.resolution_date
  const daysToResolution = resolutionDate
    ? Math.max(0, Math.ceil((new Date(resolutionDate).getTime() - new Date().getTime()) / 86400000))
    : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary-muted)] border-t-transparent" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="py-32 text-center">
        <p className="text-zinc-500">Event not found</p>
        <button
          onClick={() => router.push('/feed')}
          className="mt-4 text-sm text-[rgba(247,215,76,0.7)] hover:text-[rgba(247,215,76,0.9)]"
        >
          Back to feed
        </button>
      </div>
    )
  }

  const watched = isWatched(event.id)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold text-zinc-100 leading-tight">
            {event.title}
          </h1>
          <button
            onClick={() => toggleWatchlist(event.id)}
            className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
              watched
                ? 'text-[rgba(247,215,76,0.9)] bg-[var(--primary-subtle)]'
                : 'text-zinc-600 hover:text-zinc-400 hover:bg-[var(--primary-ghost)]'
            }`}
          >
            <Bookmark className="h-4 w-4" fill={watched ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="capitalize">{event.category?.replace(/_/g, ' ')}</span>
          {event.subcategory && (
            <>
              <span className="text-zinc-700">/</span>
              <span className="capitalize">{event.subcategory.replace(/_/g, ' ')}</span>
            </>
          )}
          <span className="text-zinc-700">|</span>
          <span>{event.source_count ?? 0} data source{(event.source_count ?? 0) !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          label="Likelihood"
          value={`${((event.probability ?? 0) * 100).toFixed(1)}%`}
          accent
        />
        <StatCard
          label="24h Trend"
          value={<MovementBadge change={event.prob_change_24h ?? 0} className="text-sm" />}
        />
        <StatCard
          label="Market Confidence"
          value={
            event.volume_24h
              ? `$${(event.volume_24h / 1000).toFixed(0)}K`
              : event.volume_total
              ? `$${(event.volume_total / 1000).toFixed(0)}K total`
              : '—'
          }
          icon={<BarChart3 className="h-3 w-3" />}
        />
        <StatCard
          label="Signal Strength"
          value={<QualityDots score={event.quality_score ?? 0} />}
          icon={<Star className="h-3 w-3" />}
        />
        <StatCard
          label={daysToResolution !== null ? 'Expected In' : 'Status'}
          value={daysToResolution !== null
            ? `${daysToResolution} day${daysToResolution !== 1 ? 's' : ''}`
            : 'Open'}
          icon={<Calendar className="h-3 w-3" />}
        />
      </div>

      {/* AI Summary — shown first for quick context */}
      {event.ai_analysis && (
        <div className="glass-card rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Summary</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">{event.ai_analysis.summary}</p>
          {event.ai_analysis.key_drivers.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-zinc-400 mb-1">Key Drivers</h4>
              <ul className="space-y-1">
                {event.ai_analysis.key_drivers.map((d, i) => (
                  <li key={i} className="text-xs text-zinc-500 flex items-start gap-1.5">
                    <span className="text-[rgba(247,215,76,0.5)] mt-0.5">-</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Likelihood over time */}
      <div className="glass-card rounded-xl p-5">
        <ProbabilityChart
          data={history?.data ?? []}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      </div>

      {/* Description */}
      {event.description && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-2">Background</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">{event.description}</p>
        </div>
      )}

      {/* Data sources */}
      {event.sources && event.sources.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <SourceTable sources={event.sources} />
        </div>
      )}

      {/* How this resolves */}
      {event.resolution_criteria && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-2">How This Resolves</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">{event.resolution_criteria}</p>
          {event.resolution_date && (
            <p className="text-xs text-zinc-600 mt-2 mono">
              Expected by {format(new Date(event.resolution_date), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="glass-card rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="text-zinc-600">{icon}</span>}
        <span className="text-[11px] text-zinc-500">{label}</span>
      </div>
      <div className={accent ? 'mono text-lg font-bold text-[rgba(247,215,76,0.95)]' : 'text-sm text-zinc-300'}>
        {value}
      </div>
    </div>
  )
}
