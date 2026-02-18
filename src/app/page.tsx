'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Code2,
  GitCompareArrows,
  Play,
  TrendingUp,
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
            Prediction Market Intelligence
          </p>
          <h1 className="anim-fade-up anim-delay-100 text-4xl font-semibold leading-[1.15] tracking-tight text-white md:text-6xl">
            See what the world believes{' '}
            <span className="text-[var(--primary)]">will happen next.</span>
          </h1>
          <p className="anim-fade-up anim-delay-200 mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
            Prythia aggregates real-time probabilities from the top prediction
            markets into a single intelligence layer — with AI analysis,
            cross-platform divergence detection, and alerts.
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

      {/* ── Platforms Bar ── */}
      <section className="relative z-10 border-y border-[var(--primary-border)] bg-[rgba(5,5,6,0.6)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-10 md:flex-row md:justify-between">
          <p className="ls-fade-in text-xs uppercase tracking-[0.16em] text-zinc-500">
            Aggregating across
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

      {/* ── How It Works ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="mb-16 max-w-xl">
          <p className="ls-fade-up mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)] mb-4">
            How it works
          </p>
          <h2 className="ls-fade-up text-3xl font-semibold tracking-tight text-white md:text-4xl">
            From raw markets to actionable signal
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: '01',
              icon: BarChart3,
              title: 'Aggregate',
              desc: 'We ingest thousands of contracts from Polymarket, Kalshi, and Metaculus in real time — deduplicating and linking them to canonical events.',
            },
            {
              step: '02',
              icon: GitCompareArrows,
              title: 'Analyze',
              desc: 'AI detects cross-platform divergence, identifies when markets disagree, and surfaces the spread — so you see arbitrage and informational gaps first.',
            },
            {
              step: '03',
              icon: Bell,
              title: 'Act',
              desc: 'Set threshold alerts, monitor watchlists, or pipe data directly into your models via our REST API. Built for analysts and quant teams.',
            },
          ].map((item, i) => (
            <div
              key={item.step}
              className="ls-fade-up glass-card rounded-xl p-8 transition hover:border-[var(--primary-muted)] hover:translate-y-[-2px]"
              style={{ '--index': i } as React.CSSProperties}
            >
              <div className="mb-6 flex items-center gap-4">
                <span className="mono text-xs text-[var(--primary-text)] opacity-60">
                  {item.step}
                </span>
                <div className="h-px flex-1 bg-[var(--primary-border)]" />
              </div>
              <item.icon className="mb-4 h-6 w-6 text-[var(--primary-text)]" />
              <h3 className="mb-3 text-xl font-semibold text-white">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="mb-16 max-w-xl">
          <p className="ls-fade-up mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)] mb-4">
            Capabilities
          </p>
          <h2 className="ls-fade-up text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Intelligence, not just data
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              icon: TrendingUp,
              title: 'Cross-Platform Spreads',
              desc: 'Spot when Polymarket and Kalshi disagree by 10%+ on the same event. See which platform is historically more accurate.',
              tag: 'Divergence',
            },
            {
              icon: Bot,
              title: 'AI Assistant',
              desc: 'Ask questions in plain English. Prythia AI searches events, builds watchlists, sets alerts, and explains what the data means.',
              tag: 'AI',
            },
            {
              icon: Bell,
              title: 'Smart Alerts',
              desc: 'Threshold crossings, probability movements, volume spikes, divergence triggers — delivered via webhook, Slack, or email.',
              tag: 'Alerts',
            },
            {
              icon: Code2,
              title: 'REST API',
              desc: 'Programmatic access to every event, probability time-series, and divergence snapshot. Built for quantitative workflows.',
              tag: 'Developer',
            },
          ].map((item, i) => (
            <div
              key={item.title}
              className="ls-fade-up group glass-card rounded-xl p-8 transition hover:border-[var(--primary-muted)] hover:translate-y-[-2px]"
              style={{ '--index': i } as React.CSSProperties}
            >
              <div className="mb-5 flex items-center justify-between">
                <item.icon className="h-6 w-6 text-[var(--primary-text)]" />
                <span className="mono rounded-full border border-[var(--primary-border)] px-3 py-1 text-[10px] uppercase tracking-wider text-zinc-500 group-hover:border-[var(--primary-muted)] group-hover:text-[var(--primary-text)] transition">
                  {item.tag}
                </span>
              </div>
              <h3 className="mb-3 text-lg font-semibold text-white">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Demo Section ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="mb-12 text-center">
          <p className="ls-fade-up mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)] mb-4">
            See it in action
          </p>
          <h2 className="ls-fade-up text-3xl font-semibold tracking-tight text-white md:text-4xl">
            The intelligence layer, visualized
          </h2>
        </div>

        {/* Demo placeholder — replace with actual screenshots or video */}
        <div className="ls-scale-in mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-2xl border border-[var(--primary-border)] bg-[rgba(12,13,20,0.85)]">
            {/* Browser chrome bar */}
            <div className="flex items-center gap-2 border-b border-[var(--primary-border)] bg-[rgba(6,7,10,0.8)] px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-zinc-700" />
              <span className="h-3 w-3 rounded-full bg-zinc-700" />
              <span className="h-3 w-3 rounded-full bg-zinc-700" />
              <span className="ml-4 flex-1 rounded-md bg-[rgba(6,7,10,0.9)] px-3 py-1.5 text-center">
                <span className="mono text-[11px] text-zinc-600">
                  app.prythia.com/feed
                </span>
              </span>
            </div>
            {/* Content area */}
            <div className="flex aspect-[16/9] items-center justify-center p-12">
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[var(--primary-border)] bg-[var(--primary-ghost)]">
                  <Play className="h-6 w-6 text-[var(--primary-text)]" />
                </div>
                <p className="text-sm text-zinc-500">
                  Demo video or dashboard screenshot
                </p>
                <p className="mono text-[10px] uppercase tracking-wider text-zinc-600">
                  Coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="relative z-10 border-y border-[var(--primary-border)] bg-[rgba(5,5,6,0.6)] backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <p className="ls-fade-up mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)] mb-6">
              Why Prythia
            </p>
            <h2 className="ls-fade-up text-3xl font-semibold leading-snug tracking-tight text-white md:text-4xl">
              Prediction markets are the best forecasting tool ever invented.
            </h2>
            <p className="ls-fade-up mt-6 text-base leading-relaxed text-zinc-400">
              But the data is fragmented across platforms, each with different
              contracts, liquidity, and user bases. The same question gets priced
              at 65% on one exchange and 78% on another — and nobody sees it.
            </p>
            <p className="ls-fade-up mt-4 text-base leading-relaxed text-zinc-400">
              Prythia unifies this landscape. We map every contract to canonical
              events, detect when platforms disagree, and surface the signal that
              matters — for analysts, quant teams, and anyone making decisions
              under uncertainty.
            </p>
          </div>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="mb-16 max-w-xl">
          <p className="ls-fade-up mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)] mb-4">
            Built for
          </p>
          <h2 className="ls-fade-up text-3xl font-semibold tracking-tight text-white md:text-4xl">
            From analysts to algorithms
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: 'Research Analysts',
              desc: 'Track geopolitical risk, policy shifts, and macro signals in real time. Replace manual monitoring with AI-curated watchlists.',
            },
            {
              title: 'Quantitative Teams',
              desc: 'Pipe probability time-series and divergence data into your models via REST API. Historical data back to 2020.',
            },
            {
              title: 'Policy & Risk Teams',
              desc: 'Monitor tariff probabilities, election outcomes, and regulatory changes. Set alerts for threshold crossings that affect your operations.',
            },
          ].map((item, i) => (
            <div
              key={item.title}
              className="ls-fade-up"
              style={{ '--index': i } as React.CSSProperties}
            >
              <div className="mb-3 h-px w-12 bg-[var(--primary-muted)]" />
              <h3 className="mb-2 text-lg font-semibold text-white">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="ls-scale-in relative overflow-hidden rounded-2xl border border-[var(--primary-border)] bg-[rgba(12,13,20,0.72)] p-12 text-center md:p-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(247,215,76,0.08),_transparent_70%)]" />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Ready to see the future clearly?
            </h2>
            <p className="mt-4 text-base text-zinc-400">
              Join the private beta. Early access for analysts, quant teams, and
              decision-makers.
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
            {/* Brand */}
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
                Prediction market intelligence for a world of uncertainty.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="mono mb-4 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Product
              </h4>
              <ul className="space-y-2.5">
                {['Feed', 'Explorer', 'AI Chat', 'Alerts', 'API'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-zinc-500 cursor-default">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
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

            {/* Company */}
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
