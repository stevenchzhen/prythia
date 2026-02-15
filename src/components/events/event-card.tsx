'use client'

import type { Event } from '@/lib/types'
import { MovementBadge } from './movement-badge'
import { Sparkline } from './sparkline'

interface EventCardProps {
  event: Event
  onClick?: (eventId: string) => void
}

export function EventCard({ event, onClick }: EventCardProps) {
  return (
    <div
      className="glass-card glass-card-hover rounded-xl p-5 cursor-pointer transition-all duration-150"
      onClick={() => onClick?.(event.id)}
    >
      <p className="text-[13px] font-medium leading-tight line-clamp-2 text-zinc-300">
        {event.title}
      </p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="mono text-xl font-bold text-[rgba(247,215,76,0.95)]">
          {((event.probability ?? 0) * 100).toFixed(0)}%
        </span>
        <MovementBadge change={event.prob_change_24h ?? 0} />
      </div>
      <div className="mt-2">
        <Sparkline data={[]} color="#f7d74c" />
      </div>
      <p className="mono mt-2 text-xs text-zinc-600">
        ${((event.volume_24h ?? 0) / 1000).toFixed(0)}K vol
      </p>
    </div>
  )
}
