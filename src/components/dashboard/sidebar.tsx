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
    <aside className="flex w-60 flex-col border-r border-slate-800 bg-slate-950">
      <div className="flex h-14 items-center px-6 border-b border-slate-800">
        <Link href="/feed" className="text-xl font-bold tracking-tight">
          <span className="text-white">PRYTHIA</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
