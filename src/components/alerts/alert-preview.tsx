interface AlertPreviewProps {
  triggerCount30d: number
  condition: string
}

export function AlertPreview({ triggerCount30d, condition }: AlertPreviewProps) {
  // Shows "Would have triggered X times in the last 30 days" to help users calibrate sensitivity
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm">
      <p className="text-slate-300">
        With condition <span className="font-medium text-white">{condition}</span>,
        this alert would have triggered{' '}
        <span className="font-medium text-white">{triggerCount30d} times</span> in the last 30 days.
      </p>
      {triggerCount30d > 20 && (
        <p className="mt-1 text-xs text-amber-400">
          ⚠ Consider a less sensitive threshold to avoid alert fatigue.
        </p>
      )}
    </div>
  )
}
