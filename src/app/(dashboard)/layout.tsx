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
        <Topbar />
        <main className="relative flex-1 overflow-y-auto p-6">
          {/* Dot grid background */}
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
