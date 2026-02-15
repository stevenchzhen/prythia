import { MovementBadge } from '@/components/events/movement-badge'

interface AIDataCardProps {
  eventId: string
  title: string
  probability: number
  change24h: number
}

export function AIDataCard({ eventId, title, probability, change24h }: AIDataCardProps) {
  // Inline data card embedded in AI chat responses
  return (
    <div className="inline-flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
      <span className="text-slate-400">●</span>
      <span className="truncate max-w-[200px]">{title}</span>
      <span className="font-medium tabular-nums">{(probability * 100).toFixed(0)}%</span>
      <MovementBadge change={change24h} />
    </div>
  )
}
