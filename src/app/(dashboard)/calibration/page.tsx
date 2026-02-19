'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import {
  Target,
  Plus,
  Trash2,
  ChevronRight,
  TrendingUp,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface CalibrationSession {
  id: string
  name: string
  description: string | null
  status: 'pending' | 'processing' | 'complete' | 'error'
  total_decisions: number
  avg_calibration_score: number | null
  created_at: string
  completed_at: string | null
}

interface CalibrationDecision {
  id: string
  decision_date: string
  decision_type: string
  description: string
  matched_event_id: string | null
  market_probability: number | null
  timing_score: number | null
  direction_score: number | null
  calibration_score: number | null
  analysis: string | null
}

interface SessionDetail extends CalibrationSession {
  decisions: CalibrationDecision[]
}

export default function CalibrationPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [activeSession, setActiveSession] = useState<string | null>(null)

  const { data: sessionsData } = useSWR<{ data: CalibrationSession[] }>(
    '/api/v1/calibration/sessions',
    fetcher
  )
  const sessions = sessionsData?.data ?? []

  const { data: sessionDetail } = useSWR<{ data: SessionDetail }>(
    activeSession ? `/api/v1/calibration/sessions/${activeSession}` : null,
    fetcher
  )

  const { data: curvesData } = useSWR<{ data: Array<{ prob_bucket: number; actual_rate: number; sample_count: number }> }>(
    '/api/v1/calibration/curves',
    fetcher
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-[var(--primary-text)]" />
            PryCalibration
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Score your past decisions against what prediction markets knew
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="h-8 bg-[rgba(247,215,76,0.95)] text-black text-xs font-semibold hover:translate-y-[-0.5px] glow-soft"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          New Session
        </Button>
      </div>

      {/* Market Calibration Curve */}
      {curvesData?.data && curvesData.data.length > 0 && (
        <section className="glass-card rounded-xl p-5">
          <h2 className="text-sm font-medium text-zinc-300 mb-4">
            Market Calibration Curve
          </h2>
          <p className="text-xs text-zinc-500 mb-4">
            When markets say X% likely, how often does it actually happen?
          </p>
          <div className="flex items-end gap-1 h-40">
            {curvesData.data.map((bucket) => {
              const height = Math.max(bucket.actual_rate * 100, 2)
              const expected = bucket.prob_bucket * 100
              const isCalibrated = Math.abs(bucket.actual_rate - bucket.prob_bucket) < 0.1
              return (
                <div
                  key={bucket.prob_bucket}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="relative w-full flex justify-center">
                    {/* Expected (perfect calibration line) */}
                    <div
                      className="absolute w-full border-t border-dashed border-zinc-600"
                      style={{ bottom: `${expected}%` }}
                    />
                    {/* Actual bar */}
                    <div
                      className={`w-full max-w-8 rounded-t transition-all ${
                        isCalibrated ? 'bg-emerald-500/60' : 'bg-[rgba(247,215,76,0.5)]'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="mono text-[9px] text-zinc-600">
                    {(bucket.prob_bucket * 100).toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-600">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-emerald-500/60" /> Well calibrated
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-[rgba(247,215,76,0.5)]" /> Miscalibrated
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-3 border-t border-dashed border-zinc-600" /> Perfect
            </span>
          </div>
        </section>
      )}

      {/* Create Session Form */}
      {showCreate && (
        <CreateSessionForm
          onCreated={(id) => {
            setShowCreate(false)
            setActiveSession(id)
            mutate('/api/v1/calibration/sessions')
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Sessions List */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-400">Your Sessions</h2>
        {sessions.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <Target className="mx-auto h-8 w-8 text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-500">No calibration sessions yet</p>
            <p className="text-xs text-zinc-600 mt-1">
              Create one to score your past decisions against market data
            </p>
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveSession(s.id === activeSession ? null : s.id)}
              className="glass-card rounded-xl p-4 cursor-pointer hover:border-[var(--primary-muted)] transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-white">{s.name}</h3>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {s.total_decisions} decision{s.total_decisions !== 1 ? 's' : ''}
                    {s.avg_calibration_score !== null && (
                      <> &middot; Score: <span className="text-[var(--primary-text)]">{(s.avg_calibration_score * 100).toFixed(0)}%</span></>
                    )}
                  </p>
                </div>
                <ChevronRight className={`h-4 w-4 text-zinc-600 transition-transform ${activeSession === s.id ? 'rotate-90' : ''}`} />
              </div>

              {/* Expanded detail */}
              {activeSession === s.id && sessionDetail?.data && (
                <SessionDetailView
                  session={sessionDetail.data}
                  onScore={() => {
                    fetch(`/api/v1/calibration/sessions/${s.id}`, { method: 'POST' })
                      .then(() => {
                        mutate(`/api/v1/calibration/sessions/${s.id}`)
                        mutate('/api/v1/calibration/sessions')
                      })
                  }}
                  onDelete={() => {
                    fetch(`/api/v1/calibration/sessions/${s.id}`, { method: 'DELETE' })
                      .then(() => {
                        setActiveSession(null)
                        mutate('/api/v1/calibration/sessions')
                      })
                  }}
                />
              )}
            </div>
          ))
        )}
      </section>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'text-zinc-500 border-zinc-700',
    processing: 'text-yellow-500 border-yellow-500/30',
    complete: 'text-emerald-500 border-emerald-500/30',
    error: 'text-red-500 border-red-500/30',
  }
  return (
    <span className={`mono text-[9px] uppercase tracking-wider border rounded-full px-2 py-0.5 ${styles[status] || styles.pending}`}>
      {status}
    </span>
  )
}

function SessionDetailView({
  session,
  onScore,
  onDelete,
}: {
  session: SessionDetail
  onScore: () => void
  onDelete: () => void
}) {
  return (
    <div className="mt-4 pt-4 border-t border-[var(--primary-border)] space-y-3" onClick={(e) => e.stopPropagation()}>
      {session.status === 'pending' && (
        <Button
          onClick={onScore}
          className="h-7 bg-[rgba(247,215,76,0.95)] text-black text-xs font-semibold"
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          Score Decisions
        </Button>
      )}
      {session.status === 'processing' && (
        <div className="flex items-center gap-2 text-xs text-yellow-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          Scoring in progress...
        </div>
      )}

      {session.decisions.map((d) => (
        <div key={d.id} className="glass-nested rounded-lg p-3 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-white">{d.description}</p>
              <p className="mono text-[10px] text-zinc-600 mt-0.5">
                {d.decision_type} &middot; {d.decision_date}
              </p>
            </div>
            {d.calibration_score !== null && (
              <span className={`mono text-xs font-semibold ${d.calibration_score > 0.6 ? 'text-emerald-500' : d.calibration_score > 0.3 ? 'text-[var(--primary-text)]' : 'text-red-400'}`}>
                {(d.calibration_score * 100).toFixed(0)}%
              </span>
            )}
          </div>

          {d.market_probability !== null && (
            <div className="flex gap-4 text-[10px]">
              <span className="text-zinc-500">
                <Clock className="inline h-2.5 w-2.5 mr-0.5" />
                Market: {(d.market_probability * 100).toFixed(0)}%
              </span>
              {d.timing_score !== null && (
                <span className={d.timing_score > 0 ? 'text-emerald-500' : 'text-red-400'}>
                  Timing: {d.timing_score > 0 ? 'Early' : 'Late'}
                </span>
              )}
            </div>
          )}

          {d.analysis && (
            <p className="text-[11px] text-zinc-400 leading-relaxed">{d.analysis}</p>
          )}

          {!d.matched_event_id && d.calibration_score === null && (
            <p className="text-[10px] text-zinc-600 flex items-center gap-1">
              <AlertCircle className="h-2.5 w-2.5" />
              No matching event found — will try historical data
            </p>
          )}
        </div>
      ))}

      <button
        onClick={onDelete}
        className="flex items-center gap-1 text-[10px] text-red-400/60 hover:text-red-400 transition mt-2"
      >
        <Trash2 className="h-3 w-3" />
        Delete session
      </button>
    </div>
  )
}

function CreateSessionForm({
  onCreated,
  onCancel,
}: {
  onCreated: (id: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [decisions, setDecisions] = useState([
    { decision_date: '', decision_type: 'hedge', description: '', search_query: '' },
  ])
  const [loading, setLoading] = useState(false)

  const addDecision = () => {
    setDecisions([...decisions, { decision_date: '', decision_type: 'hedge', description: '', search_query: '' }])
  }

  const updateDecision = (idx: number, field: string, value: string) => {
    const updated = [...decisions]
    updated[idx] = { ...updated[idx], [field]: value }
    setDecisions(updated)
  }

  const removeDecision = (idx: number) => {
    if (decisions.length > 1) {
      setDecisions(decisions.filter((_, i) => i !== idx))
    }
  }

  const submit = async () => {
    if (!name || decisions.some((d) => !d.decision_date || !d.description)) return
    setLoading(true)
    try {
      const res = await fetch('/api/v1/calibration/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, decisions }),
      })
      const data = await res.json()
      if (data.data?.id) onCreated(data.data.id)
    } finally {
      setLoading(false)
    }
  }

  const DECISION_TYPES = [
    { value: 'hedge', label: 'Hedge' },
    { value: 'expand', label: 'Expand' },
    { value: 'contract', label: 'Contract' },
    { value: 'price_change', label: 'Price Change' },
    { value: 'supplier_switch', label: 'Supplier Switch' },
    { value: 'hold', label: 'Hold' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-medium text-white">New Calibration Session</h3>

      <Input
        placeholder="Session name (e.g., Q4 2025 Supply Chain Decisions)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-9 bg-[rgba(6,7,10,0.75)] border-[var(--primary-border)] text-zinc-100 text-sm placeholder:text-zinc-600"
      />

      {decisions.map((d, i) => (
        <div key={i} className="glass-nested rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="mono text-[10px] text-zinc-500">Decision {i + 1}</span>
            {decisions.length > 1 && (
              <button onClick={() => removeDecision(i)} className="text-zinc-600 hover:text-red-400">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={d.decision_date}
              onChange={(e) => updateDecision(i, 'decision_date', e.target.value)}
              className="h-8 bg-[rgba(6,7,10,0.75)] border-[var(--primary-border)] text-zinc-100 text-xs"
            />
            <select
              value={d.decision_type}
              onChange={(e) => updateDecision(i, 'decision_type', e.target.value)}
              className="h-8 bg-[rgba(6,7,10,0.75)] border border-[var(--primary-border)] text-zinc-100 text-xs rounded-md px-2"
            >
              {DECISION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <Input
            placeholder="What did you decide? (e.g., Switched supplier from China to Vietnam)"
            value={d.description}
            onChange={(e) => updateDecision(i, 'description', e.target.value)}
            className="h-8 bg-[rgba(6,7,10,0.75)] border-[var(--primary-border)] text-zinc-100 text-xs placeholder:text-zinc-600"
          />
          <Input
            placeholder="Related search (e.g., China tariffs 2025) — optional"
            value={d.search_query}
            onChange={(e) => updateDecision(i, 'search_query', e.target.value)}
            className="h-8 bg-[rgba(6,7,10,0.75)] border-[var(--primary-border)] text-zinc-100 text-xs placeholder:text-zinc-600"
          />
        </div>
      ))}

      <button
        onClick={addDecision}
        className="text-xs text-[var(--primary-text)] hover:underline"
      >
        + Add another decision
      </button>

      <div className="flex gap-2">
        <Button
          onClick={submit}
          disabled={loading || !name}
          className="h-8 bg-[rgba(247,215,76,0.95)] text-black text-xs font-semibold disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Session'}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="h-8 text-xs border-[var(--primary-border)] text-zinc-400"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
