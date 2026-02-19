import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { queryFast, parseResponse } from '@/lib/ai/client'
import { buildSystemPrompt } from '@/lib/ai/prompts'
import type { AIAnalysis } from '@/lib/types'

const MIN_VOLUME_FOR_AI_ANALYSIS = 100_000 // $100K
const MAX_EVENTS_PER_RUN = 20
const ANALYSIS_STALENESS_HOURS = 24

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const staleThreshold = new Date(Date.now() - ANALYSIS_STALENESS_HOURS * 60 * 60 * 1000).toISOString()

    // 1. Query active events with sufficient volume
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, slug, description, category, subcategory, probability, prob_change_24h, prob_change_7d, prob_change_30d, prob_high_30d, prob_low_30d, volume_24h, volume_total, liquidity_total, trader_count, source_count, quality_score, resolution_status, resolution_date, resolution_criteria, ai_analysis_updated_at')
      .eq('is_active', true)
      .is('parent_event_id', null)
      .or('outcome_type.eq.binary,outcome_type.is.null')
      .gte('volume_24h', MIN_VOLUME_FOR_AI_ANALYSIS)
      .order('volume_24h', { ascending: false })
      .limit(MAX_EVENTS_PER_RUN * 2)

    if (eventsError) throw eventsError
    if (!events || events.length === 0) {
      return NextResponse.json({ success: true, events_analyzed: 0, timestamp: new Date().toISOString() })
    }

    // 2. Filter: skip recently analyzed events
    const staleEvents = events.filter(
      (e) => !e.ai_analysis_updated_at || e.ai_analysis_updated_at < staleThreshold
    ).slice(0, MAX_EVENTS_PER_RUN)

    let eventsAnalyzed = 0

    for (const event of staleEvents) {
      try {
        // 3. Fetch enrichment data in parallel
        const [sourcesResult, snapshotsResult, dailyStatsResult] = await Promise.all([
          // Per-platform source contracts
          supabase
            .from('source_contracts')
            .select('platform, contract_title, price, volume_24h, volume_total, liquidity, num_traders, last_trade_at')
            .eq('event_id', event.id)
            .eq('is_active', true),

          // Recent probability snapshots (last 7 days, sampled)
          supabase
            .from('probability_snapshots')
            .select('source, captured_at, probability, volume, liquidity')
            .eq('event_id', event.id)
            .gte('captured_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('captured_at', { ascending: false })
            .limit(100),

          // Daily OHLC stats (last 30 days)
          supabase
            .from('daily_stats')
            .select('date, prob_open, prob_close, prob_high, prob_low, volume_total, trader_count')
            .eq('event_id', event.id)
            .order('date', { ascending: false })
            .limit(30),
        ])

        const sources = sourcesResult.data ?? []
        const snapshots = snapshotsResult.data ?? []
        const dailyStats = dailyStatsResult.data ?? []

        // 4. Build rich context
        const eventData = buildEventContext(event, sources, snapshots, dailyStats)

        // 5. Call AI with structured output request
        const response = await queryFast(
          [{ role: 'user', content: buildAnalysisPrompt(eventData) }],
          { system: buildSystemPrompt(), maxTokens: 2000, temperature: 0.2 }
        )
        const { text } = await parseResponse(response)

        // 6. Parse structured JSON response
        const analysis = parseAnalysisResponse(text, event.id)

        // 7. Update event
        await supabase
          .from('events')
          .update({
            ai_analysis: analysis,
            ai_analysis_updated_at: new Date().toISOString(),
          })
          .eq('id', event.id)

        eventsAnalyzed++
      } catch (err) {
        console.error(`AI analysis failed for event ${event.id}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      events_analyzed: eventsAnalyzed,
      events_skipped: events.length - staleEvents.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
  }
}

// ─── Context Builder ────────────────────────────────────────────────

interface SourceRow {
  platform: string
  contract_title: string | null
  price: number | null
  volume_24h: number | null
  volume_total: number | null
  liquidity: number | null
  num_traders: number | null
  last_trade_at: string | null
}

interface SnapshotRow {
  source: string
  captured_at: string
  probability: number
  volume: number | null
  liquidity: number | null
}

interface DailyStatRow {
  date: string
  prob_open: number | null
  prob_close: number | null
  prob_high: number | null
  prob_low: number | null
  volume_total: number | null
  trader_count: number | null
}

function buildEventContext(
  event: Record<string, unknown>,
  sources: SourceRow[],
  snapshots: SnapshotRow[],
  dailyStats: DailyStatRow[]
): string {
  const prob = (v: unknown) => v != null ? ((Number(v) || 0) * 100).toFixed(1) + '%' : 'N/A'
  const usd = (v: unknown) => v != null ? '$' + Number(v).toLocaleString() : 'N/A'

  const lines: string[] = []

  // Core event info
  lines.push('=== EVENT ===')
  lines.push(`Title: ${event.title}`)
  if (event.description) lines.push(`Description: ${String(event.description).slice(0, 200)}`)
  lines.push(`Category: ${event.category}${event.subcategory ? ' > ' + event.subcategory : ''}`)
  lines.push(`Resolution: ${event.resolution_status}${event.resolution_date ? ' (due: ' + event.resolution_date + ')' : ''}`)
  if (event.resolution_criteria) lines.push(`Criteria: ${String(event.resolution_criteria).slice(0, 200)}`)
  lines.push('')

  // Aggregated metrics
  lines.push('=== AGGREGATED METRICS ===')
  lines.push(`Current probability: ${prob(event.probability)}`)
  lines.push(`24h change: ${prob(event.prob_change_24h)} | 7d change: ${prob(event.prob_change_7d)} | 30d change: ${prob(event.prob_change_30d)}`)
  lines.push(`30d range: ${prob(event.prob_low_30d)} – ${prob(event.prob_high_30d)}`)
  lines.push(`24h volume: ${usd(event.volume_24h)} | Total volume: ${usd(event.volume_total)}`)
  lines.push(`Liquidity: ${usd(event.liquidity_total)} | Traders: ${event.trader_count ?? 'N/A'}`)
  lines.push(`Sources: ${event.source_count ?? 0} | Quality: ${event.quality_score ?? 'N/A'}`)
  lines.push('')

  // Per-platform breakdown
  if (sources.length > 0) {
    lines.push('=== PLATFORM BREAKDOWN ===')
    for (const s of sources) {
      lines.push(`${s.platform}: price=${prob(s.price)}, vol_24h=${usd(s.volume_24h)}, total=${usd(s.volume_total)}, liquidity=${usd(s.liquidity)}, traders=${s.num_traders ?? 'N/A'}`)
    }

    // Cross-platform divergence
    const prices = sources.filter(s => s.price != null).map(s => Number(s.price))
    if (prices.length >= 2) {
      const spread = (Math.max(...prices) - Math.min(...prices)) * 100
      lines.push(`Cross-platform spread: ${spread.toFixed(1)}pp`)
    }
    lines.push('')
  }

  // Daily price history (last 30 days OHLC)
  if (dailyStats.length > 0) {
    lines.push('=== DAILY PRICE HISTORY (recent first) ===')
    for (const d of dailyStats.slice(0, 14)) {
      lines.push(`${d.date}: open=${prob(d.prob_open)} close=${prob(d.prob_close)} high=${prob(d.prob_high)} low=${prob(d.prob_low)} vol=${usd(d.volume_total)}`)
    }
    if (dailyStats.length > 14) {
      lines.push(`... and ${dailyStats.length - 14} more days`)
    }
    lines.push('')
  }

  // Recent probability snapshots — show per-source trends
  if (snapshots.length > 0) {
    lines.push('=== RECENT SNAPSHOTS (per-source, last 7 days) ===')
    const bySource = new Map<string, SnapshotRow[]>()
    for (const s of snapshots) {
      const arr = bySource.get(s.source) ?? []
      arr.push(s)
      bySource.set(s.source, arr)
    }
    for (const [source, rows] of bySource) {
      const latest = rows[0]
      const oldest = rows[rows.length - 1]
      const trend = Number(latest.probability) - Number(oldest.probability)
      const trendStr = trend > 0 ? `+${(trend * 100).toFixed(1)}pp` : `${(trend * 100).toFixed(1)}pp`
      lines.push(`${source}: latest=${prob(latest.probability)}, 7d trend=${trendStr}, ${rows.length} snapshots`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

// ─── Prompt ─────────────────────────────────────────────────────────

function buildAnalysisPrompt(eventData: string): string {
  return `Analyze the following prediction market event using ALL the data provided — the aggregated metrics, per-platform prices, daily OHLC history, and probability snapshots.

Your analysis should be data-driven and cite specific numbers. Respond in valid JSON with this exact structure:

{
  "summary": "2-3 sentence analysis of what the market is pricing and the current trend. Cite specific probabilities and platform data.",
  "key_drivers": ["driver 1 with supporting data", "driver 2", "driver 3"],
  "key_dates": [{"date": "YYYY-MM-DD or description", "description": "what happens and why it matters"}],
  "related_events": [{"title": "event name", "relationship": "how it connects"}]
}

Guidelines:
- In the summary, note if platforms disagree (price divergence) and what the trend direction is
- For key_drivers, identify what the actual price movements suggest — sudden shifts, steady trends, volume spikes
- For key_dates, extract from resolution dates, known catalysts, or inflection points visible in the price history
- For related_events, infer from the category, title, and resolution criteria what other markets are correlated
- If the 30d range is narrow, note that the market is confident; if wide, note uncertainty
- Cross-reference volume spikes with price movements — big volume + big move = conviction signal

Event data:
${eventData}`
}

// ─── Response Parser ────────────────────────────────────────────────

function parseAnalysisResponse(text: string, eventId: string): AIAnalysis {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        summary: String(parsed.summary || ''),
        key_drivers: Array.isArray(parsed.key_drivers) ? parsed.key_drivers.map(String) : [],
        key_dates: Array.isArray(parsed.key_dates)
          ? parsed.key_dates.map((d: Record<string, string>) => ({
              date: String(d.date || 'TBD'),
              description: String(d.description || d.relationship || ''),
            }))
          : [],
        related_events: Array.isArray(parsed.related_events)
          ? parsed.related_events.map((r: Record<string, unknown>) => ({
              id: eventId,
              title: String(r.title || ''),
              probability: 0,
            }))
          : [],
      }
    } catch {
      // JSON parse failed, fall through to text parsing
    }
  }

  // Fallback: use raw text as summary
  return {
    summary: text.slice(0, 500),
    key_drivers: [],
    key_dates: [],
    related_events: [],
  }
}
