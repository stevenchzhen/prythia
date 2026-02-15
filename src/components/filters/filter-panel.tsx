'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { CategoryTabs } from './category-tabs'
import { ProbabilitySlider } from './probability-slider'

interface FilterPanelProps {
  open: boolean
  onClose: () => void
}

export function FilterPanel({ open, onClose }: FilterPanelProps) {
  // TODO: Wire filters to URL query state via nuqs
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-80 bg-slate-950 border-slate-800">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {/* TODO: Category checkboxes */}
          {/* TODO: Probability range slider */}
          <ProbabilitySlider />
          {/* TODO: Volume minimum */}
          {/* TODO: Quality score minimum */}
          {/* TODO: Resolution date range */}
          {/* TODO: Source market filter */}
          {/* TODO: Tag filter */}
          <Button className="w-full" onClick={onClose}>Apply Filters</Button>
          {/* TODO: Save filter as preset */}
        </div>
      </SheetContent>
    </Sheet>
  )
}
