'use client'

import { Bookmark } from 'lucide-react'
import type { Event } from '@/lib/types'
import { Sparkline } from './sparkline'
import { QualityDots } from './quality-dots'
import { MovementBadge } from './movement-badge'

interface EventWithSparkline extends Event {
  sparkline_data?: number[]
}

interface EventRowProps {
  event: EventWithSparkline
  density?: 'compact' | 'default' | 'expanded'
  onClick?: (eventId: string) => void
  isWatched?: boolean
  onToggleWatch?: (eventId: string) => void
}

export function EventRow({ event, onClick, isWatched, onToggleWatch }: EventRowProps) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 border-b border-[var(--primary-ghost)] hover:bg-[var(--primary-ghost)] cursor-pointer transition-colors duration-150 group"
      onClick={() => onClick?.(event.id)}
    >
      {/* Status dot */}
      <span className="h-2 w-2 rounded-full bg-[rgba(247,215,76,0.6)] flex-shrink-0" />

      {/* Title */}
      <span className="text-[13px] font-medium flex-1 truncate text-zinc-300 group-hover:text-zinc-200 transition-colors">
        {event.title}
      </span>

      {/* Probability */}
      <span className="mono text-sm font-semibold text-[rgba(247,215,76,0.9)] w-12 text-right">
        {((event.probability ?? 0) * 100).toFixed(0)}%
      </span>

      {/* Change */}
      <div className="w-16 text-right">
        <MovementBadge change={event.prob_change_24h ?? 0} />
      </div>

      {/* Sparkline */}
      <Sparkline data={event.sparkline_data ?? []} color="#f7d74c" />

      {/* Quality */}
      <QualityDots score={event.quality_score ?? 0} />

      {/* Watchlist toggle */}
      {onToggleWatch && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleWatch(event.id)
          }}
          className="flex-shrink-0 p-1 rounded-md hover:bg-[var(--primary-subtle)] transition-colors"
          title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          <Bookmark
            className={`h-3.5 w-3.5 transition-colors ${
              isWatched
                ? 'fill-[rgba(247,215,76,0.8)] text-[rgba(247,215,76,0.8)]'
                : 'text-zinc-600 group-hover:text-zinc-500'
            }`}
          />
        </button>
      )}
    </div>
  )
}
