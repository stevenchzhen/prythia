'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Event } from '@/lib/types'

interface EventDetailPanelProps {
  event: Event | null
  open: boolean
  onClose: () => void
}

export function EventDetailPanel({ event, open, onClose }: EventDetailPanelProps) {
  if (!event) return null

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-slate-950 border-slate-800">
        <SheetHeader>
          <SheetTitle className="text-left text-lg font-bold">
            {event.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* TODO: Stat cards (likelihood, 24h trend, market confidence, expected by) */}
          {/* TODO: AI summary */}
          {/* TODO: Likelihood over time chart */}
          {/* TODO: Data sources table */}
          {/* TODO: Action buttons */}
        </div>
      </SheetContent>
    </Sheet>
  )
}
