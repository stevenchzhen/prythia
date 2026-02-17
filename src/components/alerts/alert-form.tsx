'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'
import { useAlerts } from '@/hooks/use-alerts'
import type { Event } from '@/lib/types'

export function AlertForm() {
  const { addAlert } = useAlerts()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [alertType, setAlertType] = useState<'threshold_cross' | 'movement' | 'divergence'>('threshold_cross')
  const [threshold, setThreshold] = useState(50)
  const [direction, setDirection] = useState<'above' | 'below'>('above')
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!search.trim() || search.length < 2) {
        setResults([])
        return
      }
      try {
        const res = await fetch(`/api/v1/events?search=${encodeURIComponent(search)}&limit=5`)
        const data = await res.json()
        setResults(data.data ?? [])
        setShowResults(true)
      } catch {
        setResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event)
    setSearch(event.title)
    setShowResults(false)
  }

  const handleCreate = () => {
    if (!selectedEvent) return
    addAlert({
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      alertType,
      condition: alertType === 'divergence'
        ? { threshold }
        : { threshold, direction },
      isActive: true,
    })
    setSelectedEvent(null)
    setSearch('')
    setThreshold(50)
    setDirection('above')
    setAlertType('threshold_cross')
  }

  const maxThreshold = alertType === 'threshold_cross' ? 99 : alertType === 'divergence' ? 50 : 50

  return (
    <div className="glass-card rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300">Create Alert</h3>

      {/* Event search */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedEvent(null)
            }}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="Search for an event..."
            className="pl-9 bg-[rgba(12,13,20,0.72)] border-[var(--primary-border)]"
          />
        </div>
        {showResults && results.length > 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--primary-border)] bg-[#0e0f14] shadow-xl overflow-hidden">
            {results.map((event) => (
              <button
                key={event.id}
                onMouseDown={() => handleSelectEvent(event)}
                className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-[var(--primary-ghost)] transition-colors border-b border-[var(--primary-ghost)] last:border-0"
              >
                <span className="truncate block">{event.title}</span>
                <span className="mono text-[10px] text-zinc-500">
                  {((event.probability ?? 0) * 100).toFixed(0)}%
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <p className="text-[11px] text-zinc-500">
          Selected: <span className="text-zinc-400">{selectedEvent.title}</span>
        </p>
      )}

      {/* Alert type */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Alert Type</label>
        <div className="flex gap-2">
          <button
            onClick={() => setAlertType('threshold_cross')}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
              alertType === 'threshold_cross'
                ? 'border-[var(--primary-muted)] bg-[var(--primary-ghost)] text-[rgba(247,215,76,0.85)]'
                : 'border-[var(--primary-ghost)] text-zinc-500 hover:text-zinc-400'
            }`}
          >
            Probability crosses
          </button>
          <button
            onClick={() => setAlertType('movement')}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
              alertType === 'movement'
                ? 'border-[var(--primary-muted)] bg-[var(--primary-ghost)] text-[rgba(247,215,76,0.85)]'
                : 'border-[var(--primary-ghost)] text-zinc-500 hover:text-zinc-400'
            }`}
          >
            24h movement exceeds
          </button>
          <button
            onClick={() => { setAlertType('divergence'); setThreshold(10) }}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
              alertType === 'divergence'
                ? 'border-[var(--primary-muted)] bg-[var(--primary-ghost)] text-[rgba(247,215,76,0.85)]'
                : 'border-[var(--primary-ghost)] text-zinc-500 hover:text-zinc-400'
            }`}
          >
            Spread exceeds
          </button>
        </div>
      </div>

      {/* Threshold + Direction */}
      <div className="flex gap-3">
        {alertType === 'threshold_cross' && (
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Direction</label>
            <div className="flex gap-1">
              <button
                onClick={() => setDirection('above')}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  direction === 'above'
                    ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]'
                    : 'border-[var(--primary-ghost)] text-zinc-500'
                }`}
              >
                Rises above
              </button>
              <button
                onClick={() => setDirection('below')}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  direction === 'below'
                    ? 'border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]'
                    : 'border-[var(--primary-ghost)] text-zinc-500'
                }`}
              >
                Falls below
              </button>
            </div>
          </div>
        )}
        <div className="space-y-1.5 flex-1">
          <label className="text-[11px] text-zinc-500 uppercase tracking-wider">
            {alertType === 'threshold_cross' ? 'Threshold (%)' : alertType === 'divergence' ? 'Spread (pp)' : 'Movement (%)'}
          </label>
          <Input
            type="number"
            min={1}
            max={maxThreshold}
            value={threshold}
            onChange={(e) => setThreshold(Math.min(maxThreshold, Math.max(1, Number(e.target.value))))}
            className="bg-[rgba(12,13,20,0.72)] border-[var(--primary-border)] mono"
          />
        </div>
      </div>

      <Button
        onClick={handleCreate}
        disabled={!selectedEvent}
        className="w-full"
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        Create Alert
      </Button>
    </div>
  )
}
