'use client'

import { cn } from '@/lib/utils'

const categories = [
  { slug: 'all', label: 'All' },
  { slug: 'trade_tariffs', label: 'Trade' },
  { slug: 'monetary_policy', label: 'Policy' },
  { slug: 'military_conflict', label: 'Conflict' },
  { slug: 'economics', label: 'Econ' },
  { slug: 'technology', label: 'Tech' },
]

interface CategoryTabsProps {
  selected?: string
  onSelect?: (slug: string) => void
}

export function CategoryTabs({ selected = 'all', onSelect }: CategoryTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onSelect?.(cat.slug)}
          className={cn(
            'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors',
            selected === cat.slug
              ? 'bg-white text-slate-950'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}
