import SiteShell from "@/components/SiteShell";

const tiers = [
  {
    title: "Pilot",
    price: "Invite only",
    description: "2 desks · 30-day signal feed · shared analyst support.",
    highlights: ["Signal preview", "Slack + email alerts", "Monthly strategy review"],
  },
  {
    title: "Institution",
    price: "Custom",
    description: "Full signal fabric with dedicated coverage and integrations.",
    highlights: ["Unlimited desks", "API + OMS integration", "Dedicated quant partner"],
  },
  {
    title: "Enterprise",
    price: "Custom",
    description: "Global deployment with SLAs and co-developed models.",
    highlights: ["Private inference mesh", "On-prem option", "24/7 escalation"],
  },
];

const accessSteps = [
  {
    title: "Discovery",
    description: "We map your strategy, mandate, and execution needs.",
  },
  {
    title: "Pilot",
    description: "Launch a scoped signal feed with measurable KPIs.",
  },
  {
    title: "Scale",
    description: "Expand to full coverage with custom integrations.",
  },
];

export default function PricingPage() {
  return (
    <SiteShell>
      <section className="grid gap-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[rgba(247,215,76,0.8)]">Pricing & Access</p>
        <h1 className="text-4xl font-semibold text-white md:text-5xl">
          Access is tailored to your mandate and scale.
        </h1>
        <p className="max-w-3xl text-lg text-zinc-300">
          Prythia partners with funds, desks, and treasuries that operate at speed. Choose the engagement
          model that matches your footprint.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.title}
            className="rounded-3xl border border-[rgba(247,215,76,0.16)] bg-[rgba(12,13,20,0.85)] p-6"
          >
            <h2 className="text-xl font-semibold text-white">{tier.title}</h2>
            <p className="mt-2 text-lg text-[rgba(247,215,76,0.9)]">{tier.price}</p>
            <p className="mt-3 text-sm text-zinc-400">{tier.description}</p>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-zinc-300">
              {tier.highlights.map((highlight) => (
                <li key={highlight} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[rgba(247,215,76,0.9)]" />
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="grid gap-8 rounded-3xl border border-[rgba(247,215,76,0.2)] bg-[rgba(12,13,20,0.9)] p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[rgba(247,215,76,0.8)]">Access Path</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            A structured path from discovery to scale.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {accessSteps.map((step, index) => (
            <div key={step.title} className="rounded-2xl bg-[rgba(6,7,10,0.75)] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Step {index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
