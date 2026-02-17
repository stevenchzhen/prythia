'use client'

import { Switch } from '@/components/ui/switch'

interface Alert {
  id: string
  event_title: string
  alert_type: string
  condition: Record<string, unknown>
  is_active: boolean
  trigger_count: number
  last_triggered_at: string | null
}

interface AlertListProps {
  alerts: Alert[]
  onToggle?: (id: string, active: boolean) => void
}

export function AlertList({ alerts, onToggle }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-8 text-center">
        No alerts configured. Create one to get notified about probability changes.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-center justify-between p-3 border border-[var(--primary-ghost)] rounded-lg hover:bg-[var(--primary-ghost)] transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-300 truncate">{alert.event_title}</p>
            <p className="text-xs text-zinc-500">
              {alert.alert_type} · Triggered {alert.trigger_count} times
            </p>
          </div>
          <Switch
            checked={alert.is_active}
            onCheckedChange={(checked) => onToggle?.(alert.id, checked)}
          />
        </div>
      ))}
    </div>
  )
}
