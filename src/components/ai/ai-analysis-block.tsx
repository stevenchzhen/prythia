'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AIAnalysis {
  summary: string
  key_drivers: string[]
  key_dates: Array<{ date: string; description: string }>
  related_events: Array<{ id: string; title: string; probability: number }>
}

interface AIAnalysisBlockProps {
  analysis: AIAnalysis | null
  updatedAt: string | null
  onRefresh?: () => void
}

export function AIAnalysisBlock({ analysis, updatedAt, onRefresh }: AIAnalysisBlockProps) {
  if (!analysis) {
    return (
      <div className="border-l-2 border-[var(--primary-muted)] pl-4 py-3">
        <p className="text-[13px] text-zinc-600">AI analysis not yet generated for this event.</p>
      </div>
    )
  }

  return (
    <div className="border-l-2 border-[var(--primary-muted)] pl-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-medium flex items-center gap-1.5">
          <span className="text-[var(--primary-text)]">✦</span>
          <span className="text-zinc-400">AI Analysis</span>
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="text-zinc-600 hover:text-zinc-400 gap-1.5 h-7 text-xs"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>

      <p className="text-[13px] text-zinc-400 leading-relaxed">{analysis.summary}</p>

      {analysis.key_drivers.length > 0 && (
        <ol className="text-[13px] text-zinc-500 list-decimal list-inside space-y-1">
          {analysis.key_drivers.map((driver, i) => (
            <li key={i}>{driver}</li>
          ))}
        </ol>
      )}

      {updatedAt && (
        <p className="mono text-[11px] uppercase tracking-[0.16em] text-zinc-700">
          Analysis as of {updatedAt}
        </p>
      )}
    </div>
  )
}
