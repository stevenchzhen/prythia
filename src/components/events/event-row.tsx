'use client'

import type { Event } from '@/lib/types'
import { Sparkline } from './sparkline'
import { QualityDots } from './quality-dots'
import { MovementBadge } from './movement-badge'

interface EventRowProps {
  event: Event
  density?: 'compact' | 'default' | 'expanded'
  onClick?: (eventId: string) => void
}

export function EventRow({ event, density = 'default', onClick }: EventRowProps) {
  // TODO: Implement event row with:
  // - Status dot (active/low-confidence/resolved)
  // - Title (truncated)
  // - Current probability
  // - 24h change badge
  // - Sparkline (7-day)
  // - Quality dots
  // - Second line: category tag, volume, resolution countdown

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 border-b border-slate-800 hover:bg-slate-900 cursor-pointer transition-colors"
      onClick={() => onClick?.(event.id)}
    >
      <span className="text-sm font-medium flex-1 truncate">{event.title}</span>
      <span className="text-sm tabular-nums">{((event.probability ?? 0) * 100).toFixed(0)}%</span>
      <MovementBadge change={event.prob_change_24h ?? 0} />
      <Sparkline data={[]} />
      <QualityDots score={event.quality_score ?? 0} />
    </div>
  )
}
