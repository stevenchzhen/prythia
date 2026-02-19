import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { queryFast, parseResponse, type Message } from '@/lib/ai/client'

// GET: fetch session with all decisions and scores
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  const { data: session, error: sErr } = await admin
    .from('calibration_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (sErr || !session) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Session not found' } }, { status: 404 })
  }

  const { data: decisions } = await admin
    .from('calibration_decisions')
    .select('*')
    .eq('session_id', id)
    .order('decision_date', { ascending: true })

  return NextResponse.json({ data: { ...session, decisions: decisions ?? [] } })
}

// POST: trigger scoring for a session (matches decisions to events, scores timing)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  // Verify ownership
  const { data: session } = await admin
    .from('calibration_sessions')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Session not found' } }, { status: 404 })
  }

  // Update status to processing
  await admin
    .from('calibration_sessions')
    .update({ status: 'processing' })
    .eq('id', id)

  // Fetch decisions
  const { data: decisions } = await admin
    .from('calibration_decisions')
    .select('*')
    .eq('session_id', id)
    .order('decision_date', { ascending: true })

  if (!decisions || decisions.length === 0) {
    await admin.from('calibration_sessions').update({ status: 'complete', avg_calibration_score: 0 }).eq('id', id)
    return NextResponse.json({ data: { scored: 0 } })
  }

  // Score all decisions in parallel (each does FTS + snapshot queries + AI analysis)
  const results = await Promise.allSettled(
    decisions.map((decision) => scoreDecision(admin, decision))
  )

  let totalScore = 0
  let scoredCount = 0
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === 'fulfilled' && r.value.calibration_score !== null) {
      totalScore += r.value.calibration_score
      scoredCount++
    } else if (r.status === 'rejected') {
      console.error(`Failed to score decision ${decisions[i].id}:`, r.reason)
    }
  }

  // Update session with results
  const avgScore = scoredCount > 0 ? totalScore / scoredCount : null
  await admin
    .from('calibration_sessions')
    .update({
      status: 'complete',
      avg_calibration_score: avgScore,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)

  return NextResponse.json({ data: { scored: scoredCount, avg_calibration_score: avgScore } })
}

