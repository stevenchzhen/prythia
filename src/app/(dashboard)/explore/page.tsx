'use client'

import { useRouter } from 'next/navigation'
import { Compass, TrendingUp, TrendingDown, BarChart3, ChevronRight } from 'lucide-react'
import { useEvents } from '@/hooks/use-events'
import { EventRow } from '@/components/events/event-row'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { Event } from '@/lib/types'

interface CategoryStats {
  slug: string
  label: string
  count: number
  avgProb: number
  totalVolume: number
  topMover: Event | null
  topMoverChange: number
  events: Event[]
}

function computeCategoryStats(events: Event[]): CategoryStats[] {
  const map = new Map<string, Event[]>()
  for (const e of events) {
    const cat = e.category ?? 'unknown'
    const arr = map.get(cat) ?? []
    arr.push(e)
    map.set(cat, arr)
  }

  return Array.from(map.entries())
    .map(([slug, catEvents]) => {
      const count = catEvents.length
      const avgProb = catEvents.reduce((s, e) => s + (e.probability ?? 0), 0) / count
      const totalVolume = catEvents.reduce((s, e) => s + (e.volume_24h ?? 0), 0)

      let topMover: Event | null = null
      let topMoverChange = 0
      for (const e of catEvents) {
        const absChange = Math.abs(e.prob_change_24h ?? 0)
        if (absChange > Math.abs(topMoverChange)) {
          topMover = e
          topMoverChange = e.prob_change_24h ?? 0
        }
      }

      return {
        slug,
        label: CATEGORY_LABELS[slug] ?? slug,
        count,
        avgProb,
        totalVolume,
        topMover,
        topMoverChange,
        events: catEvents,
      }
    })
    .sort((a, b) => b.count - a.count)
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

export default function ExplorePage() {
  const router = useRouter()
  const { events, isLoading } = useEvents({ limit: 100, sort: 'volume', order: 'desc' })

  const categories = computeCategoryStats(events)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Compass className="h-5 w-5 text-[rgba(247,215,76,0.7)]" />
        <h1 className="text-xl font-bold text-zinc-100">Explore Categories</h1>
        {events.length > 0 && (
          <span className="mono text-xs text-zinc-500">{events.length} events across {categories.length} categories</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary-muted)] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => router.push(`/feed?category=${cat.slug}`)}
                className="glass-card glass-card-hover rounded-xl p-4 text-left transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-[rgba(247,215,76,0.9)] transition-colors">
                    {cat.label}
                  </h3>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Events</p>
                    <p className="mono text-sm font-semibold text-zinc-300">{cat.count}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Avg Prob</p>
                    <p className="mono text-sm font-semibold text-[rgba(247,215,76,0.8)]">
                      {(cat.avgProb * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Volume</p>
                    <p className="mono text-sm font-semibold text-zinc-300">{formatVolume(cat.totalVolume)}</p>
                  </div>
                </div>

                {cat.topMover && (
                  <div className="border-t border-[var(--primary-ghost)] pt-2">
                    <div className="flex items-center gap-1.5">
                      {cat.topMoverChange >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-[#22c55e]" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-[#ef4444]" />
                      )}
                      <span className={`mono text-[11px] font-semibold ${cat.topMoverChange >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                        {cat.topMoverChange > 0 ? '+' : ''}{(cat.topMoverChange * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">{cat.topMover.title}</p>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* All Events by Category */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-zinc-500" />
              <h2 className="text-sm font-medium text-zinc-400">All Events by Category</h2>
            </div>

            {categories.map((cat) => (
              <div key={cat.slug}>
                <button
                  onClick={() => router.push(`/feed?category=${cat.slug}`)}
                  className="flex items-center gap-2 mb-2 group"
                >
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider group-hover:text-zinc-300 transition-colors">
                    {cat.label}
                  </h3>
                  <span className="mono text-[11px] text-zinc-600">{cat.count}</span>
                  <ChevronRight className="h-3 w-3 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </button>
                <div className="rounded-xl border border-[var(--primary-ghost)] overflow-hidden">
                  {cat.events.slice(0, 3).map((event) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      onClick={() => router.push(`/event/${event.id}`)}
                    />
                  ))}
                </div>
                {cat.events.length > 3 && (
                  <button
                    onClick={() => router.push(`/feed?category=${cat.slug}`)}
                    className="mt-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors mono"
                  >
                    +{cat.events.length - 3} more
                  </button>
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
