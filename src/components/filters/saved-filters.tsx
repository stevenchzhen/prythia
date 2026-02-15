'use client'

interface SavedFilter {
  id: string
  name: string
  params: Record<string, string>
}

interface SavedFiltersProps {
  filters: SavedFilter[]
  onApply?: (filter: SavedFilter) => void
  onDelete?: (id: string) => void
}

export function SavedFilters({ filters, onApply, onDelete }: SavedFiltersProps) {
  if (filters.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-slate-400 uppercase">Saved Filters</h4>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onApply?.(filter)}
          className="w-full text-left rounded-lg border border-slate-800 px-3 py-2 text-sm hover:bg-slate-900 transition-colors"
        >
          {filter.name}
        </button>
      ))}
    </div>
  )
}
