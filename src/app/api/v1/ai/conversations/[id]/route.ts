import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    // Verify conversation belongs to user
    const { data: conv } = await supabaseAdmin
      .from('ai_conversations')
      .select('id, user_id, title, created_at')
      .eq('id', id)
      .single()

    if (!conv || conv.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Conversation not found' } },
        { status: 404 }
      )
    }

    const { data: messages, error } = await supabaseAdmin
      .from('ai_messages')
      .select('id, role, content, events_referenced, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      conversation: { id: conv.id, title: conv.title, created_at: conv.created_at },
      messages: messages ?? [],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch conversation'
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    // Verify ownership
    const { data: conv } = await supabaseAdmin
      .from('ai_conversations')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (!conv || conv.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Conversation not found' } },
        { status: 404 }
      )
    }

    // Delete messages first (FK constraint), then conversation
    await supabaseAdmin
      .from('ai_messages')
      .delete()
      .eq('conversation_id', id)

    await supabaseAdmin
      .from('ai_conversations')
      .delete()
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete conversation'
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message } },
      { status: 500 }
    )
  }
}
