import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background — matching landing page */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-70" />
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(247,215,76,0.28),_transparent_65%)]" />
      <div className="pointer-events-none absolute -bottom-48 left-0 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,216,74,0.18),_transparent_65%)]" />

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Logo + heading */}
        <div className="mb-8 text-center space-y-4">
          <div className="flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(247,215,76,0.4)] bg-[rgba(12,13,20,0.7)] text-xl font-semibold glow-ring">
              π
            </span>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-wide text-white">
              Invite Only
            </h1>
            <p className="text-xs uppercase tracking-[0.16em] text-[rgba(247,215,76,0.7)]">
              Early Access
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-surface rounded-xl p-6 space-y-5">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(247,215,76,0.1)] border border-[rgba(247,215,76,0.2)]">
              <Lock className="h-5 w-5 text-[var(--primary-text)]" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-zinc-300">
                Prythia is currently in private beta. Access is granted on an invite-only basis.
              </p>
              <p className="text-sm text-zinc-400">
                If you&apos;ve been invited, check your email for a sign-in link. Otherwise, reach out to request access.
              </p>
            </div>
            <a
              href="mailto:access@prythia.com"
              className="text-sm text-[var(--primary-text)] underline-offset-4 hover:underline transition"
            >
              Request access
            </a>
          </div>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-[13px] text-zinc-500">
          Already have access?{' '}
          <Link
            href="/login"
            className="text-[var(--primary-text)] underline-offset-4 hover:underline transition"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
