'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import Link from 'next/link'
import {
  BookOpen,
  Plus,
  Trash2,
  Check,
  Search,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  LinkIcon,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DecisionWithEvents, DecisionType, Event } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const DECISION_TYPES: Array<{ value: DecisionType; label: string }> = [
  { value: 'hedge', label: 'Hedge' },
  { value: 'expand', label: 'Expand' },
  { value: 'contract', label: 'Contract' },
  { value: 'price_change', label: 'Price Change' },
  { value: 'supplier_switch', label: 'Supplier Switch' },
  { value: 'hold', label: 'Hold' },
  { value: 'hire', label: 'Hire' },
  { value: 'invest', label: 'Invest' },
  { value: 'launch', label: 'Launch' },
  { value: 'other', label: 'Other' },
]

const STATUS_TABS = [
  { value: 'active', label: 'Active' },
  { value: 'decided', label: 'Decided' },
  { value: 'all', label: 'All' },
] as const

export default function DecisionsPage() {
  const [statusFilter, setStatusFilter] = useState<'active' | 'decided' | 'all'>('active')
  const [showCreate, setShowCreate] = useState(false)
  const [decidingId, setDecidingId] = useState<string | null>(null)
  const [outcomeNotes, setOutcomeNotes] = useState('')
  const [linkingId, setLinkingId] = useState<string | null>(null)

  const { data, isLoading } = useSWR<{ data: DecisionWithEvents[] }>(
    `/api/v1/decisions?status=${statusFilter}`,
    fetcher
  )
  const decisions = data?.data ?? []

  const handleDelete = async (id: string) => {
    await fetch(`/api/v1/decisions/${id}`, { method: 'DELETE' })
    mutate(`/api/v1/decisions?status=${statusFilter}`)
  }

  const handleMarkDecided = async (id: string) => {
    await fetch(`/api/v1/decisions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'decided', outcome_notes: outcomeNotes }),
    })
    setDecidingId(null)
    setOutcomeNotes('')
    mutate(`/api/v1/decisions?status=${statusFilter}`)
  }

  const handleUnlinkEvent = async (decisionId: string, eventId: string) => {
    await fetch(`/api/v1/decisions/${decisionId}/links`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId }),
    })
    mutate(`/api/v1/decisions?status=${statusFilter}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[var(--primary-text)]" />
            Decision Journal
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Log decisions, track market signals, measure outcomes
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="h-8 bg-[rgba(247,215,76,0.95)] text-black text-xs font-semibold hover:translate-y-[-0.5px] glow-soft"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          New Decision
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-[var(--primary-subtle)] text-[rgba(247,215,76,0.9)]'
                : 'text-zinc-500 hover:bg-[var(--primary-ghost)] hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <CreateDecisionForm
          onCreated={() => {
            setShowCreate(false)
            mutate(`/api/v1/decisions?status=${statusFilter}`)
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Decision Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
        </div>
      ) : decisions.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-zinc-600 mb-3" />
          <p className="text-sm text-zinc-500">
            {statusFilter === 'all' ? 'No decisions yet' : `No ${statusFilter} decisions`}
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Log your first decision or ask Prythia AI to help
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map((d) => (
            <div key={d.id} className="glass-card rounded-xl p-4 space-y-3">
              {/* Decision header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-medium text-white">{d.title}</h3>
                    <TypeBadge type={d.decision_type} />
                    <StatusIndicator status={d.status} />
                    {d.deadline && (
                      <span className="mono text-[9px] text-zinc-500 border border-zinc-700 rounded-full px-2 py-0.5">
                        Due {d.deadline}
                      </span>
                    )}
                  </div>
                  {d.description && (
                    <p className="text-xs text-zinc-400">{d.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  {d.status === 'active' && (
                    <>
                      <button
                        onClick={() => setLinkingId(linkingId === d.id ? null : d.id)}
                        className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-[var(--primary-ghost)] transition"
                        title="Link event"
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDecidingId(decidingId === d.id ? null : d.id)}
                        className="p-1.5 rounded-md text-zinc-600 hover:text-emerald-400 hover:bg-[var(--primary-ghost)] transition"
                        title="Mark decided"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-[var(--primary-ghost)] transition"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Outcome notes for decided */}
              {d.status === 'decided' && d.outcome_notes && (
                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
                  <p className="text-[11px] text-emerald-400/80">{d.outcome_notes}</p>
                </div>
              )}

              {/* Mark decided form */}
              {decidingId === d.id && (
                <div className="rounded-lg bg-[rgba(6,7,10,0.5)] border border-[var(--primary-border)] p-3 space-y-2">
                  <p className="text-xs text-zinc-400">What was the outcome?</p>
                  <Input
                    placeholder="Outcome notes (optional)"
                    value={outcomeNotes}
                    onChange={(e) => setOutcomeNotes(e.target.value)}
                    className="h-8 bg-[rgba(6,7,10,0.75)] border-[var(--primary-border)] text-zinc-100 text-xs placeholder:text-zinc-600"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleMarkDecided(d.id)}
                      className="h-7 bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Mark Decided
                    </Button>
                    <Button
                      onClick={() => { setDecidingId(null); setOutcomeNotes('') }}
                      variant="outline"
                      className="h-7 text-xs border-[var(--primary-border)] text-zinc-400"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Link event search */}
              {linkingId === d.id && (
                <LinkEventSearch
                  decisionId={d.id}
                  onLinked={() => {
                    setLinkingId(null)
                    mutate(`/api/v1/decisions?status=${statusFilter}`)
                  }}
                  onCancel={() => setLinkingId(null)}
                />
              )}

              {/* Linked events */}
              {d.links && d.links.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">
                    Linked Events
                  </p>
                  {d.links.map((link) => {
                    if (!link.event) return null
                    const currentProb = link.event.probability
                    const linkedProb = link.prob_at_link
                    const delta = currentProb != null && linkedProb != null
                      ? currentProb - Number(linkedProb)
                      : null

                    return (
                      <div
                        key={link.id}
                        className="glass-nested rounded-lg px-3 py-2 flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/event/${link.event.id}`}
                            className="text-xs text-zinc-300 hover:text-[rgba(247,215,76,0.8)] transition truncate block"
                          >
                            {link.event.title}
                          </Link>
                          {link.relevance_note && (
                            <p className="text-[10px] text-zinc-600 mt-0.5 truncate">{link.relevance_note}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          {/* Current probability */}
                          <span className="mono text-xs text-zinc-300">
                            {currentProb != null ? `${(currentProb * 100).toFixed(1)}%` : 'N/A'}
                          </span>
                          {/* Delta from link time */}
                          {delta !== null && (
                            <span className={`flex items-center gap-0.5 mono text-[10px] ${delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                              {delta > 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : delta < 0 ? <ArrowDownRight className="h-2.5 w-2.5" /> : null}
                              was {(Number(linkedProb) * 100).toFixed(1)}%
                            </span>
                          )}
                          {/* 24h change */}
                          {link.event.prob_change_24h != null && (
                            <span className={`mono text-[10px] ${link.event.prob_change_24h > 0 ? 'text-emerald-400' : link.event.prob_change_24h < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                              24h: {link.event.prob_change_24h > 0 ? '+' : ''}{(link.event.prob_change_24h * 100).toFixed(1)}%
                            </span>
                          )}
                          {d.status === 'active' && (
                            <button
                              onClick={() => handleUnlinkEvent(d.id, link.event_id)}
                              className="text-zinc-700 hover:text-red-400 transition"
                              title="Unlink"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Tags */}
              {d.tags && d.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {d.tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-zinc-500 bg-[rgba(255,255,255,0.03)] rounded px-1.5 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TypeBadge({ type }: { type: DecisionType }) {
  const label = DECISION_TYPES.find((t) => t.value === type)?.label ?? type
  return (
    <span className="mono text-[9px] uppercase tracking-wider text-[var(--primary-text)] border border-[var(--primary-muted)] rounded-full px-2 py-0.5">
      {label}
    </span>
  )
}

function StatusIndicator({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'text-amber-500 border-amber-500/30',
    decided: 'text-emerald-500 border-emerald-500/30',
    archived: 'text-zinc-500 border-zinc-700',
  }
  return (
    <span className={`mono text-[9px] uppercase tracking-wider border rounded-full px-2 py-0.5 ${styles[status] || styles.active}`}>
      {status}
    </span>
  )
}

function CreateDecisionForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [decisionType, setDecisionType] = useState<DecisionType>('other')
  const [deadline, setDeadline] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      await fetch('/api/v1/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          decision_type: decisionType,
          deadline: deadline || null,
          tags,
        }),
      })
      onCreated()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-medium text-white">New Decision</h3>
      <Input
        placeholder="Decision title (e.g., Pre-order Q3 inventory)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="h-9 bg-[rgba(6,7,10,0.75)] border-[var(--primary-border)] text-zinc-100 text-sm placeholder:text-zinc-600"
      />
      <textarea
        placeholder="Description / context (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full bg-[rgba(6,7,10,0.75)] border border-[var(--primary-border)] text-zinc-100 text-xs placeholder:text-zinc-600 rounded-md px-3 py-2 resize-none focus:outline-none focus:border-[var(--primary-muted)]"
      />
      <div className="grid grid-cols-3 gap-2">
        <select
          value={decisionType}
          onChange={(e) => setDecisionType(e.target.value as DecisionType)}
          className="h-8 bg-[rgba(6,7,10,0.75)] border border-[var(--primary-border)] text-zinc-100 text-xs rounded-md px-2"
        >
          {DECISION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <Input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          placeholder="Deadline"
          className="h-8 bg-[rgba(6,7,10,0.75)] border-[var(--primary-border)] text-zinc-100 text-xs"
        />
        <Input
          placeholder="Tags (comma-separated)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="h-8 bg-[rgba(6,7,10,0.75)] border-[var(--primary-border)] text-zinc-100 text-xs placeholder:text-zinc-600"
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={submit}
          disabled={loading || !title.trim()}
          className="h-8 bg-[rgba(247,215,76,0.95)] text-black text-xs font-semibold disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Decision'}
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

function LinkEventSearch({
  decisionId,
  onLinked,
  onCancel,
}: {
  decisionId: string
  onLinked: () => void
  onCancel: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Pick<Event, 'id' | 'title' | 'probability' | 'category'>[]>([])
  const [searching, setSearching] = useState(false)
  const [linking, setLinking] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/v1/events?q=${encodeURIComponent(query)}&limit=5`)
      const data = await res.json()
      setResults(data.data ?? [])
    } finally {
      setSearching(false)
    }
  }

  const linkEvent = async (eventId: string) => {
    setLinking(true)
    try {
      await fetch(`/api/v1/decisions/${decisionId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      })
      onLinked()
    } finally {
      setLinking(false)
    }
  }

  return (
    <div className="rounded-lg bg-[rgba(6,7,10,0.5)] border border-[var(--primary-border)] p-3 space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Search events to link..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          className="h-8 bg-[rgba(6,7,10,0.75)] border-[var(--primary-border)] text-zinc-100 text-xs placeholder:text-zinc-600"
        />
        <Button
          onClick={search}
          disabled={searching || !query.trim()}
          variant="outline"
          className="h-8 text-xs border-[var(--primary-border)] text-zinc-400"
        >
          {searching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="h-8 text-xs border-[var(--primary-border)] text-zinc-400"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((evt) => (
            <button
              key={evt.id}
              onClick={() => linkEvent(evt.id)}
              disabled={linking}
              className="w-full text-left flex items-center justify-between rounded-lg px-2.5 py-2 hover:bg-[var(--primary-ghost)] transition"
            >
              <div className="min-w-0">
                <p className="text-xs text-zinc-300 truncate">{evt.title}</p>
                <p className="text-[10px] text-zinc-600">{evt.category}</p>
              </div>
              <span className="mono text-xs text-zinc-400 flex-shrink-0 ml-2">
                {evt.probability != null ? `${(evt.probability * 100).toFixed(1)}%` : 'N/A'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
