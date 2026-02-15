import SiteShell from "@/components/SiteShell";

const modules = [
  {
    title: "Atlas Signal Fabric",
    description:
      "Unify order books, options skew, and on-chain flows into a single signal layer you can trust.",
  },
  {
    title: "Vector Narrative Studio",
    description:
      "Explain every alert with causal drivers, historical analogs, and regime overlays.",
  },
  {
    title: "Execution Rail",
    description:
      "Deploy playbooks, risk bands, and alert routing directly into your trading stack.",
  },
];

const capabilities = [
  "Sub-50ms signal latency across 18k+ venues",
  "Confidence scoring per catalyst and regime",
  "Human + machine audit trails for compliance",
  "Real-time collaboration across desks and funds",
];

export default function ProductPage() {
  return (
    <SiteShell>
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[rgba(247,215,76,0.8)]">Product</p>
          <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
            A signal OS built for conviction trading.
          </h1>
          <p className="max-w-xl text-lg text-zinc-300">
            Prythia orchestrates the market’s hidden geometry into a single interface that surfaces what
            matters before the crowd reacts.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="rounded-full bg-[rgba(247,215,76,0.95)] px-6 py-3 text-sm font-semibold text-black">
              Request demo
            </button>
            <button className="rounded-full border border-[rgba(247,215,76,0.4)] px-6 py-3 text-sm font-semibold text-[rgba(247,215,76,0.9)]">
              Download overview
            </button>
          </div>
        </div>
        <div className="glass-surface rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Live Signal Cards</p>
          <div className="mt-6 grid gap-4">
            {modules.map((module) => (
              <div
                key={module.title}
                className="rounded-2xl border border-[rgba(247,215,76,0.16)] bg-[rgba(12,13,20,0.85)] p-4"
              >
                <h3 className="text-lg font-semibold text-white">{module.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{module.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[rgba(247,215,76,0.8)]">Core Capabilities</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            Everything you need to move before the narrative forms.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {capabilities.map((capability) => (
            <div
              key={capability}
              className="rounded-3xl border border-[rgba(247,215,76,0.14)] bg-[rgba(12,13,20,0.85)] p-6 text-sm text-zinc-300"
            >
              {capability}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-[rgba(247,215,76,0.2)] bg-[rgba(12,13,20,0.9)] p-8">
        <h2 className="text-2xl font-semibold text-white">Integrate in days, not quarters.</h2>
        <p className="text-sm text-zinc-400">
          Prythia ships with secure APIs, prebuilt dashboards, and alert routing so your team can pilot
          without heavy engineering lift.
        </p>
      </section>
    </SiteShell>
  );
}
