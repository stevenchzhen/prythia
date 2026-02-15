'use client'

import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'prythia_watchlist'

function getStoredIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setStoredIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export function useWatchlist() {
  const [watchedIds, setWatchedIds] = useState<string[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    setWatchedIds(getStoredIds())
  }, [])

  const isWatched = useCallback(
    (eventId: string) => watchedIds.includes(eventId),
    [watchedIds]
  )

  const addToWatchlist = useCallback((eventId: string) => {
    setWatchedIds((prev) => {
      if (prev.includes(eventId)) return prev
      const next = [...prev, eventId]
      setStoredIds(next)
      return next
    })
  }, [])

  const removeFromWatchlist = useCallback((eventId: string) => {
    setWatchedIds((prev) => {
      const next = prev.filter((id) => id !== eventId)
      setStoredIds(next)
      return next
    })
  }, [])

  const toggleWatchlist = useCallback((eventId: string) => {
    setWatchedIds((prev) => {
      const next = prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
      setStoredIds(next)
      return next
    })
  }, [])

  return {
    watchedIds,
    isWatched,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
  }
}
