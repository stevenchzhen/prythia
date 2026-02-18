'use client'

import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Bookmark } from 'lucide-react'
import { useWatchlist } from '@/hooks/use-watchlist'
import { EventRow } from '@/components/events/event-row'
import type { Event } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function WatchlistPage() {
  const router = useRouter()
  const { isWatched, toggleWatchlist, isLoaded } = useWatchlist()

  // Fetch watchlist events directly from API
  const { data, isLoading } = useSWR<{ data: Event[]; ids: string[] }>(
    '/api/v1/watchlist',
    fetcher
  )

  const watchedEvents = data?.data ?? []
  const watchedCount = data?.ids?.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-[rgba(247,215,76,0.7)]" />
          <h1 className="text-xl font-bold text-zinc-100">Watchlist</h1>
          {watchedCount > 0 && (
            <span className="mono text-xs text-zinc-500">{watchedCount} events</span>
          )}
        </div>
      </div>

      {isLoading || !isLoaded ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary-muted)] border-t-transparent" />
        </div>
      ) : watchedCount === 0 ? (
        <div className="py-20 text-center space-y-3">
          <Bookmark className="h-8 w-8 text-zinc-700 mx-auto" />
          <p className="text-sm text-zinc-500">Nothing on your watchlist yet</p>
          <p className="text-xs text-zinc-600">
            Bookmark any event from the feed to track it here
          </p>
          <button
            onClick={() => router.push('/feed')}
            className="mt-2 text-xs text-[rgba(247,215,76,0.7)] hover:text-[rgba(247,215,76,0.9)]"
          >
            Browse events
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--primary-ghost)] overflow-hidden">
          {watchedEvents.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              onClick={() => router.push(`/event/${event.id}`)}
              isWatched={isWatched(event.id)}
              onToggleWatch={toggleWatchlist}
            />
          ))}
        </div>
      )}
    </div>
  )
}
