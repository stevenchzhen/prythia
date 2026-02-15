import Link from "next/link";
import type { ReactNode } from "react";

const navLinks = [
  { label: "Product", href: "/product" },
  { label: "Solutions", href: "/solutions" },
  { label: "Technology", href: "/technology" },
  { label: "Pricing", href: "/pricing" },
  { label: "Company", href: "/company" },
];

type SiteShellProps = {
  children: ReactNode;
};

export default function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-70" />
        <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(247,215,76,0.28),_transparent_65%)]" />
        <div className="pointer-events-none absolute -bottom-48 left-0 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,216,74,0.18),_transparent_65%)]" />

        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(247,215,76,0.4)] bg-[rgba(12,13,20,0.7)] text-lg font-semibold">
              π
            </span>
            <div>
              <p className="text-lg font-semibold tracking-wide">Prythia</p>
              <p className="text-xs uppercase tracking-[0.16em] text-[rgba(247,215,76,0.7)]">
                Signal Intelligence
              </p>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-zinc-300 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} className="transition hover:text-white" href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <button className="rounded-full border border-[rgba(247,215,76,0.6)] bg-[rgba(247,215,76,0.1)] px-5 py-2 text-sm font-medium text-[rgba(247,215,76,0.9)] transition hover:bg-[rgba(247,215,76,0.2)]">
            Request Access
          </button>
        </header>

        <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-8">
          {children}
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
            <Link href="/privacy" className="transition-colors duration-150 hover:text-zinc-200">Privacy</Link>
            <Link href="/security" className="transition-colors duration-150 hover:text-zinc-200">Security</Link>
            <Link href="/careers" className="transition-colors duration-150 hover:text-zinc-200">Careers</Link>
            <Link href="/contact" className="transition-colors duration-150 hover:text-zinc-200">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
