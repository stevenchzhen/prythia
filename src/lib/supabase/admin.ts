import { createClient } from '@supabase/supabase-js'

// Service role client — ONLY use in server-side code (API routes, cron jobs)
// NEVER import this in client components or expose to the browser
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
