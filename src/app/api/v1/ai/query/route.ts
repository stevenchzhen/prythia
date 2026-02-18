import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { runRAGPipeline } from '@/lib/ai/rag'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { conversation_id, messages, useHeavyModel } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'messages array is required' } },
        { status: 400 }
      )
    }

    // Validate message format
    const validMessages = messages.every(
      (m: { role: string; content: string }) =>
        (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    )
    if (!validMessages) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Each message must have role (user|assistant) and content (string)' } },
        { status: 400 }
      )
    }

    // Create or update conversation
    let convId = conversation_id as string | undefined
    if (user) {
      if (!convId) {
        // Create new conversation
        const { data: conv } = await supabaseAdmin
          .from('ai_conversations')
          .insert({ user_id: user.id, title: null })
          .select('id')
          .single()
        convId = conv?.id
      }

      if (convId) {
        // Save the latest user message
        const lastUserMsg = messages[messages.length - 1]
        if (lastUserMsg.role === 'user') {
          await supabaseAdmin
            .from('ai_messages')
            .insert({
              conversation_id: convId,
              role: 'user',
              content: lastUserMsg.content,
              events_referenced: [],
            })
        }
      }
    }

    // Run RAG pipeline
    const result = await runRAGPipeline({
      messages,
      userId: user?.id,
      useHeavyModel: useHeavyModel ?? false,
    })

    // Save assistant response
    if (user && convId) {
      await supabaseAdmin
        .from('ai_messages')
        .insert({
          conversation_id: convId,
          role: 'assistant',
          content: result.answer,
          events_referenced: result.events_referenced,
        })

      // Auto-title: use first ~60 chars of first assistant response
      if (!conversation_id) {
        const title = result.answer.slice(0, 60).replace(/[#*_\n]/g, '').trim()
        await supabaseAdmin
          .from('ai_conversations')
          .update({ title })
          .eq('id', convId)
      }
    }

    return NextResponse.json({
      ...result,
      conversation_id: convId ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI query failed'
    console.error('AI query error:', err)
    return NextResponse.json(
      { error: { code: 'AI_ERROR', message } },
      { status: 500 }
    )
  }
}
