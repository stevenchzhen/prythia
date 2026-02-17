'use client'

import { Bell, Trash2 } from 'lucide-react'
import { useAlerts } from '@/hooks/use-alerts'
import { AlertForm } from '@/components/alerts/alert-form'
import { AlertList } from '@/components/alerts/alert-list'
import { Button } from '@/components/ui/button'

export default function AlertsPage() {
  const { alerts, toggleAlert, removeAlert } = useAlerts()

  // Map LocalAlert → AlertList's expected shape
  const mappedAlerts = alerts.map((a) => ({
    id: a.id,
    event_title: a.eventTitle,
    alert_type: a.alertType === 'threshold_cross'
      ? `Prob ${a.condition.direction === 'above' ? 'rises above' : 'falls below'} ${a.condition.threshold}%`
      : `24h movement exceeds ${a.condition.threshold}%`,
    condition: a.condition as Record<string, unknown>,
    is_active: a.isActive,
    trigger_count: a.triggerCount,
    last_triggered_at: a.lastTriggeredAt,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-[rgba(247,215,76,0.7)]" />
          <h1 className="text-xl font-bold text-zinc-100">Alerts</h1>
          {alerts.length > 0 && (
            <span className="mono text-xs text-zinc-500">
              {alerts.filter((a) => a.isActive).length} active
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create alert */}
        <div className="lg:col-span-1">
          <AlertForm />
        </div>

        {/* Alert list */}
        <div className="lg:col-span-2 space-y-3">
          <AlertList
            alerts={mappedAlerts}
            onToggle={(id) => toggleAlert(id)}
          />
          {alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-600 mono truncate max-w-[200px]">
                    {alert.eventTitle}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeAlert(alert.id)}
                    className="text-zinc-600 hover:text-[#ef4444]"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
