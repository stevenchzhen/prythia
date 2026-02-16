import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Service role client — ONLY use in server-side code (API routes, cron jobs)
// NEVER import this in client components or expose to the browser
// Lazily initialized to avoid crashing at build time when env vars are absent.
let _client: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _client
}

/** @deprecated Use getSupabaseAdmin() instead */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseAdmin(), prop, receiver)
  },
})
