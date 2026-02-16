'use client'

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'prythia_watchlist'

// Cached snapshot — only updated when we write or on storage events
let cachedIds: string[] = []

function hydrate() {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cachedIds = raw ? JSON.parse(raw) : []
  } catch {
    cachedIds = []
  }
}

// Hydrate once on load
if (typeof window !== 'undefined') {
  hydrate()
  // Listen for changes from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      hydrate()
      listeners.forEach((l) => l())
    }
  })
}

let listeners: Array<() => void> = []

function getSnapshot(): string[] {
  return cachedIds
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
  cachedIds = ids
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  listeners.forEach((l) => l())
}

export function useWatchlist() {
  const watchedIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const isWatched = useCallback(
    (eventId: string) => watchedIds.includes(eventId),
    [watchedIds]
  )

  const addToWatchlist = useCallback((eventId: string) => {
    if (!cachedIds.includes(eventId)) {
      setStoredIds([...cachedIds, eventId])
    }
  }, [])

  const removeFromWatchlist = useCallback((eventId: string) => {
    setStoredIds(cachedIds.filter((id) => id !== eventId))
  }, [])

  const toggleWatchlist = useCallback((eventId: string) => {
    if (cachedIds.includes(eventId)) {
      setStoredIds(cachedIds.filter((id) => id !== eventId))
    } else {
      setStoredIds([...cachedIds, eventId])
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
