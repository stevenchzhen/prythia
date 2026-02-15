const featureList = [
  {
    title: "1. Screen capture (3s)",
    description: "Screen capture 3s.",
  },
  {
    title: "2. Vision OCR (GPT-4.1-mini)",
    description: "Vision OCR GPT-4.1-mini.",
  },
  {
    title: "3. AI matching",
    description: "AI matching GPT-4.1-nano + SQL search 58k+ markets.",
  },
  {
    title: "4. Overlay display",
    description: "Overlay display HUD cards with YES/NO.",
  },
  {
    title: "5. One-click trade",
    description: "One-click trade.",
  },
];

const useCases = [
  {
    title: "Portfolio Guardians",
    description:
      "Protect long-term positions with proactive volatility hedges and rotation cues.",
    tags: ["Treasury", "DAO", "Family office"],
  },
  {
    title: "Active Desks",
    description:
      "Compress hours of analysis into minutes with real-time pattern surfacing.",
    tags: ["Prop", "Quant", "Market making"],
  },
  {
    title: "Research Teams",
    description:
      "Track narrative momentum, on-chain flows, and whale intent in one view.",
    tags: ["Macro", "Ecosystem", "Venture"],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-70" />
        <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(247,215,76,0.28),_transparent_65%)]" />
        <div className="pointer-events-none absolute -bottom-48 left-0 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,216,74,0.18),_transparent_65%)]" />

        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(247,215,76,0.4)] bg-[rgba(12,13,20,0.7)] text-lg font-semibold">π</span>
            <div>
              <p className="text-lg font-semibold tracking-wide">Prythia</p>
              <p className="text-xs uppercase tracking-[0.16em] text-[rgba(247,215,76,0.7)]">Signal Intelligence</p>
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-zinc-300 md:flex">
            <a className="transition hover:text-white" href="#signals">
              Signals
            </a>
            <a className="transition hover:text-white" href="#features">
              Features
            </a>
            <a className="transition hover:text-white" href="#use-cases">
              Use Cases
            </a>
            <a className="transition hover:text-white" href="#stack">
              Stack
            </a>
          </nav>
          <button className="rounded-full border border-[rgba(247,215,76,0.6)] bg-[rgba(247,215,76,0.1)] px-5 py-2 text-sm font-medium text-[rgba(247,215,76,0.9)] transition hover:bg-[rgba(247,215,76,0.2)]">
            Request Access
          </button>
        </header>

        <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 pb-24 pt-12">
          <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col gap-8">
              <div className="flex w-fit items-center gap-3 rounded-full border border-[rgba(247,215,76,0.3)] bg-[rgba(12,13,20,0.65)] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[rgba(247,215,76,0.8)]">
                <span className="h-2 w-2 rounded-full bg-[rgba(247,215,76,0.8)]" />
                Live signal fabrication
              </div>
              <h1 className="text-4xl font-semibold leading-tight text-white md:text-6xl">
                The Prythia core loop for markets —
                <span className="text-[rgba(247,215,76,0.95)]"> capture, read, match, display, trade.</span>
              </h1>
              <p className="max-w-xl text-lg text-zinc-300">
                A five-step workflow that starts with screen capture 3s, runs Vision OCR GPT-4.1-mini,
                applies AI matching GPT-4.1-nano + SQL search 58k+ markets, overlays HUD cards with YES/NO,
                and finishes with one-click trade. When you need to go off-loop, manual search is there on demand.
              </p>
              <p className="text-xs uppercase tracking-[0.16em] text-[rgba(247,215,76,0.8)]">
                Why it stands out
              </p>
              <ul className="grid gap-2 text-sm text-zinc-300">
                {
                  [
                    "Screen capture 3s",
                    "Vision OCR GPT-4.1-mini",
                    "AI matching GPT-4.1-nano + SQL search 58k+ markets",
                    "Overlay display HUD cards with YES/NO",
                    "One-click trade",
                    "Manual search when you want it",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[rgba(247,215,76,0.9)]" />
                      <span>{item}</span>
                    </li>
                  ))
                }
              </ul>
              <div className="flex flex-wrap gap-4">
                <button className="rounded-full bg-[rgba(247,215,76,0.95)] px-6 py-3 text-sm font-semibold text-black transition hover:translate-y-[-1px]">
                  Book a demo
                </button>
                <button className="rounded-full border border-[rgba(247,215,76,0.4)] px-6 py-3 text-sm font-semibold text-[rgba(247,215,76,0.9)] transition hover:bg-[rgba(247,215,76,0.1)]">
                  View live preview
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="text-[rgba(247,215,76,0.9)]">42ms</span> avg signal latency
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[rgba(247,215,76,0.9)]">18k+</span> venues indexed
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[rgba(247,215,76,0.9)]">97%</span> confidence tracking
                </div>
              </div>
            </div>

            <div className="glass-surface relative overflow-hidden rounded-2xl p-6">
              <div className="absolute inset-0 bg-[linear-gradient(140deg,_rgba(247,215,76,0.08),_transparent_55%)]" />
              <div className="relative flex flex-col gap-6">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-zinc-400">
                  <span>Signal Fabric</span>
                  <span className="text-[rgba(247,215,76,0.85)]">LIVE</span>
                </div>
                <div className="rounded-xl border border-[rgba(247,215,76,0.2)] bg-[rgba(8,9,13,0.8)] p-4">
                  <div className="flex items-center justify-between text-sm text-zinc-300">
                    <span>ETH / USD · Breakout Coil</span>
                    <span className="text-[rgba(247,215,76,0.9)]">+4.6%</span>
                  </div>
                  <div className="mt-3 flex items-end gap-1">
                    {Array.from({ length: 16 }).map((_, index) => (
                      <div
                        key={`bar-${index}`}
                        className="w-2 rounded-full bg-[rgba(247,215,76,0.35)]"
                        style={{ height: `${30 + (index % 5) * 14}px` }}
                      />
                    ))}
                    <div className="ml-2 flex flex-col gap-1 text-xs text-zinc-500">
                      <span>Signal Strength</span>
                      <span className="font-mono text-[rgba(247,215,76,0.8)]">0.87</span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      label: "Liquidity Sweep",
                      value: "Confirmed",
                    },
                    {
                      label: "Regime",
                      value: "Risk-On",
                    },
                    {
                      label: "Flow Bias",
                      value: "Aggressive Bid",
                    },
                    {
                      label: "Invalidation",
                      value: "$3,118",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-[rgba(247,215,76,0.12)] bg-[rgba(12,13,20,0.85)] p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm text-[rgba(247,215,76,0.9)]">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="signals" className="grid gap-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[rgba(247,215,76,0.8)]">Signal Preview</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">
                  See the signal before the crowd feels the move.
                </h2>
              </div>
              <button className="hidden rounded-full border border-[rgba(247,215,76,0.3)] px-4 py-2 text-xs uppercase tracking-[0.16em] text-zinc-300 md:inline">
                Explore feed
              </button>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {[
                {
                  title: "BTC Macro Pulse",
                  subtitle: "Macro divergence · 3H",
                  metric: "+2.1%",
                  accent: "Confidence 0.91",
                },
                {
                  title: "SOL Liquidity Magnet",
                  subtitle: "On-chain · 30m",
                  metric: "+6.4%",
                  accent: "Confidence 0.84",
                },
                {
                  title: "USDT Flow Pivot",
                  subtitle: "Stablecoin · 1D",
                  metric: "Rotation",
                  accent: "Confidence 0.88",
                },
              ].map((signal) => (
                <div
                  key={signal.title}
                  className="rounded-2xl border border-[rgba(247,215,76,0.18)] bg-[rgba(12,13,20,0.8)] p-6 transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-zinc-500">
                    <span>{signal.subtitle}</span>
                    <span className="text-[rgba(247,215,76,0.9)]">LIVE</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{signal.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{signal.accent}</p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-2xl font-semibold text-[rgba(247,215,76,0.9)]">
                      {signal.metric}
                    </span>
                    <span className="rounded-full border border-[rgba(247,215,76,0.3)] px-3 py-1 text-xs text-zinc-400">
                      View trace
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="features" className="grid gap-8">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[rgba(247,215,76,0.8)]">Prythia Core Loop</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                Five steps, continuously looping from screen capture to one-click trade.
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {featureList.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-[rgba(247,215,76,0.14)] bg-[rgba(12,13,20,0.85)] p-6"
                >
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm text-zinc-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="use-cases" className="grid gap-8">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[rgba(247,215,76,0.8)]">Use Cases</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                From treasury defense to speed trading, all signals flow here.
              </h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {useCases.map((useCase) => (
                <div
                  key={useCase.title}
                  className="rounded-2xl border border-[rgba(247,215,76,0.14)] bg-[rgba(12,13,20,0.85)] p-6"
                >
                  <h3 className="text-lg font-semibold text-white">{useCase.title}</h3>
                  <p className="mt-3 text-sm text-zinc-400">{useCase.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {useCase.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[rgba(247,215,76,0.3)] px-3 py-1 text-xs text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="stack" className="grid gap-10 rounded-2xl border border-[rgba(247,215,76,0.2)] bg-[rgba(12,13,20,0.92)] p-10">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[rgba(247,215,76,0.8)]">Stack</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                A market OS engineered for conviction.
              </h2>
              <ul className="mt-4 grid gap-2 text-sm text-zinc-300">
                {
                  [
                    "Causal traces attach every signal to a documented catalyst chain.",
                    "Regime-aware scoring prevents one-size-fits-all alerts.",
                    "Execution rails ship with approvals, playbooks, and rollback paths.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[rgba(247,215,76,0.9)]" />
                      <span>{item}</span>
                    </li>
                  ))
                }
              </ul>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {[
                {
                  title: "Atlas Core",
                  description: "Real-time fusion of macro, order book, and on-chain signals.",
                },
                {
                  title: "Vector Studio",
                  description: "Narrative timelines that explain why the signal fired.",
                },
                {
                  title: "Execution Rail",
                  description: "Automate risk bands, alerts, and trade triggers in one place.",
                },
              ].map((stack) => (
                <div key={stack.title} className="rounded-2xl bg-[rgba(6,7,10,0.75)] p-6">
                  <h3 className="text-lg font-semibold text-white">{stack.title}</h3>
                  <p className="mt-3 text-sm text-zinc-400">{stack.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-2xl border border-[rgba(247,215,76,0.25)] bg-[rgba(12,13,20,0.9)] p-10">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,_rgba(247,215,76,0.2),_transparent_70%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[rgba(247,215,76,0.8)]">Get Started</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">
                  Align your team with the market’s hidden geometry.
                </h2>
                <p className="mt-4 max-w-xl text-sm text-zinc-400">
                  Join the teams piloting Prythia for high conviction strategies, risk mitigation, and real-time
                  opportunity mapping.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <button className="rounded-full bg-[rgba(247,215,76,0.95)] px-6 py-3 text-sm font-semibold text-black">
                  Start pilot
                </button>
                <button className="rounded-full border border-[rgba(247,215,76,0.4)] px-6 py-3 text-sm font-semibold text-[rgba(247,215,76,0.9)]">
                  Download brief
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      <footer className="border-t border-[rgba(247,215,76,0.2)] bg-[rgba(7,8,12,0.9)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">Prythia</p>
            <p className="mt-2 text-sm text-zinc-500">
              Signal intelligence for markets that move faster than news.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-zinc-400">
            <span>Privacy</span>
            <span>Security</span>
            <span>Careers</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
