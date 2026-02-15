import SiteShell from "@/components/SiteShell";

const pillars = [
  {
    title: "Atlas Inference Mesh",
    description:
      "Distributed inference pipelines fuse macro, order flow, and on-chain telemetry at millisecond speed.",
  },
  {
    title: "Signal Provenance",
    description:
      "Every alert ships with lineage, confidence scoring, and catalyst attribution for auditability.",
  },
  {
    title: "Adaptive Regimes",
    description:
      "Models recalibrate continuously as volatility, liquidity, and market structure shifts.",
  },
];

const architecture = [
  {
    label: "Ingestion",
    detail: "18k+ venues, OTC feeds, options surfaces, and macro calendars.",
  },
  {
    label: "Signal Fabric",
    detail: "Fusion engine that normalizes, labels, and scores every event.",
  },
  {
    label: "Narrative Layer",
    detail: "Vector timelines explain why a signal fired and what to watch next.",
  },
  {
    label: "Execution Rail",
    detail: "APIs, webhooks, and alert routing into your OMS and Slack.",
  },
];

export default function TechnologyPage() {
  return (
    <SiteShell>
      <section className="grid gap-6">
        <p className="text-xs uppercase tracking-[0.16em] text-[rgba(247,215,76,0.8)]">Technology</p>
        <h1 className="text-4xl font-semibold text-white md:text-5xl">
          Built on a signal fabric engineered for speed and trust.
        </h1>
        <p className="max-w-3xl text-lg text-zinc-300">
          Prythia’s architecture fuses real-time inference, causal tracing, and adaptive risk scoring so you
          can deploy with conviction.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {pillars.map((pillar) => (
          <div
            key={pillar.title}
            className="rounded-2xl border border-[rgba(247,215,76,0.16)] bg-[rgba(12,13,20,0.85)] p-6"
          >
            <h2 className="text-xl font-semibold text-white">{pillar.title}</h2>
            <p className="mt-3 text-sm text-zinc-400">{pillar.description}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-8 rounded-2xl border border-[rgba(247,215,76,0.2)] bg-[rgba(12,13,20,0.9)] p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[rgba(247,215,76,0.8)]">Architecture</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            From ingestion to execution, every layer is intentional.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {architecture.map((layer) => (
            <div key={layer.label} className="rounded-2xl bg-[rgba(6,7,10,0.75)] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{layer.label}</p>
              <p className="mt-2 text-sm text-zinc-300">{layer.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
