'use client'

import { useRouter } from 'next/navigation'
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs'
import useSWR from 'swr'
import { TrendingUp, TrendingDown, ChevronDown } from 'lucide-react'
import { useEvents } from '@/hooks/use-events'
import { EventRow } from '@/components/events/event-row'
import { CategoryTabs } from '@/components/filters/category-tabs'
import type { Event } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const SORT_OPTIONS = [
  { value: 'movement', label: 'Trending' },
  { value: 'volume', label: 'Confidence' },
  { value: 'probability', label: 'Likelihood' },
  { value: 'quality', label: 'Signal Strength' },
  { value: 'created', label: 'Newest' },
] as const

export default function FeedPage() {
  const router = useRouter()
  const [category, setCategory] = useQueryState('category', parseAsString.withDefault('all'))
  const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('movement'))
  const [search] = useQueryState('search', parseAsString)
  const [probMin] = useQueryState('probMin', parseAsInteger)
  const [probMax] = useQueryState('probMax', parseAsInteger)
  const [volumeMin] = useQueryState('volumeMin', parseAsInteger)
  const [qualityMin] = useQueryState('qualityMin', parseAsInteger)
  const [offset, setOffset] = useQueryState('offset', parseAsInteger.withDefault(0))

  // Movers
  const { data: movers } = useSWR<{ gainers: Event[]; losers: Event[] }>(
    '/api/v1/movers',
    fetcher,
    { refreshInterval: 60_000 }
  )

  // Events
  const { events, total, isLoading } = useEvents({
    category: category !== 'all' ? category : undefined,
    sort: sort as 'movement' | 'volume' | 'probability' | 'created',
    search: search ?? undefined,
    probMin: probMin ?? undefined,
    probMax: probMax ?? undefined,
    volumeMin: volumeMin ?? undefined,
    qualityMin: qualityMin ?? undefined,
    offset,
    limit: 50,
  })

  const hasMore = total > offset + 50

  return (
    <div className="space-y-6">
      {/* What's Changing Now */}
      {movers && (movers.gainers.length > 0 || movers.losers.length > 0) && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-medium text-zinc-400">What&apos;s Changing Now</h2>
            <span className="text-[11px] text-zinc-600 mono">24h</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {movers.gainers.map((e) => (
              <MoverCard key={e.id} event={e} direction="up" onClick={() => router.push(`/event/${e.id}`)} />
            ))}
            {movers.losers.map((e) => (
              <MoverCard key={e.id} event={e} direction="down" onClick={() => router.push(`/event/${e.id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* Controls row */}
      <div className="flex items-center justify-between gap-4">
        <CategoryTabs
          selected={category}
          onSelect={(slug) => {
            setCategory(slug)
            setOffset(0)
          }}
        />

        <div className="relative flex-shrink-0">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value)
              setOffset(0)
            }}
            className="appearance-none bg-[rgba(12,13,20,0.72)] border border-[var(--primary-border)] text-zinc-300 text-xs rounded-lg px-3 py-1.5 pr-7 cursor-pointer focus:outline-none focus:border-[var(--primary-muted)]"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Event list */}
      <div className="rounded-xl border border-[var(--primary-ghost)] overflow-hidden">
        {isLoading && events.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary-muted)] border-t-transparent" />
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center text-sm text-zinc-600">
            No events found{search ? ` for "${search}"` : ''}
          </div>
        ) : (
          events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              onClick={() => router.push(`/event/${event.id}`)}
            />
          ))
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => setOffset((prev) => (prev ?? 0) + 50)}
            className="mono text-xs text-zinc-500 hover:text-zinc-300 border border-[var(--primary-ghost)] rounded-full px-4 py-1.5 hover:border-[var(--primary-border)] transition-colors"
          >
            Load more ({total - offset - 50} remaining)
          </button>
        </div>
      )}

      {/* Footer count */}
      {total > 0 && (
        <p className="text-center text-[11px] text-zinc-600 mono">
          Showing {Math.min(offset + 50, total)} of {total} events
        </p>
      )}
    </div>
  )
}

function MoverCard({
  event,
  direction,
  onClick,
}: {
  event: Event
  direction: 'up' | 'down'
  onClick: () => void
}) {
  const change = event.prob_change_24h ?? 0
  const isUp = direction === 'up'

  return (
    <div
      onClick={onClick}
      className="glass-card rounded-lg p-3 cursor-pointer hover:bg-[var(--primary-ghost)] transition-colors"
    >
      <div className="flex items-center gap-1.5 mb-1">
        {isUp ? (
          <TrendingUp className="h-3 w-3 text-[#22c55e]" />
        ) : (
          <TrendingDown className="h-3 w-3 text-[#ef4444]" />
        )}
        <span
          className={`mono text-xs font-semibold ${isUp ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}
        >
          {change > 0 ? '+' : ''}{(change * 100).toFixed(1)}%
        </span>
      </div>
      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-tight">
        {event.title}
      </p>
      <p className="mono text-xs font-semibold text-[rgba(247,215,76,0.8)] mt-1.5">
        {((event.probability ?? 0) * 100).toFixed(0)}% likely
      </p>
    </div>
  )
}
