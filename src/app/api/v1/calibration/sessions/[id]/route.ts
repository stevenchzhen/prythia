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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scoreDecision(admin: any, decision: DecisionRow) {
  // 1. Find matching event using AI + search
  const searchTerm = decision.search_query || decision.description
  const { data: candidates } = await admin
    .from('events')
    .select('id, title, category, probability, resolution_status, resolution_date')
    .or('outcome_type.eq.binary,outcome_type.is.null')
    .is('parent_event_id', null)
    .textSearch('fts', searchTerm.split(' ').slice(0, 5).join(' '), { type: 'websearch' })
    .limit(5)

  // 2. Get probability snapshots near decision date
  let marketProb: number | null = null
  let prob7dBefore: number | null = null
  let prob30dAfter: number | null = null
  let matchedEventId: string | null = null
  let actualOutcome: string | null = null

  if (candidates && candidates.length > 0) {
    // Pick best match (first FTS result for now — could use Haiku for better matching)
    const match = candidates[0]
    matchedEventId = match.id
    actualOutcome = match.resolution_status !== 'open' ? match.resolution_status : null

    // Fetch probability at decision date
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

    marketProb = snapAtDate.data?.[0]?.probability ?? match.probability
    prob7dBefore = snapBefore.data?.[0]?.probability ?? null
    prob30dAfter = snapAfter.data?.[0]?.probability ?? null
  }

  // 3. Calculate scores
  let timingScore: number | null = null
  let directionScore: number | null = null
  let calibrationScore: number | null = null

  if (marketProb !== null) {
    // Timing score: was the decision made before or after the market moved?
    if (prob7dBefore !== null && prob30dAfter !== null) {
      const marketMovement = prob30dAfter - prob7dBefore
      const decisionTiming = marketProb - prob7dBefore
      // Positive if user decided before market moved, negative if after
      timingScore = marketMovement !== 0
        ? Math.max(-1, Math.min(1, 1 - decisionTiming / marketMovement))
        : 0
    }

    // Direction score: did the decision align with eventual outcome?
    if (actualOutcome === 'resolved_yes' || actualOutcome === 'resolved_no') {
      const outcomeValue = actualOutcome === 'resolved_yes' ? 1 : 0
      const decisionAligned = (
        (decision.decision_type === 'hedge' && marketProb > 0.5) ||
        (decision.decision_type === 'expand' && marketProb < 0.5) ||
        (decision.decision_type === 'hold')
      ) ? 1 : 0
      directionScore = decisionAligned === outcomeValue ? 1 : 0
    }

    // Calibration score: how close was the market probability to the outcome?
    calibrationScore = timingScore !== null
      ? Math.max(0, (1 + timingScore) / 2)
      : marketProb !== null ? 1 - Math.abs(marketProb - 0.5) : null
  }

  // 4. Generate AI analysis
  let analysis: string | null = null
  if (marketProb !== null && matchedEventId) {
    try {
      const messages: Message[] = [{
        role: 'user',
        content: `Analyze this business decision against prediction market data. Be concise (2-3 sentences).

Decision: "${decision.description}" (${decision.decision_type}, ${decision.decision_date})
Market probability at decision time: ${(marketProb * 100).toFixed(0)}%
${prob7dBefore !== null ? `Market 7 days before: ${(prob7dBefore * 100).toFixed(0)}%` : ''}
${prob30dAfter !== null ? `Market 30 days after: ${(prob30dAfter * 100).toFixed(0)}%` : ''}
${actualOutcome ? `Outcome: ${actualOutcome}` : 'Still open'}
${timingScore !== null ? `Timing score: ${timingScore.toFixed(2)} (-1 late, +1 early)` : ''}

Was this well-timed? What could improve next time?`,
      }]

      const response = await queryFast(messages, { maxTokens: 150, temperature: 0.3 })
      const parsed = await parseResponse(response)
      analysis = parsed.text.trim()
    } catch {
      // AI analysis is optional — continue without it
    }
  }

  // 5. Update the decision row
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
