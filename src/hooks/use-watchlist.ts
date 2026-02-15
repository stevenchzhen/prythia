'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import type { WatchlistGroup, WatchlistItem, Event } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useWatchlist() {
  // TODO: Implement with Supabase client
  // - Fetch watchlist groups and items
  // - Optimistic add/remove
  // - Drag-and-drop reordering

  const addToWatchlist = useCallback(async (eventId: string, groupId?: string) => {
    // TODO: POST to Supabase
  }, [])

  const removeFromWatchlist = useCallback(async (eventId: string) => {
    // TODO: DELETE from Supabase
  }, [])

  const createGroup = useCallback(async (name: string) => {
    // TODO: POST to Supabase
  }, [])

  return {
    groups: [] as WatchlistGroup[],
    items: [] as WatchlistItem[],
    isLoading: false,
    addToWatchlist,
    removeFromWatchlist,
    createGroup,
  }
}
