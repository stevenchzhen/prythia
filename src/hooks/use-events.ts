'use client'

import useSWR from 'swr'
import type { Event, PaginatedResponse } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface UseEventsParams {
  category?: string
  probMin?: number
  probMax?: number
  volumeMin?: number
  qualityMin?: number
  status?: 'open' | 'resolved' | 'all'
  sort?: 'movement' | 'volume' | 'probability' | 'resolution_date' | 'created'
  order?: 'asc' | 'desc'
  limit?: number
  offset?: number
  search?: string
}

export function useEvents(params: UseEventsParams = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) searchParams.set(key, String(value))
  })

  const queryString = searchParams.toString()
  const url = `/api/v1/events${queryString ? `?${queryString}` : ''}`

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Event>>(
    url,
    fetcher,
    {
      refreshInterval: 60_000, // Poll every 60s (v0, replace with WebSocket in v1)
      revalidateOnFocus: true,
    }
  )

  return {
    events: data?.data ?? [],
    total: data?.meta.total ?? 0,
    isLoading,
    error,
    mutate,
  }
}
