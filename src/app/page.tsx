import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background layers — matching prythia.com */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-70" />
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(247,215,76,0.28),_transparent_65%)]" />
      <div className="pointer-events-none absolute -bottom-48 left-0 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,216,74,0.18),_transparent_65%)]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-8">
        <div className="max-w-2xl text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(247,215,76,0.4)] bg-[rgba(12,13,20,0.7)] text-2xl font-semibold glow-ring">
              π
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-wide text-white">
              Prythia
            </h1>
            <p className="text-xs uppercase tracking-[0.16em] text-[rgba(247,215,76,0.7)]">
              Prediction Market Intelligence
            </p>
          </div>

          <p className="text-lg text-zinc-400 leading-relaxed max-w-lg mx-auto">
            Aggregated probabilities, AI analysis, and alerts across
            Polymarket, Kalshi, and Metaculus. Real-time signal for
            what happens next.
          </p>

          <div className="flex gap-3 justify-center">
            <Link
              href="/feed"
              className="rounded-full bg-[rgba(247,215,76,0.95)] px-6 py-3 text-sm font-semibold text-black transition hover:translate-y-[-1px] glow-soft"
            >
              Open Dashboard
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-[rgba(247,215,76,0.4)] px-6 py-3 text-sm font-semibold text-[rgba(247,215,76,0.9)] transition hover:bg-[rgba(247,215,76,0.1)]"
            >
              Create Account
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 pt-4">
            <span className="mono text-[11px] uppercase tracking-[0.16em] text-zinc-600">
              Dashboard for analysts
            </span>
            <span className="h-1 w-1 rounded-full bg-[rgba(247,215,76,0.3)]" />
            <span className="mono text-[11px] uppercase tracking-[0.16em] text-zinc-600">
              API for quant funds
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
