import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

/** GET: single decision with linked events */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const admin = getSupabaseAdmin()
    const { data: decision, error } = await admin
      .from('user_decisions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !decision) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Decision not found' } },
        { status: 404 }
      )
    }

    // Fetch links with event data
    const { data: links } = await admin
      .from('decision_event_links')
      .select('*')
      .eq('decision_id', id)

    const eventIds = (links ?? []).map((l) => l.event_id)
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

    return NextResponse.json({
      data: {
        ...decision,
        links: (links ?? []).map((l) => ({
          ...l,
          event: eventsMap[l.event_id] ?? null,
        })),
      },
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to fetch decision' } },
      { status: 500 }
    )
  }
}

/** PATCH: update a decision (status, outcome_notes, deadline, etc.) */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const admin = getSupabaseAdmin()

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.status !== undefined) updates.status = body.status
    if (body.outcome_notes !== undefined) updates.outcome_notes = body.outcome_notes
    if (body.deadline !== undefined) updates.deadline = body.deadline
    if (body.title !== undefined) updates.title = body.title
    if (body.description !== undefined) updates.description = body.description
    if (body.decision_type !== undefined) updates.decision_type = body.decision_type
    if (body.tags !== undefined) updates.tags = body.tags

    if (body.status === 'decided' && !body.decided_at) {
      updates.decided_at = new Date().toISOString()
    }

    const { data: decision, error } = await admin
      .from('user_decisions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error || !decision) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Decision not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: decision })
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to update decision' } },
      { status: 500 }
    )
  }
}

/** DELETE: remove a decision */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('user_decisions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to delete decision' } },
      { status: 500 }
    )
  }
}
