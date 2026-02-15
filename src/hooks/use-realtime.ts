'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Subscribe to Supabase Realtime changes on the events table.
 * Provides live updates when event probabilities change.
 */
export function useRealtime(
  onEventUpdate?: (payload: Record<string, unknown>) => void
) {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
        },
        (payload) => {
          onEventUpdate?.(payload.new as Record<string, unknown>)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onEventUpdate])
}
