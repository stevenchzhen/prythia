import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Fetch event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `Event ${id} not found` } },
        { status: 404 }
      )
    }

    // Fetch active source contracts
    const { data: sources, error: sourcesError } = await supabaseAdmin
      .from('source_contracts')
      .select('*')
      .eq('event_id', id)
      .eq('is_active', true)
      .order('platform', { ascending: true })

    if (sourcesError) {
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: sourcesError.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...event,
      sources: sources ?? [],
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch event detail' } },
      { status: 500 }
    )
  }
}
