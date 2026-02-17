'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      if (error.message.toLowerCase().includes('database error saving new user')) {
        setError('Account setup failed — database migrations may need to be applied. Run: supabase db reset')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    router.push('/feed')
    router.refresh()
  }

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
              Create your account
            </h1>
            <p className="text-xs uppercase tracking-[0.16em] text-[rgba(247,215,76,0.7)]">
              Join Prythia
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="glass-surface rounded-xl p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[13px] font-medium text-zinc-400">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-10 bg-[rgba(6,7,10,0.75)] border-[var(--primary-border)] text-zinc-100 placeholder:text-zinc-600 focus-visible:border-[var(--primary-muted)] focus-visible:ring-[var(--primary-ghost)]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[13px] font-medium text-zinc-400">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="h-10 bg-[rgba(6,7,10,0.75)] border-[var(--primary-border)] text-zinc-100 placeholder:text-zinc-600 focus-visible:border-[var(--primary-muted)] focus-visible:ring-[var(--primary-ghost)]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="text-[13px] font-medium text-zinc-400">
                Confirm password
              </label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="h-10 bg-[rgba(6,7,10,0.75)] border-[var(--primary-border)] text-zinc-100 placeholder:text-zinc-600 focus-visible:border-[var(--primary-muted)] focus-visible:ring-[var(--primary-ghost)]"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                <p className="text-[13px] text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-[rgba(247,215,76,0.95)] text-black font-semibold text-sm transition hover:translate-y-[-0.5px] glow-soft disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-[13px] text-zinc-500">
          Already have an account?{' '}
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
