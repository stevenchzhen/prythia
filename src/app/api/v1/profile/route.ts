import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const PROFILE_FIELDS = 'industry, role, company_description, key_concerns, profile_completed_at'

/** GET: fetch user's business profile */
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

    const admin = getSupabaseAdmin()
    const { data } = await admin
      .from('user_preferences')
      .select(PROFILE_FIELDS)
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      data: data ?? {
        industry: null,
        role: null,
        company_description: null,
        key_concerns: [],
        profile_completed_at: null,
      },
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to fetch profile' } },
      { status: 500 }
    )
  }
}

/** PUT: update user's business profile */
export async function PUT(request: NextRequest) {
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
    const { industry, role, company_description, key_concerns } = body

    const admin = getSupabaseAdmin()

    // Check if profile_completed_at is already set
    const { data: existing } = await admin
      .from('user_preferences')
      .select('profile_completed_at')
      .eq('user_id', user.id)
      .single()

    const updates: Record<string, unknown> = {
      user_id: user.id,
      industry: industry ?? null,
      role: role ?? null,
      company_description: company_description ?? null,
      key_concerns: key_concerns ?? [],
      updated_at: new Date().toISOString(),
    }

    if (!existing?.profile_completed_at) {
      updates.profile_completed_at = new Date().toISOString()
    }

    const { error } = await admin
      .from('user_preferences')
      .upsert(updates, { onConflict: 'user_id' })

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to update profile' } },
      { status: 500 }
    )
  }
}
