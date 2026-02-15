'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { DensityToggle } from './density-toggle'

export function Topbar() {
  return (
    <header className="flex h-12 items-center gap-4 border-b border-[var(--primary-border)] bg-[#050506] px-5">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
        <Input
          placeholder="Search events...  /"
          className="h-8 pl-8 text-xs bg-[rgba(12,13,20,0.72)] border-[var(--primary-border)] text-zinc-300 placeholder:text-zinc-600 focus:border-[var(--primary-muted)] focus:ring-[var(--primary-subtle)] rounded-lg"
        />
      </div>

      <div className="flex items-center gap-1">
        <DensityToggle />
        {/* TODO: Filter button */}
        {/* TODO: Notification bell */}
        {/* TODO: User avatar menu */}
      </div>
    </header>
  )
}
