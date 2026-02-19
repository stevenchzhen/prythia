import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// GET: list user's calibration sessions
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const { data: sessions, error } = await admin
    .from('calibration_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: { code: 'QUERY_ERROR', message: error.message } }, { status: 500 })
  }

  return NextResponse.json({ data: sessions ?? [] })
}

// POST: create a new calibration session with decisions
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, decisions } = body as {
    name: string
    description?: string
    decisions: Array<{
      decision_date: string
      decision_type: string
      description: string
      event_category?: string
      search_query?: string
    }>
  }

  if (!name || !decisions || decisions.length === 0) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'Name and at least one decision required' } },
      { status: 400 }
    )
  }

  const admin = getSupabaseAdmin()

  // Create session
  const { data: session, error: sessionError } = await admin
    .from('calibration_sessions')
    .insert({
      user_id: user.id,
      name,
      description: description || null,
      total_decisions: decisions.length,
      status: 'pending',
    })
    .select()
    .single()

  if (sessionError || !session) {
    return NextResponse.json(
      { error: { code: 'INSERT_ERROR', message: sessionError?.message ?? 'Failed to create session' } },
      { status: 500 }
    )
  }

  // Insert decisions
  const decisionRows = decisions.map((d) => ({
    session_id: session.id,
    decision_date: d.decision_date,
    decision_type: d.decision_type,
    description: d.description,
    event_category: d.event_category || null,
    search_query: d.search_query || null,
  }))

  const { error: decError } = await admin
    .from('calibration_decisions')
    .insert(decisionRows)

  if (decError) {
    return NextResponse.json(
      { error: { code: 'INSERT_ERROR', message: decError.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: session }, { status: 201 })
}
