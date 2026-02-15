'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { DensityToggle } from './density-toggle'

export function Topbar() {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-slate-800 bg-slate-950 px-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search events... ( / )"
          className="pl-9 bg-slate-900 border-slate-700"
        />
      </div>
      <DensityToggle />
      {/* TODO: Filter button */}
      {/* TODO: User menu */}
    </header>
  )
}
