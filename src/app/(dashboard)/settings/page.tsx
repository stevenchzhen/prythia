'use client'

import { useState } from 'react'
import { Settings, Monitor, Database, Info, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDensity, type Density } from '@/hooks/use-density'
import { useWatchlist } from '@/hooks/use-watchlist'
import { useAlerts } from '@/hooks/use-alerts'
import { CATEGORY_LABELS } from '@/lib/constants'

const DENSITY_LABELS: Record<Density, string> = {
  compact: 'Compact',
  default: 'Default',
  expanded: 'Expanded',
}

export default function SettingsPage() {
  const { density, cycleDensity } = useDensity()
  const { watchedIds } = useWatchlist()
  const { alerts, clearAlerts } = useAlerts()
  const [defaultCategory, setDefaultCategory] = useState(() => {
    if (typeof window === 'undefined') return 'all'
    return localStorage.getItem('prythia_default_category') ?? 'all'
  })
  const [confirmClearWatchlist, setConfirmClearWatchlist] = useState(false)
  const [confirmClearAlerts, setConfirmClearAlerts] = useState(false)

  const handleCategoryChange = (value: string) => {
    setDefaultCategory(value)
    localStorage.setItem('prythia_default_category', value)
  }

  const handleClearWatchlist = () => {
    if (!confirmClearWatchlist) {
      setConfirmClearWatchlist(true)
      return
    }
    localStorage.removeItem('prythia_watchlist')
    window.location.reload()
  }

  const handleClearAlerts = () => {
    if (!confirmClearAlerts) {
      setConfirmClearAlerts(true)
      return
    }
    clearAlerts()
    setConfirmClearAlerts(false)
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-[rgba(247,215,76,0.7)]" />
        <h1 className="text-xl font-bold text-zinc-100">Settings</h1>
      </div>

      {/* Display */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-300">Display</h2>
        </div>

        <div className="glass-card rounded-xl p-4 space-y-4">
          {/* Density */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-300">Feed Density</p>
              <p className="text-[11px] text-zinc-500">Current: {DENSITY_LABELS[density]}</p>
            </div>
            <Button variant="outline" size="sm" onClick={cycleDensity}>
              Cycle ({DENSITY_LABELS[density]})
            </Button>
          </div>

          {/* Default Category */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-300">Default Category</p>
              <p className="text-[11px] text-zinc-500">Category shown on feed load</p>
            </div>
            <select
              value={defaultCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="appearance-none bg-[rgba(12,13,20,0.72)] border border-[var(--primary-border)] text-zinc-300 text-xs rounded-lg px-3 py-1.5 cursor-pointer focus:outline-none focus:border-[var(--primary-muted)]"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
                <option key={slug} value={slug}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Data */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-300">Data</h2>
        </div>

        <div className="glass-card rounded-xl p-4 space-y-4">
          {/* Clear Watchlist */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-300">Watchlist</p>
              <p className="text-[11px] text-zinc-500">{watchedIds.length} events tracked</p>
            </div>
            <Button
              variant={confirmClearWatchlist ? 'destructive' : 'outline'}
              size="sm"
              onClick={handleClearWatchlist}
              disabled={watchedIds.length === 0}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {confirmClearWatchlist ? 'Confirm Clear' : 'Clear All'}
            </Button>
          </div>

          {/* Clear Alerts */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-300">Alerts</p>
              <p className="text-[11px] text-zinc-500">{alerts.length} alerts configured</p>
            </div>
            <Button
              variant={confirmClearAlerts ? 'destructive' : 'outline'}
              size="sm"
              onClick={handleClearAlerts}
              disabled={alerts.length === 0}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {confirmClearAlerts ? 'Confirm Clear' : 'Clear All'}
            </Button>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-300">About</h2>
        </div>

        <div className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Version</span>
            <span className="mono text-xs text-zinc-400">0.1.0-alpha</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Data Sources</span>
            <span className="mono text-xs text-zinc-400">Polymarket, Kalshi, Metaculus</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Theme</span>
            <span className="mono text-xs text-zinc-400">Dark (only)</span>
          </div>
        </div>
      </section>
    </div>
  )
}
