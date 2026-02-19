'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, Monitor, Database, Info, Trash2, User, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDensity, type Density } from '@/hooks/use-density'
import { useWatchlist } from '@/hooks/use-watchlist'
import { useAlerts } from '@/hooks/use-alerts'
import { CATEGORY_LABELS } from '@/lib/constants'

const DENSITY_LABELS: Record<Density, string> = {
  compact: 'Compact',
  default: 'Default',
  expanded: 'Expanded',
}

const INDUSTRIES = [
  'logistics',
  'ecommerce',
  'finance',
  'manufacturing',
  'healthcare',
  'energy',
  'technology',
  'consulting',
  'agriculture',
  'retail',
  'other',
]

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

  // Profile state
  const [industry, setIndustry] = useState('')
  const [role, setRole] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')
  const [keyConcerns, setKeyConcerns] = useState<string[]>([])
  const [concernInput, setConcernInput] = useState('')
  const [profileCompleted, setProfileCompleted] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Load profile
  useEffect(() => {
    fetch('/api/v1/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setIndustry(d.data.industry ?? '')
          setRole(d.data.role ?? '')
          setCompanyDescription(d.data.company_description ?? '')
          setKeyConcerns(d.data.key_concerns ?? [])
          setProfileCompleted(!!d.data.profile_completed_at)
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false))
  }, [])

  const saveProfile = useCallback(async () => {
    setProfileSaving(true)
    try {
      await fetch('/api/v1/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: industry || null,
          role: role || null,
          company_description: companyDescription || null,
          key_concerns: keyConcerns,
        }),
      })
      setProfileCompleted(true)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } finally {
      setProfileSaving(false)
    }
  }, [industry, role, companyDescription, keyConcerns])

  const addConcern = () => {
    const concern = concernInput.trim()
    if (concern && !keyConcerns.includes(concern)) {
      setKeyConcerns([...keyConcerns, concern])
    }
    setConcernInput('')
  }

  const removeConcern = (concern: string) => {
    setKeyConcerns(keyConcerns.filter((c) => c !== concern))
  }

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

      {/* Business Profile */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-300">Business Profile</h2>
          </div>
          {profileCompleted ? (
            <span className="text-[10px] text-emerald-500 flex items-center gap-1">
              <Check className="h-3 w-3" /> Profile complete
            </span>
          ) : (
            <span className="text-[10px] text-amber-500">Set up for personalized AI</span>
          )}
        </div>

        <div className="glass-card rounded-xl p-4 space-y-4">
          {profileLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
            </div>
          ) : (
            <>
              {/* Industry */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full h-8 bg-[rgba(6,7,10,0.75)] border border-[var(--primary-border)] text-zinc-100 text-xs rounded-md px-2 focus:outline-none focus:border-[var(--primary-muted)]"
                >
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind.charAt(0).toUpperCase() + ind.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Role</label>
                <Input
                  placeholder="e.g. VP Operations, Founder, Procurement Lead"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-8 bg-[rgba(6,7,10,0.75)] border-[var(--primary-border)] text-zinc-100 text-xs placeholder:text-zinc-600"
                />
              </div>

              {/* Company Description */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Company Description</label>
                <textarea
                  placeholder="Brief description of your business..."
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-[rgba(6,7,10,0.75)] border border-[var(--primary-border)] text-zinc-100 text-xs placeholder:text-zinc-600 rounded-md px-3 py-2 resize-none focus:outline-none focus:border-[var(--primary-muted)]"
                />
              </div>

              {/* Key Concerns */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Key Concerns</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. tariffs, oil prices, interest rates"
                    value={concernInput}
                    onChange={(e) => setConcernInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addConcern())}
                    className="h-8 bg-[rgba(6,7,10,0.75)] border-[var(--primary-border)] text-zinc-100 text-xs placeholder:text-zinc-600"
                  />
                  <Button
                    onClick={addConcern}
                    variant="outline"
                    className="h-8 text-xs border-[var(--primary-border)] text-zinc-400 px-3"
                    disabled={!concernInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                {keyConcerns.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {keyConcerns.map((concern) => (
                      <span
                        key={concern}
                        className="inline-flex items-center gap-1 text-[11px] text-zinc-300 bg-[var(--primary-ghost)] rounded-full px-2.5 py-1"
                      >
                        {concern}
                        <button
                          onClick={() => removeConcern(concern)}
                          className="text-zinc-500 hover:text-red-400 transition"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Save */}
              <Button
                onClick={saveProfile}
                disabled={profileSaving}
                className="h-8 bg-[rgba(247,215,76,0.95)] text-black text-xs font-semibold disabled:opacity-50"
              >
                {profileSaving ? (
                  <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Saving...</>
                ) : profileSaved ? (
                  <><Check className="h-3 w-3 mr-1" /> Saved</>
                ) : (
                  'Save Profile'
                )}
              </Button>
            </>
          )}
        </div>
      </section>

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
