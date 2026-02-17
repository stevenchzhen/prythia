import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { queryFast, parseResponse } from '@/lib/ai/client'
import { buildEventAnalysisPrompt } from '@/lib/ai/prompts'
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
      .select('id, title, slug, probability, prob_change_24h, prob_change_7d, volume_24h, volume_total, source_count, resolution_status, resolution_date, ai_analysis_updated_at')
      .eq('is_active', true)
      .gte('volume_24h', MIN_VOLUME_FOR_AI_ANALYSIS)
      .order('volume_24h', { ascending: false })
      .limit(MAX_EVENTS_PER_RUN * 2) // fetch extra to filter stale ones

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
        // 3. Build event data string
        const eventData = [
          `Title: ${event.title}`,
          `Probability: ${((event.probability ?? 0) * 100).toFixed(1)}%`,
          `24h change: ${((event.prob_change_24h ?? 0) * 100).toFixed(1)}%`,
          `7d change: ${((event.prob_change_7d ?? 0) * 100).toFixed(1)}%`,
          `24h volume: $${(event.volume_24h ?? 0).toLocaleString()}`,
          `Total volume: $${(event.volume_total ?? 0).toLocaleString()}`,
          `Sources: ${event.source_count ?? 0}`,
          `Resolution status: ${event.resolution_status}`,
          event.resolution_date ? `Resolution date: ${event.resolution_date}` : null,
        ].filter(Boolean).join('\n')

        // 4. Call AI
        const response = await queryFast(
          [{ role: 'user', content: buildEventAnalysisPrompt(eventData) }],
          { maxTokens: 1500, temperature: 0.2 }
        )
        const { text } = await parseResponse(response)

        // 5. Parse into AIAnalysis shape
        const analysis = parseAnalysisText(text, event.id)

        // 6. Update event
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
        // Continue to next event
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

function parseAnalysisText(text: string, eventId: string): AIAnalysis {
  // Try to extract structured sections from the AI response
  const sections = text.split(/\n(?=\d+\.|#{1,3}\s)/)

  let summary = ''
  const keyDrivers: string[] = []
  const keyDates: Array<{ date: string; description: string }> = []
  const relatedEvents: Array<{ id: string; title: string; probability: number }> = []

  for (const section of sections) {
    const lower = section.toLowerCase()

    if (lower.includes('summary') || sections.indexOf(section) === 0) {
      // First section or one labeled "summary"
      if (!summary) {
        summary = section.replace(/^[\d.#\s]*summary[:\s]*/i, '').trim()
      }
    } else if (lower.includes('driver') || lower.includes('factor')) {
      const bullets = section.match(/[-•*]\s*.+/g) || section.match(/\d+\.\s*.+/g)
      if (bullets) {
        keyDrivers.push(...bullets.map((b) => b.replace(/^[-•*\d.]\s*/, '').trim()))
      }
    } else if (lower.includes('date') || lower.includes('catalyst') || lower.includes('deadline')) {
      const bullets = section.match(/[-•*]\s*.+/g) || section.match(/\d+\.\s*.+/g)
      if (bullets) {
        for (const b of bullets) {
          const clean = b.replace(/^[-•*\d.]\s*/, '').trim()
          // Try to extract a date-like pattern
          const dateMatch = clean.match(/(\w+\s+\d{1,2},?\s*\d{0,4}|\d{4}-\d{2}-\d{2})/)
          keyDates.push({
            date: dateMatch?.[1] ?? 'TBD',
            description: clean,
          })
        }
      }
    } else if (lower.includes('related')) {
      const bullets = section.match(/[-•*]\s*.+/g) || section.match(/\d+\.\s*.+/g)
      if (bullets) {
        for (const b of bullets) {
          const clean = b.replace(/^[-•*\d.]\s*/, '').trim()
          relatedEvents.push({
            id: eventId, // self-reference as placeholder
            title: clean,
            probability: 0,
          })
        }
      }
    }
  }

  // Fallback: if parsing didn't extract structured data, use raw text
  if (!summary) {
    summary = text.slice(0, 500)
  }

  return { summary, key_drivers: keyDrivers, key_dates: keyDates, related_events: relatedEvents }
}
