'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AlertForm() {
  // TODO: Alert creation form
  // - Event selector or category selector
  // - Condition type (threshold_cross, movement, volume_spike, new_event, resolution, divergence)
  // - Condition parameters (direction, value, period)
  // - Delivery channels (email, slack, discord, in-app, webhook)
  // - Frequency throttle (realtime, once_per_hour, once_per_24h, daily_digest)

  return (
    <div className="space-y-4 p-4 border border-slate-800 rounded-lg">
      <h3 className="text-sm font-medium">Create Alert</h3>
      {/* TODO: Form fields */}
      <Button className="w-full">Create Alert</Button>
    </div>
  )
}
