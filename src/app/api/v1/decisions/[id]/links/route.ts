import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

/** POST: link an event to a decision */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: decisionId } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const admin = getSupabaseAdmin()

    // Verify decision ownership
    const { data: decision } = await admin
      .from('user_decisions')
      .select('id')
      .eq('id', decisionId)
      .eq('user_id', user.id)
      .single()

    if (!decision) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Decision not found' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { event_id, relevance_note } = body

    if (!event_id) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'event_id is required' } },
        { status: 400 }
      )
    }

    // Get current probability for snapshot
    const { data: event } = await admin
      .from('events')
      .select('id, probability')
      .eq('id', event_id)
      .single()

    if (!event) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      )
    }

    const { error } = await admin
      .from('decision_event_links')
      .upsert(
        {
          decision_id: decisionId,
          event_id,
          link_source: 'user',
          prob_at_link: event.probability,
          relevance_note: relevance_note ?? null,
        },
        { onConflict: 'decision_id,event_id' }
      )

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to link event' } },
      { status: 500 }
    )
  }
}

/** DELETE: unlink an event from a decision */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: decisionId } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const admin = getSupabaseAdmin()

    // Verify decision ownership
    const { data: decision } = await admin
      .from('user_decisions')
      .select('id')
      .eq('id', decisionId)
      .eq('user_id', user.id)
      .single()

    if (!decision) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Decision not found' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { event_id } = body

    if (!event_id) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'event_id is required' } },
        { status: 400 }
      )
    }

    const { error } = await admin
      .from('decision_event_links')
      .delete()
      .eq('decision_id', decisionId)
      .eq('event_id', event_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to unlink event' } },
      { status: 500 }
    )
  }
}
