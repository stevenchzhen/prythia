import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/** GET: list user's watched event IDs + event data */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ data: [], ids: [] })
    }

    const { data: items } = await supabaseAdmin
      .from('watchlist_items')
      .select('event_id')
      .eq('user_id', user.id)

    const ids = (items ?? []).map((i) => i.event_id)

    if (ids.length === 0) {
      return NextResponse.json({ data: [], ids: [] })
    }

    const { data: events } = await supabaseAdmin
      .from('events')
      .select('*')
      .in('id', ids)
      .eq('is_active', true)
      .order('volume_24h', { ascending: false })

    return NextResponse.json({ data: events ?? [], ids })
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to fetch watchlist' } },
      { status: 500 }
    )
  }
}

/** POST: add event to watchlist */
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

    const { event_id } = await request.json()
    if (!event_id) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'event_id required' } },
        { status: 400 }
      )
    }

    // Get or create default group
    let { data: group } = await supabaseAdmin
      .from('watchlist_groups')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'Default')
      .single()

    if (!group) {
      const { data: newGroup } = await supabaseAdmin
        .from('watchlist_groups')
        .insert({ user_id: user.id, name: 'Default' })
        .select('id')
        .single()
      group = newGroup
    }

    if (!group) {
      return NextResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'Failed to get watchlist group' } },
        { status: 500 }
      )
    }

    await supabaseAdmin
      .from('watchlist_items')
      .upsert(
        { group_id: group.id, user_id: user.id, event_id },
        { onConflict: 'user_id,event_id' }
      )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to add to watchlist' } },
      { status: 500 }
    )
  }
}

/** DELETE: remove event from watchlist */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const { event_id } = await request.json()
    if (!event_id) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'event_id required' } },
        { status: 400 }
      )
    }

    await supabaseAdmin
      .from('watchlist_items')
      .delete()
      .eq('user_id', user.id)
      .eq('event_id', event_id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to remove from watchlist' } },
      { status: 500 }
    )
  }
}
