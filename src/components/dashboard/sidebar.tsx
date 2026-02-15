'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  BarChart3,
  Bell,
  Bookmark,
  Compass,
  MessageSquare,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Feed', href: '/feed', icon: Activity },
  { name: 'Watchlist', href: '/watchlist', icon: Bookmark },
  { name: 'Explore', href: '/explore', icon: Compass },
  { name: 'AI Chat', href: '/chat', icon: MessageSquare },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

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

      {/* Bottom */}
      <div className="border-t border-[var(--primary-border)] px-4 py-3">
        <p className="mono text-[11px] uppercase tracking-[0.16em] text-zinc-600">
          Signal Intelligence
        </p>
      </div>
    </aside>
  )
}
