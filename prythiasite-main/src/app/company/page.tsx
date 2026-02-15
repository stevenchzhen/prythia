import SiteShell from "@/components/SiteShell";

const values = [
  {
    title: "Signal Integrity",
    description: "We never ship an alert without provenance, context, and confidence.",
  },
  {
    title: "Operator Empathy",
    description: "Built by traders and engineers who understand latency and risk.",
  },
  {
    title: "Relentless Rigor",
    description: "Model updates are tested against real-world outcomes, not backtests alone.",
  },
];

const contactPoints = [
  {
    label: "Sales",
    value: "sales@pythia.com",
  },
  {
    label: "Partnerships",
    value: "partners@pythia.com",
  },
  {
    label: "Press",
    value: "press@pythia.com",
  },
];

export default function CompanyPage() {
  return (
    <SiteShell>
      <section className="grid gap-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[rgba(247,215,76,0.8)]">Company</p>
        <h1 className="text-4xl font-semibold text-white md:text-5xl">
          We exist to decode markets with precision.
        </h1>
        <p className="max-w-3xl text-lg text-zinc-300">
          Prythia is a research-first company building signal intelligence for the world’s most demanding
          market operators.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {values.map((value) => (
          <div
            key={value.title}
            className="rounded-3xl border border-[rgba(247,215,76,0.16)] bg-[rgba(12,13,20,0.85)] p-6"
          >
            <h2 className="text-xl font-semibold text-white">{value.title}</h2>
            <p className="mt-3 text-sm text-zinc-400">{value.description}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-8 rounded-3xl border border-[rgba(247,215,76,0.2)] bg-[rgba(12,13,20,0.9)] p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[rgba(247,215,76,0.8)]">Contact</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            Let’s design your signal stack.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {contactPoints.map((contact) => (
            <div key={contact.label} className="rounded-2xl bg-[rgba(6,7,10,0.75)] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{contact.label}</p>
              <p className="mt-2 text-sm text-zinc-300">{contact.value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <button className="rounded-full bg-[rgba(247,215,76,0.95)] px-6 py-3 text-sm font-semibold text-black">
            Schedule intro
          </button>
          <button className="rounded-full border border-[rgba(247,215,76,0.4)] px-6 py-3 text-sm font-semibold text-[rgba(247,215,76,0.9)]">
            Join updates
          </button>
        </div>
      </section>
    </SiteShell>
  );
}
