'use client'

import useSWR from 'swr'
import type { Event, SourceContract } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface EventDetail extends Event {
  sources: SourceContract[]
}

export function useEventDetail(eventId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<EventDetail>(
    eventId ? `/api/v1/events/${eventId}` : null,
    fetcher,
    {
      refreshInterval: 60_000,
    }
  )

  return {
    event: data ?? null,
    isLoading,
    error,
    mutate,
  }
}
