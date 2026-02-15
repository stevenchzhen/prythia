import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/v1/* (public API — uses API key auth, not session)
     * - api/cron/* (cron jobs — uses CRON_SECRET auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/v1|api/cron).*)',
  ],
}
