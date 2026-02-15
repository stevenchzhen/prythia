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
          {/* TODO: Stat cards (current prob, 24h change, volume, days to resolution) */}
          {/* TODO: Interactive probability chart */}
          {/* TODO: Source breakdown table */}
          {/* TODO: AI analysis block */}
          {/* TODO: Action buttons */}
        </div>
      </SheetContent>
    </Sheet>
  )
}
