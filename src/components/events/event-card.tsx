'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Event } from '@/lib/types'
import { MovementBadge } from './movement-badge'
import { Sparkline } from './sparkline'

interface EventCardProps {
  event: Event
  onClick?: (eventId: string) => void
}

export function EventCard({ event, onClick }: EventCardProps) {
  // "Biggest Movers" card variant
  return (
    <Card
      className="cursor-pointer hover:bg-slate-800 transition-colors bg-slate-900 border-slate-700"
      onClick={() => onClick?.(event.id)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
          {event.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums">
            {((event.probability ?? 0) * 100).toFixed(0)}%
          </span>
          <MovementBadge change={event.prob_change_24h ?? 0} />
        </div>
        <Sparkline data={[]} />
        <p className="text-xs text-slate-400">
          ${((event.volume_24h ?? 0) / 1000).toFixed(0)}K vol
        </p>
      </CardContent>
    </Card>
  )
}
