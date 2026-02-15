'use client'

import { useState, useEffect } from 'react'
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

const CATEGORIES = [
  { slug: 'all', label: 'All Categories' },
  { slug: 'trade_tariffs', label: 'Trade & Tariffs' },
  { slug: 'monetary_policy', label: 'Monetary Policy' },
  { slug: 'military_conflict', label: 'Military & Conflict' },
  { slug: 'economics', label: 'Economics' },
  { slug: 'technology', label: 'Technology' },
]

interface FilterPanelProps {
  open: boolean
  onClose: () => void
}

export function FilterPanel({ open, onClose }: FilterPanelProps) {
  const [probMin, setProbMin] = useQueryState('probMin', parseAsInteger)
  const [probMax, setProbMax] = useQueryState('probMax', parseAsInteger)
  const [volumeMin, setVolumeMin] = useQueryState('volumeMin', parseAsInteger)
  const [qualityMin, setQualityMin] = useQueryState('qualityMin', parseAsInteger)
  const [category, setCategory] = useQueryState('category', parseAsString.withDefault('all'))

  // Local state for sliders
  const [localProbRange, setLocalProbRange] = useState([probMin ?? 0, probMax ?? 100])
  const [localVolumeMin, setLocalVolumeMin] = useState(volumeMin ?? 0)
  const [localQualityMin, setLocalQualityMin] = useState(qualityMin ?? 0)
  const [localCategory, setLocalCategory] = useState(category)

  // Sync URL → local when panel opens
  useEffect(() => {
    if (open) {
      setLocalProbRange([probMin ?? 0, probMax ?? 100])
      setLocalVolumeMin(volumeMin ?? 0)
      setLocalQualityMin(qualityMin ?? 0)
      setLocalCategory(category)
    }
  }, [open, probMin, probMax, volumeMin, qualityMin, category])

  const handleApply = () => {
    setProbMin(localProbRange[0] > 0 ? localProbRange[0] : null)
    setProbMax(localProbRange[1] < 100 ? localProbRange[1] : null)
    setVolumeMin(localVolumeMin > 0 ? localVolumeMin : null)
    setQualityMin(localQualityMin > 0 ? localQualityMin : null)
    setCategory(localCategory !== 'all' ? localCategory : null)
    onClose()
  }

  const handleReset = () => {
    setProbMin(null)
    setProbMax(null)
    setVolumeMin(null)
    setQualityMin(null)
    setCategory(null)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-80 bg-[#0a0b10] border-[var(--primary-ghost)]">
        <SheetHeader>
          <SheetTitle className="text-zinc-200">Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Category</label>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setLocalCategory(cat.slug)}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    localCategory === cat.slug
                      ? 'bg-[var(--primary-subtle)] text-[rgba(247,215,76,0.9)] border border-[var(--primary-muted)]'
                      : 'text-zinc-400 hover:bg-[var(--primary-ghost)] hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Likelihood range */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Likelihood Range</label>
            <Slider
              min={0}
              max={100}
              step={5}
              value={localProbRange}
              onValueChange={setLocalProbRange}
            />
            <div className="flex justify-between text-[11px] text-zinc-500 mono">
              <span>{localProbRange[0]}%</span>
              <span>{localProbRange[1]}%</span>
            </div>
          </div>

          {/* Market confidence minimum */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Min Market Confidence</label>
            <Slider
              min={0}
              max={1000000}
              step={10000}
              value={[localVolumeMin]}
              onValueChange={([v]) => setLocalVolumeMin(v)}
            />
            <p className="text-[11px] text-zinc-500 mono">
              {localVolumeMin > 0 ? `$${(localVolumeMin / 1000).toFixed(0)}K+` : 'Any'}
            </p>
          </div>

          {/* Signal strength minimum */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Min Signal Strength</label>
            <Slider
              min={0}
              max={100}
              step={10}
              value={[localQualityMin]}
              onValueChange={([v]) => setLocalQualityMin(v)}
            />
            <p className="text-[11px] text-zinc-500 mono">
              {localQualityMin > 0 ? `${localQualityMin}%+` : 'Any'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 text-xs border-[var(--primary-ghost)] text-zinc-400 hover:text-zinc-200"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              className="flex-1 text-xs bg-[rgba(247,215,76,0.15)] text-[rgba(247,215,76,0.9)] hover:bg-[rgba(247,215,76,0.25)] border border-[var(--primary-muted)]"
              onClick={handleApply}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
