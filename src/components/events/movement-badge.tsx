import { cn } from '@/lib/utils'

interface MovementBadgeProps {
  change: number // e.g., 0.03 for +3%
  className?: string
}

export function MovementBadge({ change, className }: MovementBadgeProps) {
  const pct = change * 100
  const isPositive = pct > 0
  const isNeutral = Math.abs(pct) < 1

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 mono text-xs font-medium',
        isNeutral
          ? 'text-white/30'
          : isPositive
          ? 'text-[#22c55e]'
          : 'text-[#ef4444]',
        className
      )}
    >
      {isNeutral ? '—' : isPositive ? '▲' : '▼'}
      {!isNeutral && `${Math.abs(pct).toFixed(1)}%`}
    </span>
  )
}
