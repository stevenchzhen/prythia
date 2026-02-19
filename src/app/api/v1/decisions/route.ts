import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

/** GET: list user's decisions with linked events */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const admin = getSupabaseAdmin()
    const status = request.nextUrl.searchParams.get('status') || 'active'

    let dbQuery = admin
      .from('user_decisions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      dbQuery = dbQuery.eq('status', status)
    }

    const { data: decisions, error } = await dbQuery
    if (error) throw error

    if (!decisions || decisions.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Fetch links for all decisions
    const decisionIds = decisions.map((d) => d.id)
    const { data: links } = await admin
      .from('decision_event_links')
      .select('*')
      .in('decision_id', decisionIds)

    // Fetch live event data for linked events
    const eventIds = [...new Set((links ?? []).map((l) => l.event_id))]
    let eventsMap: Record<string, Record<string, unknown>> = {}

    if (eventIds.length > 0) {
      const { data: events } = await admin
        .from('events')
        .select('id, title, probability, prob_change_24h, category')
        .in('id', eventIds)

      if (events) {
        eventsMap = Object.fromEntries(events.map((e) => [e.id, e]))
      }
    }

    // Combine decisions with their links and event data
    const result = decisions.map((d) => ({
      ...d,
      links: (links ?? [])
        .filter((l) => l.decision_id === d.id)
        .map((l) => ({
          ...l,
          event: eventsMap[l.event_id] ?? null,
        })),
    }))

    return NextResponse.json({ data: result })
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to fetch decisions' } },
      { status: 500 }
    )
  }
}

/** POST: create a new decision */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, decision_type, deadline, tags } = body

    if (!title) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'title is required' } },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    const { data: decision, error } = await admin
      .from('user_decisions')
      .insert({
        user_id: user.id,
        title,
        description: description ?? null,
        decision_type: decision_type || 'other',
        deadline: deadline ?? null,
        tags: tags ?? [],
      })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ data: decision }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to create decision' } },
      { status: 500 }
    )
  }
}
