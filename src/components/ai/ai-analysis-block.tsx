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
      <div className="border-l-2 border-purple-500 pl-4 py-3">
        <p className="text-sm text-slate-400">AI analysis not yet generated for this event.</p>
      </div>
    )
  }

  return (
    <div className="border-l-2 border-purple-500 pl-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <span className="text-purple-400">✦</span> AI Analysis
        </h3>
        <Button variant="ghost" size="sm" onClick={onRefresh} className="text-slate-400 gap-1.5">
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>

      <p className="text-sm text-slate-300">{analysis.summary}</p>

      {analysis.key_drivers.length > 0 && (
        <ol className="text-sm text-slate-300 list-decimal list-inside space-y-1">
          {analysis.key_drivers.map((driver, i) => (
            <li key={i}>{driver}</li>
          ))}
        </ol>
      )}

      {updatedAt && (
        <p className="text-xs text-slate-500">Analysis as of {updatedAt}</p>
      )}
    </div>
  )
}
