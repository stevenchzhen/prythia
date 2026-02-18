'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Brain,
  LineChart,
  MessageSquareText,
  Radar,
  Search,
  Target,
  Zap,
} from 'lucide-react'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

export default function LandingPage() {
  useScrollReveal()

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ── Background ── */}
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-50" />

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-transparent backdrop-blur-md bg-[rgba(5,5,6,0.8)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(247,215,76,0.3)] bg-[rgba(12,13,20,0.7)] text-sm font-semibold text-[var(--primary-text)]">
              π
            </span>
            <span className="text-lg font-semibold tracking-wide text-white">
              Prythia
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[rgba(247,215,76,0.95)] px-5 py-2 text-sm font-semibold text-black transition hover:translate-y-[-1px] glow-soft"
            >
              Request Access
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-24 pb-20 md:pt-36 md:pb-32">
        <div className="pointer-events-none absolute -top-40 right-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(247,215,76,0.22),_transparent_65%)]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,216,74,0.12),_transparent_65%)]" />

        <div className="relative max-w-3xl">
          <p className="anim-fade-up mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)] mb-6">
            Decision Intelligence
          </p>
          <h1 className="anim-fade-up anim-delay-100 text-4xl font-semibold leading-[1.15] tracking-tight text-white md:text-6xl">
            Make better decisions.{' '}
            <span className="text-[var(--primary)]">Before it matters.</span>
          </h1>
          <p className="anim-fade-up anim-delay-200 mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
            Prythia turns prediction market data into tailored intelligence
            for your business — so you can price risk, time decisions, and
            move before the market catches up.
          </p>
          <div className="anim-fade-up anim-delay-300 mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="group flex items-center gap-2 rounded-full bg-[rgba(247,215,76,0.95)] px-7 py-3 text-sm font-semibold text-black transition hover:translate-y-[-1px] glow-soft"
            >
              Request Early Access
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full border border-[rgba(247,215,76,0.25)] px-7 py-3 text-sm font-semibold text-zinc-300 transition hover:border-[rgba(247,215,76,0.4)] hover:text-white"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <section className="relative z-10 border-y border-[var(--primary-border)] bg-[rgba(5,5,6,0.6)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-10 md:flex-row md:justify-between">
          <p className="ls-fade-in text-xs uppercase tracking-[0.16em] text-zinc-500">
            Powered by real-time data from
          </p>
          <div className="ls-fade-in flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {['Polymarket', 'Kalshi', 'Metaculus'].map((name) => (
              <span
                key={name}
                className="mono text-sm font-medium tracking-wide text-zinc-300"
              >
                {name}
              </span>
            ))}
          </div>
          <div className="ls-fade-in flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="mono text-xs text-zinc-500">
              2,400+ events tracked
            </span>
          </div>
        </div>
      </section>

      {/* ── The Problem ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <p className="ls-fade-up mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)] mb-6">
            The problem
          </p>
          <h2 className="ls-fade-up text-3xl font-semibold leading-snug tracking-tight text-white md:text-4xl">
            Every business decision is a bet on the future.
          </h2>
          <p className="ls-fade-up mt-6 text-base leading-relaxed text-zinc-400">
            Tariff changes, rate decisions, elections, commodity shifts — these
            events reshape supply chains, pricing, and strategy overnight.
            Prediction markets price them in real time, but the signal is
            scattered across platforms and buried in noise.
          </p>
          <p className="ls-fade-up mt-4 text-base leading-relaxed text-zinc-400">
            Prythia makes that signal usable — tailored to your industry,
            mapped to your decisions, calibrated against outcomes.
          </p>
        </div>
      </section>

      {/* ── 3 Key Features (Demo Sections) ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="mb-20 max-w-xl">
          <p className="ls-fade-up mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)] mb-4">
            How Prythia works
          </p>
          <h2 className="ls-fade-up text-3xl font-semibold tracking-tight text-white md:text-4xl">
            From world events to your next move
          </h2>
        </div>

        {/* Feature 1: Live Intelligence Feed */}
        <div className="ls-fade-up mb-24 grid items-center gap-12 md:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--primary-border)] bg-[var(--primary-ghost)]">
                <Radar className="h-5 w-5 text-[var(--primary-text)]" />
              </div>
              <span className="mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                01
              </span>
            </div>
            <h3 className="mb-3 text-2xl font-semibold text-white">
              Live Intelligence Feed
            </h3>
            <p className="text-sm leading-relaxed text-zinc-400">
              See aggregated probabilities across all platforms in one view.
              Track tariff changes, elections, rate decisions, and macro events
              — filtered to what matters for your business. Every probability is
              volume-weighted, quality-scored, and updated in real time.
            </p>
            <ul className="mt-5 space-y-2">
              {[
                'Cross-platform aggregation from 3 exchanges',
                'Category filters for your industry',
                'Probability sparklines showing momentum',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-zinc-400">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--primary-muted)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {/* Demo placeholder */}
          <div className="relative overflow-hidden rounded-xl border border-[var(--primary-border)] bg-[rgba(12,13,20,0.85)]">
            <div className="flex items-center gap-2 border-b border-[var(--primary-border)] bg-[rgba(6,7,10,0.8)] px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            </div>
            <div className="flex aspect-video items-center justify-center">
              <div className="text-center space-y-2">
                <Radar className="mx-auto h-8 w-8 text-[var(--primary-text)] opacity-40" />
                <p className="mono text-[10px] uppercase tracking-wider text-zinc-600">
                  Demo: Live Feed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: AI That Knows Your Business */}
        <div className="ls-fade-up mb-24 grid items-center gap-12 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <div className="relative overflow-hidden rounded-xl border border-[var(--primary-border)] bg-[rgba(12,13,20,0.85)]">
              <div className="flex items-center gap-2 border-b border-[var(--primary-border)] bg-[rgba(6,7,10,0.8)] px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              </div>
              <div className="flex aspect-video items-center justify-center">
                <div className="text-center space-y-2">
                  <MessageSquareText className="mx-auto h-8 w-8 text-[var(--primary-text)] opacity-40" />
                  <p className="mono text-[10px] uppercase tracking-wider text-zinc-600">
                    Demo: AI Assistant
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--primary-border)] bg-[var(--primary-ghost)]">
                <MessageSquareText className="h-5 w-5 text-[var(--primary-text)]" />
              </div>
              <span className="mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                02
              </span>
            </div>
            <h3 className="mb-3 text-2xl font-semibold text-white">
              AI That Knows Your Business
            </h3>
            <p className="text-sm leading-relaxed text-zinc-400">
              Tell Prythia what you do — &ldquo;I run a DTC brand sourcing from
              Southeast Asia&rdquo; — and the AI builds a tailored watchlist of
              events that affect your supply chain, pricing, and timing. It
              searches real data, sets up alerts, and explains what the
              probabilities mean for your decisions.
            </p>
            <ul className="mt-5 space-y-2">
              {[
                'Context-aware: understands your industry',
                'Builds watchlists and alerts automatically',
                'Explains probabilities in business terms',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-zinc-400">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--primary-muted)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Feature 3: PryCalibration — Backtest Your Decisions */}
        <div className="ls-fade-up grid items-center gap-12 md:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--primary-border)] bg-[var(--primary-ghost)]">
                <Target className="h-5 w-5 text-[var(--primary-text)]" />
              </div>
              <span className="mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                03
              </span>
            </div>
            <h3 className="mb-3 text-2xl font-semibold text-white">
              PryCalibration
            </h3>
            <p className="text-sm leading-relaxed text-zinc-400">
              Upload your past decisions — when you hedged, when you expanded,
              when you changed suppliers — and Prythia scores them against what
              the prediction markets knew at the time. See where you were ahead,
              where you were late, and how to calibrate your decision-making
              going forward. Powered by 5+ years of historical data.
            </p>
            <ul className="mt-5 space-y-2">
              {[
                'Backtest decisions against historical market data',
                'Calibration curves: your timing vs market consensus',
                'Identify blind spots in your decision process',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-zinc-400">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--primary-muted)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-[var(--primary-border)] bg-[rgba(12,13,20,0.85)]">
            <div className="flex items-center gap-2 border-b border-[var(--primary-border)] bg-[rgba(6,7,10,0.8)] px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            </div>
            <div className="flex aspect-video items-center justify-center">
              <div className="text-center space-y-2">
                <Target className="mx-auto h-8 w-8 text-[var(--primary-text)] opacity-40" />
                <p className="mono text-[10px] uppercase tracking-wider text-zinc-600">
                  Demo: PryCalibration
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who It's For ── */}
      <section className="relative z-10 border-y border-[var(--primary-border)] bg-[rgba(5,5,6,0.6)] backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="mb-16 max-w-xl">
            <p className="ls-fade-up mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)] mb-4">
              Built for every business
            </p>
            <h2 className="ls-fade-up text-3xl font-semibold tracking-tight text-white md:text-4xl">
              If your decisions depend on what happens next, Prythia is for you
            </h2>
          </div>

          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Search,
                title: 'DTC & E-Commerce',
                desc: 'Track tariff probabilities, currency shifts, and supply chain disruptions before they hit your margins.',
              },
              {
                icon: LineChart,
                title: 'Finance & Trading',
                desc: 'Calibrate models against market consensus. Spot mispricing across platforms. Backtest strategies with 5 years of data.',
              },
              {
                icon: Zap,
                title: 'Supply Chain & Logistics',
                desc: 'Monitor trade policy, sanctions, and commodity events. Time procurement and routing decisions with probability data.',
              },
              {
                icon: Brain,
                title: 'Strategy & Risk',
                desc: 'Score past decisions against market intelligence. Build calibrated decision frameworks for scenario planning.',
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className="ls-fade-up"
                style={{ '--index': i } as React.CSSProperties}
              >
                <item.icon className="mb-4 h-5 w-5 text-[var(--primary-text)]" />
                <h3 className="mb-2 text-base font-semibold text-white">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="ls-scale-in relative overflow-hidden rounded-2xl border border-[var(--primary-border)] bg-[rgba(12,13,20,0.72)] p-12 text-center md:p-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(247,215,76,0.08),_transparent_70%)]" />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Stop deciding in the dark.
            </h2>
            <p className="mt-4 max-w-lg mx-auto text-base text-zinc-400">
              Every business decision has a probability attached to it. Prythia
              helps you see it, understand it, and act on it.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/signup"
                className="group flex items-center gap-2 rounded-full bg-[rgba(247,215,76,0.95)] px-8 py-3.5 text-sm font-semibold text-black transition hover:translate-y-[-1px] glow-soft"
              >
                Request Early Access
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-[var(--primary-border)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(247,215,76,0.3)] bg-[rgba(12,13,20,0.7)] text-xs font-semibold text-[var(--primary-text)]">
                  π
                </span>
                <span className="text-sm font-semibold text-white">
                  Prythia
                </span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-500">
                Decision intelligence powered by prediction markets.
              </p>
            </div>

            <div>
              <h4 className="mono mb-4 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Product
              </h4>
              <ul className="space-y-2.5">
                {['Intelligence Feed', 'AI Assistant', 'PryCalibration', 'Alerts', 'API'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-zinc-500 cursor-default">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mono mb-4 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Resources
              </h4>
              <ul className="space-y-2.5">
                {['Documentation', 'API Reference', 'Changelog'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-zinc-500 cursor-default">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mono mb-4 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Company
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="mailto:hello@prythia.com"
                    className="text-sm text-zinc-500 transition hover:text-white"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <span className="text-sm text-zinc-500 cursor-default">
                    Privacy
                  </span>
                </li>
                <li>
                  <span className="text-sm text-zinc-500 cursor-default">
                    Terms
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--primary-border)] pt-8 md:flex-row">
            <p className="mono text-[11px] text-zinc-600">
              &copy; {new Date().getFullYear()} Prythia. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {['Polymarket', 'Kalshi', 'Metaculus'].map((name) => (
                <span
                  key={name}
                  className="mono text-[10px] uppercase tracking-wider text-zinc-700"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
