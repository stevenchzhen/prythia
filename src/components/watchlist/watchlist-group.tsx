'use client'

import type { Event } from '@/lib/types'

interface WatchlistGroupProps {
  name: string
  events: Event[]
  isCollapsed?: boolean
  onToggle?: () => void
}

export function WatchlistGroup({ name, events, isCollapsed, onToggle }: WatchlistGroupProps) {
  // TODO: Collapsible group with event rows inside
  // - Group header with name, event count, collapse toggle
  // - Event rows (same as feed but within group context)
  // - Drag-and-drop reordering

  return (
    <div className="border border-slate-800 rounded-lg">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-900"
        onClick={onToggle}
      >
        <span className="text-sm font-medium">
          {name} ({events.length})
        </span>
        <span className="text-slate-400 text-xs">{isCollapsed ? '▶' : '▼'}</span>
      </button>
      {!isCollapsed && (
        <div className="border-t border-slate-800">
          {events.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">No events in this group.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="px-4 py-2 text-sm border-b border-slate-800/50 last:border-0">
                {event.title}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
