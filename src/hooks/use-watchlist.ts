'use client'

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'prythia_watchlist'

// Simple external store for localStorage-backed watchlist
let listeners: Array<() => void> = []

function getSnapshot(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function getServerSnapshot(): string[] {
  return []
}

function subscribe(listener: () => void) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function setStoredIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  // Notify all subscribers
  listeners.forEach((l) => l())
}

export function useWatchlist() {
  const watchedIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const isWatched = useCallback(
    (eventId: string) => watchedIds.includes(eventId),
    [watchedIds]
  )

  const addToWatchlist = useCallback((eventId: string) => {
    const current = getSnapshot()
    if (!current.includes(eventId)) {
      setStoredIds([...current, eventId])
    }
  }, [])

  const removeFromWatchlist = useCallback((eventId: string) => {
    const current = getSnapshot()
    setStoredIds(current.filter((id) => id !== eventId))
  }, [])

  const toggleWatchlist = useCallback((eventId: string) => {
    const current = getSnapshot()
    if (current.includes(eventId)) {
      setStoredIds(current.filter((id) => id !== eventId))
    } else {
      setStoredIds([...current, eventId])
    }
  }, [])

  return {
    watchedIds,
    isWatched,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
  }
}
