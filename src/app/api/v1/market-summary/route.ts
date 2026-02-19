import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { queryFast, parseResponse, type Message } from '@/lib/ai/client'

// Minimum quality to exclude noise from market summary
const MIN_QUALITY_SCORE = 0.2

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    // Fetch top gainers and losers in parallel, filtered by quality
    const [{ data: gainers }, { data: losers }] = await Promise.all([
      supabase
        .from('events')
        .select('id, title, probability, prob_change_24h, volume_24h, category')
        .eq('is_active', true)
        .is('parent_event_id', null)
        .or('outcome_type.eq.binary,outcome_type.is.null')
        .not('prob_change_24h', 'is', null)
        .gt('prob_change_24h', 0)
        .gte('quality_score', MIN_QUALITY_SCORE)
        .order('prob_change_24h', { ascending: false })
        .limit(5),
      supabase
        .from('events')
        .select('id, title, probability, prob_change_24h, volume_24h, category')
        .eq('is_active', true)
        .is('parent_event_id', null)
        .or('outcome_type.eq.binary,outcome_type.is.null')
        .not('prob_change_24h', 'is', null)
        .lt('prob_change_24h', 0)
        .gte('quality_score', MIN_QUALITY_SCORE)
        .order('prob_change_24h', { ascending: true })
        .limit(5),
    ])

    if ((!gainers || gainers.length === 0) && (!losers || losers.length === 0)) {
      return NextResponse.json({ summary: null, events: [] })
    }

    const allMovers = [...(gainers ?? []), ...(losers ?? [])]

    const moversData = [
      'BIGGEST MOVERS (24h):',
      '',
      'Gainers:',
      ...(gainers ?? []).map(
        (e) =>
          `- ${e.title}: ${((e.probability ?? 0) * 100).toFixed(0)}% (${e.prob_change_24h! > 0 ? '+' : ''}${((e.prob_change_24h ?? 0) * 100).toFixed(1)}%) vol: $${(e.volume_24h ?? 0).toLocaleString()} [${e.category}]`
      ),
      '',
      'Losers:',
      ...(losers ?? []).map(
        (e) =>
          `- ${e.title}: ${((e.probability ?? 0) * 100).toFixed(0)}% (${((e.prob_change_24h ?? 0) * 100).toFixed(1)}%) vol: $${(e.volume_24h ?? 0).toLocaleString()} [${e.category}]`
      ),
    ].join('\n')

    const messages: Message[] = [
      {
        role: 'user',
        content: `You are a prediction market analyst writing a 2-3 sentence summary for a dashboard. Given the biggest 24-hour movers below, write a brief, insightful interpretation of what's driving these changes. Focus on the most significant moves and any patterns across categories. Be direct and specific — no filler.

${moversData}

Write 2-3 sentences max. No headers, no bullet points, no disclaimers. Just the insight.`,
      },
    ]

    const response = await queryFast(messages, {
      maxTokens: 200,
      temperature: 0.4,
    })
    const result = await parseResponse(response)

    return NextResponse.json({
      summary: result.text.trim(),
      events: allMovers.map((e) => ({
        id: e.id,
        title: e.title,
        probability: e.probability,
        prob_change_24h: e.prob_change_24h,
        volume_24h: e.volume_24h,
        category: e.category,
      })),
      generated_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Market summary error:', err)
    return NextResponse.json({ summary: null, events: [] })
  }
}
