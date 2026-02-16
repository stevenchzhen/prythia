'use client'

import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useQueryState, parseAsString } from 'nuqs'
import { Input } from '@/components/ui/input'
import { DensityToggle } from './density-toggle'
import { FilterPanel } from '@/components/filters/filter-panel'

export function Topbar() {
  const [search, setSearch] = useQueryState('search', parseAsString)
  const [localSearch, setLocalSearch] = useState(search ?? '')
  const [filterOpen, setFilterOpen] = useState(false)

  // Debounced write from local input → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(localSearch || null)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, setSearch])

  return (
    <>
      <header className="flex h-12 items-center gap-4 border-b border-[var(--primary-border)] bg-[#050506] px-5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search events...  /"
            className="h-8 pl-8 text-xs bg-[rgba(12,13,20,0.72)] border-[var(--primary-border)] text-zinc-300 placeholder:text-zinc-600 focus:border-[var(--primary-muted)] focus:ring-[var(--primary-subtle)] rounded-lg"
          />
        </div>

        <div className="flex items-center gap-1">
          <DensityToggle />
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-[var(--primary-ghost)] transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>
        </div>
      </header>
      <FilterPanel open={filterOpen} onClose={() => setFilterOpen(false)} />
    </>
  )
}
