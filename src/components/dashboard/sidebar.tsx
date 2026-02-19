'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  Compass,
  LogOut,
  MessageSquare,
  Settings,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navigation = [
  { name: 'Feed', href: '/feed', icon: Activity },
  { name: 'Watchlist', href: '/watchlist', icon: Bookmark },
  { name: 'Explore', href: '/explore', icon: Compass },
  { name: 'AI Chat', href: '/chat', icon: MessageSquare },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Decisions', href: '/decisions', icon: BookOpen },
  { name: 'PryCalibration', href: '/calibration', icon: Target },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
    })
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex w-56 flex-col border-r border-[var(--primary-border)] bg-[#050506]">
      {/* Logo — matches prythia.com header */}
      <div className="flex h-14 items-center gap-3 px-5 border-b border-[var(--primary-border)]">
        <Link href="/feed" className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--primary-muted)] bg-[rgba(12,13,20,0.7)] text-sm font-semibold">
            π
          </span>
          <div>
            <p className="text-sm font-semibold tracking-wide">Prythia</p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--primary-text)]">
              Dashboard
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150',
                isActive
                  ? 'bg-[var(--primary-subtle)] text-[rgba(247,215,76,0.9)]'
                  : 'text-zinc-400 hover:bg-[var(--primary-ghost)] hover:text-zinc-300'
              )}
            >
              <item.icon className="h-4 w-4" strokeWidth={1.5} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom — user info + sign out */}
      <div className="border-t border-[var(--primary-border)] px-3 py-3 space-y-2">
        {userEmail && (
          <p className="truncate px-1 text-[11px] text-zinc-500" title={userEmail}>
            {userEmail}
          </p>
        )}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium text-zinc-500 transition-colors hover:bg-[var(--primary-ghost)] hover:text-zinc-300"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
