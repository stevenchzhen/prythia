import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const { data: conversations, error } = await supabaseAdmin
      .from('ai_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error) throw error

    // Get message counts
    const convIds = (conversations ?? []).map((c) => c.id)
    const { data: counts } = convIds.length > 0
      ? await supabaseAdmin
          .from('ai_messages')
          .select('conversation_id')
          .in('conversation_id', convIds)
      : { data: [] }

    const countMap = new Map<string, number>()
    for (const row of counts ?? []) {
      countMap.set(row.conversation_id, (countMap.get(row.conversation_id) ?? 0) + 1)
    }

    const result = (conversations ?? []).map((c) => ({
      ...c,
      message_count: countMap.get(c.id) ?? 0,
    }))

    return NextResponse.json({ data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list conversations'
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message } },
      { status: 500 }
    )
  }
}
