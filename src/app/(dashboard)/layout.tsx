import { Suspense } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-[#050506]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Suspense fallback={<div className="h-12 border-b border-[var(--primary-border)] bg-[#050506]" />}>
          <Topbar />
        </Suspense>
        <main className="relative flex-1 overflow-y-auto p-6">
          {/* Dot grid background */}
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
          {/* Content */}
          <div className="relative z-10">
            <Suspense fallback={
              <div className="flex items-center justify-center py-20">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary-muted)] border-t-transparent" />
              </div>
            }>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
