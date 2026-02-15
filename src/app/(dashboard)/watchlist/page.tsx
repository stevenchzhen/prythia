'use client'

import { useRouter } from 'next/navigation'
import { Bookmark } from 'lucide-react'
import { useWatchlist } from '@/hooks/use-watchlist'
import { useEvents } from '@/hooks/use-events'
import { EventRow } from '@/components/events/event-row'

export default function WatchlistPage() {
  const router = useRouter()
  const { watchedIds, removeFromWatchlist } = useWatchlist()

  // Fetch all watched events
  // We use a custom fetch since useEvents doesn't support filtering by IDs
  // Instead, we'll fetch all and filter client-side (fine for localStorage watchlists)
  const { events, isLoading } = useEvents({ limit: 100 })
  const watchedEvents = events.filter((e) => watchedIds.includes(e.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-[rgba(247,215,76,0.7)]" />
          <h1 className="text-xl font-bold text-zinc-100">Watchlist</h1>
          {watchedIds.length > 0 && (
            <span className="mono text-xs text-zinc-500">{watchedIds.length} events</span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary-muted)] border-t-transparent" />
        </div>
      ) : watchedIds.length === 0 ? (
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
      ) : watchedEvents.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm text-zinc-500">Loading watched events...</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--primary-ghost)] overflow-hidden">
          {watchedEvents.map((event) => (
            <div key={event.id} className="flex items-center">
              <div className="flex-1">
                <EventRow
                  event={event}
                  onClick={() => router.push(`/event/${event.id}`)}
                />
              </div>
              <button
                onClick={() => removeFromWatchlist(event.id)}
                className="px-3 text-zinc-600 hover:text-[#ef4444] transition-colors"
                title="Remove from watchlist"
              >
                <Bookmark className="h-3.5 w-3.5" fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
