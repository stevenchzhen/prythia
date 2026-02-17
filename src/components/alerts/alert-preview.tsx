interface AlertPreviewProps {
  triggerCount30d: number
  condition: string
}

export function AlertPreview({ triggerCount30d, condition }: AlertPreviewProps) {
  return (
    <div className="rounded-lg border border-[var(--primary-ghost)] bg-[rgba(12,13,20,0.72)] p-3 text-sm">
      <p className="text-zinc-400">
        With condition <span className="font-medium text-zinc-200">{condition}</span>,
        this alert would have triggered{' '}
        <span className="font-medium text-zinc-200">{triggerCount30d} times</span> in the last 30 days.
      </p>
      {triggerCount30d > 20 && (
        <p className="mt-1 text-xs text-[rgba(247,215,76,0.7)]">
          Consider a less sensitive threshold to avoid alert fatigue.
        </p>
      )}
    </div>
  )
}
