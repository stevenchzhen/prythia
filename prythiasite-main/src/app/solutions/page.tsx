import SiteShell from "@/components/SiteShell";

const solutionGroups = [
  {
    title: "Portfolio Defense",
    description:
      "Monitor regime shifts and volatility surges to hedge treasuries before the tape reacts.",
    tags: ["DAO", "Treasury", "Family office"],
  },
  {
    title: "High Velocity Trading",
    description:
      "Surface breakouts, liquidity sweeps, and order flow anomalies in real time.",
    tags: ["Prop", "Market making", "HFT"],
  },
  {
    title: "Research & Narrative",
    description:
      "Blend macro catalysts with on-chain intent to explain why momentum is forming.",
    tags: ["Macro", "Venture", "Ecosystem"],
  },
];

const useCases = [
  {
    title: "Rotation Radar",
    description: "See capital rotating across sectors, chains, and stablecoin pools.",
  },
  {
    title: "Risk Banding",
    description: "Auto-generate invalidation levels and risk-adjusted entries.",
  },
  {
    title: "Catalyst Coverage",
    description: "Track releases, governance votes, and whale movement in one feed.",
  },
  {
    title: "Team Alignment",
    description: "Share signal context and trade plans across desks instantly.",
  },
];

export default function SolutionsPage() {
  return (
    <SiteShell>
      <section className="grid gap-6">
        <p className="text-xs uppercase tracking-[0.16em] text-[rgba(247,215,76,0.8)]">Solutions</p>
        <h1 className="text-4xl font-semibold text-white md:text-5xl">
          Use cases built around how modern funds actually trade.
        </h1>
        <p className="max-w-3xl text-lg text-zinc-300">
          Prythia adapts to your desk structure, mandate, and risk appetite — from long-term treasury
          defense to intraday execution.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {solutionGroups.map((solution) => (
          <div
            key={solution.title}
            className="rounded-2xl border border-[rgba(247,215,76,0.16)] bg-[rgba(12,13,20,0.85)] p-6"
          >
            <h2 className="text-xl font-semibold text-white">{solution.title}</h2>
            <p className="mt-3 text-sm text-zinc-400">{solution.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {solution.tags.map((tag) => (
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
      </section>

      <section className="grid gap-8">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[rgba(247,215,76,0.8)]">Use Case Library</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            Curated workflows for every mandate.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {useCases.map((useCase) => (
            <div
              key={useCase.title}
              className="rounded-2xl border border-[rgba(247,215,76,0.14)] bg-[rgba(12,13,20,0.85)] p-6"
            >
              <h3 className="text-lg font-semibold text-white">{useCase.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{useCase.description}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
