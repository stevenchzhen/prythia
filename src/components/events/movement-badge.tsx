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
        'inline-flex items-center text-xs font-medium tabular-nums',
        isNeutral
          ? 'text-slate-400'
          : isPositive
          ? 'text-green-500'
          : 'text-red-500',
        className
      )}
    >
      {isNeutral ? '—' : isPositive ? '▲' : '▼'}
      {!isNeutral && `${Math.abs(pct).toFixed(1)}%`}
    </span>
  )
}
