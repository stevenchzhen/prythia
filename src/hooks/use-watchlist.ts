'use client'

import { useCallback, useEffect, useState } from 'react'

export function useWatchlist() {
  const [watchedIds, setWatchedIds] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/v1/watchlist')
      .then((r) => r.json())
      .then((data) => {
        setWatchedIds(data.ids ?? [])
        setIsLoaded(true)
      })
      .catch(() => setIsLoaded(true))
  }, [])

  const isWatched = useCallback(
    (eventId: string) => watchedIds.includes(eventId),
    [watchedIds]
  )

  const addToWatchlist = useCallback(async (eventId: string) => {
    // Optimistic update
    setWatchedIds((prev) => (prev.includes(eventId) ? prev : [...prev, eventId]))
    await fetch('/api/v1/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId }),
    })
  }, [])

  const removeFromWatchlist = useCallback(async (eventId: string) => {
    setWatchedIds((prev) => prev.filter((id) => id !== eventId))
    await fetch('/api/v1/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId }),
    })
  }, [])

  const toggleWatchlist = useCallback(
    async (eventId: string) => {
      if (watchedIds.includes(eventId)) {
        await removeFromWatchlist(eventId)
      } else {
        await addToWatchlist(eventId)
      }
    },
    [watchedIds, addToWatchlist, removeFromWatchlist]
  )

  return {
    watchedIds,
    isWatched,
    isLoaded,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
  }
}