// DELETE: remove a session and its decisions
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const { error } = await admin
    .from('calibration_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: { code: 'DELETE_ERROR', message: error.message } }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// ─── Scoring Logic ───

interface DecisionRow {
  id: string
  decision_date: string
  decision_type: string
  description: string
  event_category: string | null
  search_query: string | null
}

/**
 * Verify whether an event is a genuine match for a business decision using Haiku.
 * Returns a confidence score 0-1, or null if verification fails.
 */
async function verifyEventMatch(
  decisionDescription: string,
  decisionType: string,
  eventTitle: string,
): Promise<boolean> {
  try {
    const messages: Message[] = [{
      role: 'user',
      content: `Is this prediction market event relevant to scoring this business decision? The event must directly relate to the decision's risk, opportunity, or outcome.

Decision: "${decisionDescription}" (type: ${decisionType})
Event: "${eventTitle}"

Reply with only YES or NO.`,
    }]
    const response = await queryFast(messages, { maxTokens: 3, temperature: 0 })
    const parsed = await parseResponse(response)
    return parsed.text.trim().toUpperCase().startsWith('YES')
  } catch {
    return false
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scoreDecision(admin: any, decision: DecisionRow) {
  // 1. Find matching event — search with FTS, then verify top candidates with Haiku
  const searchTerm = decision.search_query || decision.description
  const { data: candidates } = await admin
    .from('events')
    .select('id, title, category, probability, resolution_status, resolution_date')
    .or('outcome_type.eq.binary,outcome_type.is.null')
    .is('parent_event_id', null)
    .textSearch('fts', searchTerm.split(' ').slice(0, 5).join(' '), { type: 'websearch' })
    .limit(5)

  // 2. Verify each candidate with Haiku — take the first verified match
  let matchedEventId: string | null = null
  let match: (typeof candidates)[0] | null = null

  if (candidates && candidates.length > 0) {
    for (const candidate of candidates) {
      const verified = await verifyEventMatch(
        decision.description,
        decision.decision_type,
        candidate.title,
      )
      if (verified) {
        match = candidate
        matchedEventId = candidate.id
        break
      }
    }
  }

  // If no verified match, update with null scores and exit early
  if (!match || !matchedEventId) {
    await admin
      .from('calibration_decisions')
      .update({
        matched_event_id: null,
        market_probability: null,
        market_prob_7d_before: null,
        market_prob_30d_after: null,
        actual_outcome: null,
        timing_score: null,
        direction_score: null,
        calibration_score: null,
        analysis: 'No matching prediction market event found for this decision.',
      })
      .eq('id', decision.id)
    return { calibration_score: null }
  }

  const actualOutcome = match.resolution_status !== 'open' ? match.resolution_status : null

  // 3. Get probability snapshots near decision date
  const decDate = new Date(decision.decision_date)
  const before7d = new Date(decDate.getTime() - 7 * 24 * 60 * 60 * 1000)
  const after30d = new Date(decDate.getTime() + 30 * 24 * 60 * 60 * 1000)

  const [snapAtDate, snapBefore, snapAfter] = await Promise.all([
    admin
      .from('probability_snapshots')
      .select('probability')
      .eq('event_id', match.id)
      .eq('source', 'aggregated')
      .lte('captured_at', decDate.toISOString())
      .order('captured_at', { ascending: false })
      .limit(1),
    admin
      .from('probability_snapshots')
      .select('probability')
      .eq('event_id', match.id)
      .eq('source', 'aggregated')
      .lte('captured_at', before7d.toISOString())
      .order('captured_at', { ascending: false })
      .limit(1),
    admin
      .from('probability_snapshots')
      .select('probability')
      .eq('event_id', match.id)
      .eq('source', 'aggregated')
      .lte('captured_at', after30d.toISOString())
      .order('captured_at', { ascending: false })
      .limit(1),
  ])

  const marketProb: number | null = snapAtDate.data?.[0]?.probability ?? match.probability
  const prob7dBefore: number | null = snapBefore.data?.[0]?.probability ?? null
  const prob30dAfter: number | null = snapAfter.data?.[0]?.probability ?? null

  // 4. Calculate scores
  let timingScore: number | null = null
  let directionScore: number | null = null
  let calibrationScore: number | null = null

  if (marketProb !== null) {
    // Timing score: how early was this decision relative to the market's 37-day window?
    if (prob7dBefore !== null && prob30dAfter !== null) {
      const marketMovement = prob30dAfter - prob7dBefore
      const decisionTiming = marketProb - prob7dBefore
      timingScore = marketMovement !== 0
        ? Math.max(-1, Math.min(1, 1 - decisionTiming / marketMovement))
        : 0
    }

    // Direction score: did the decision type align with the market signal?
    // "hedge" = protecting against a risk → good if market confirmed the risk (prob went up)
    // "expand" = seizing an opportunity → good if market confirmed favorable conditions (prob went down, risk receded)
    // "contract" = reducing exposure → good if market confirmed deterioration (prob went up)
    // For resolved events, use the actual outcome. For open events, use 30d-after trajectory.
    const probAfter = actualOutcome === 'resolved_yes' ? 1
      : actualOutcome === 'resolved_no' ? 0
      : prob30dAfter

    if (probAfter !== null && marketProb !== null) {
      const marketMoved = probAfter - marketProb
      const riskTypes = ['hedge', 'contract', 'supplier_switch']
      const opportunityTypes = ['expand', 'invest', 'launch', 'hire']

      if (riskTypes.includes(decision.decision_type)) {
        // Risk-mitigating decision: correct if the risk materialized (market moved up)
        directionScore = marketMoved > 0.02 ? 1 : marketMoved < -0.02 ? 0 : 0.5
      } else if (opportunityTypes.includes(decision.decision_type)) {
        // Opportunity-seizing decision: correct if conditions improved (market risk went down)
        directionScore = marketMoved < -0.02 ? 1 : marketMoved > 0.02 ? 0 : 0.5
      } else {
        // hold, price_change, other: score based on market stability
        directionScore = Math.abs(marketMoved) < 0.05 ? 1 : 0.5
      }
    }

    // Calibration score: combine timing + direction when both are available.
    // When only one signal exists, use it directly. When neither exists, return null.
    if (timingScore !== null && directionScore !== null) {
      calibrationScore = Math.max(0, ((1 + timingScore) / 2) * 0.6 + directionScore * 0.4)
    } else if (timingScore !== null) {
      calibrationScore = Math.max(0, (1 + timingScore) / 2)
    } else if (directionScore !== null) {
      calibrationScore = directionScore
    }
    // else: calibrationScore stays null — we don't guess
  }

  // 5. Generate AI analysis
  let analysis: string | null = null
  if (marketProb !== null && matchedEventId) {
    try {
      const messages: Message[] = [{
        role: 'user',
        content: `Analyze this business decision against prediction market data. Be concise (2-3 sentences).

Decision: "${decision.description}" (${decision.decision_type}, ${decision.decision_date})
Matched event: "${match.title}"
Market probability at decision time: ${(marketProb * 100).toFixed(0)}%
${prob7dBefore !== null ? `Market 7 days before: ${(prob7dBefore * 100).toFixed(0)}%` : ''}
${prob30dAfter !== null ? `Market 30 days after: ${(prob30dAfter * 100).toFixed(0)}%` : ''}
${actualOutcome ? `Outcome: ${actualOutcome}` : 'Still open'}
${timingScore !== null ? `Timing score: ${timingScore.toFixed(2)} (-1 late, +1 early)` : ''}
${directionScore !== null ? `Direction score: ${directionScore.toFixed(1)} (1=aligned, 0=misaligned)` : ''}

Was this well-timed? Did the decision type align with market signals?`,
      }]

      const response = await queryFast(messages, { maxTokens: 150, temperature: 0.3 })
      const parsed = await parseResponse(response)
      analysis = parsed.text.trim()
    } catch {
      analysis = 'Analysis unavailable — AI service error.'
    }
  }

  // 6. Update the decision row
  await admin
    .from('calibration_decisions')
    .update({
      matched_event_id: matchedEventId,
      market_probability: marketProb,
      market_prob_7d_before: prob7dBefore,
      market_prob_30d_after: prob30dAfter,
      actual_outcome: actualOutcome,
      timing_score: timingScore,
      direction_score: directionScore,
      calibration_score: calibrationScore,
      analysis,
    })
    .eq('id', decision.id)

  return { calibration_score: calibrationScore }
}
