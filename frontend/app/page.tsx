import type { Metadata } from "next";
import Link from "next/link";
import { FiShield, FiZap, FiGrid, FiStar } from "react-icons/fi";
import { LandingNav, HeroAuthButtons, AuthCTASection, FooterAuthLinks } from "@/components/landing/AuthSection";

export const metadata: Metadata = {
  title: "Slatedex — Pokémon Team Builder",
  description: "Build the perfect Pokémon team. Analyze type coverage, find defensive gaps, and get smart picks — across all 9 generations.",
};

const FEATURES = [
  {
    icon: <FiShield size={18} aria-hidden="true" />,
    title: "Defensive Coverage",
    body: "Instantly see where your team is weak or resistant across all 18 types — before the battle starts.",
  },
  {
    icon: <FiZap size={18} aria-hidden="true" />,
    title: "Smart Picks",
    body: "Get Pokémon recommendations that patch your team's specific holes, ranked by coverage score.",
  },
  {
    icon: <FiGrid size={18} aria-hidden="true" />,
    title: "9 Generations",
    body: "Full support for Gens 1–9 with accurate type history, regional dexes, and version exclusives.",
  },
  {
    icon: <FiStar size={18} aria-hidden="true" />,
    title: "Save & Sync",
    body: "Create a free account to save teams across devices and share your builds with a public profile.",
  },
];

const STEPS = [
  { num: "01", title: "Pick a generation", body: "Choose from any main-series game across Gens 1–9." },
  { num: "02", title: "Draft your six", body: "Search and add Pokémon. Drag to rearrange slots." },
  { num: "03", title: "Analyze the coverage", body: "The heatmap shows gaps. Smart picks fill them." },
];

const STATS = [
  "9 generations",
  "1,025+ Pokémon",
  "18-type coverage matrix",
  "Smart picks engine",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-gradient)" }}>
      {/* ── Sticky Nav ─────────────────────────────────────── */}
      <header className="glass sticky top-0 z-40 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="font-display text-xl leading-none"
            style={{ letterSpacing: "-0.025em", textDecoration: "none" }}
            aria-label="Slatedex home"
          >
            <span style={{ color: "var(--text-primary)" }}>Slate</span>
            <span style={{ color: "var(--accent)" }}>dex</span>
          </Link>
          <LandingNav />
        </div>
      </header>

      <main>
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden pb-20 pt-24 sm:pb-28 sm:pt-32">
          {/* Background glows */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div
              className="absolute -top-40 left-1/2 h-[44rem] w-[44rem] -translate-x-1/2 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(218,44,67,0.18) 0%, transparent 60%)", opacity: 0.7 }}
            />
            <div
              className="absolute top-1/3 -left-32 h-80 w-80 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(59,130,246,0.16) 0%, transparent 70%)", opacity: 0.5 }}
            />
            <div
              className="absolute bottom-0 left-1/2 h-px w-3/4 -translate-x-1/2"
              style={{ background: "linear-gradient(90deg, transparent, rgba(218,44,67,0.3), transparent)" }}
            />
          </div>

          <div className="relative mx-auto max-w-screen-md px-4 text-center sm:px-6">
            {/* Eyebrow badge */}
            <div
              className="landing-reveal mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
              style={{
                borderColor: "rgba(218,44,67,0.3)",
                background: "var(--accent-soft)",
                animationDelay: "0ms",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--accent)" }}
                aria-hidden="true"
              />
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>
                Free · No account required
              </span>
            </div>

            {/* Headline */}
            <h1
              className="landing-reveal font-display text-5xl leading-[1.04] sm:text-6xl lg:text-7xl"
              style={{ letterSpacing: "-0.03em", color: "var(--text-primary)", animationDelay: "60ms" }}
            >
              Build the team that
              <br />
              <span style={{ color: "var(--accent)" }}>wins before you play.</span>
            </h1>

            {/* Subhead */}
            <p
              className="landing-reveal mx-auto mt-5 max-w-lg text-base leading-relaxed sm:text-lg"
              style={{ color: "var(--text-secondary)", animationDelay: "120ms" }}
            >
              Slatedex is a tactical Pokémon team builder with live type coverage analysis, smart recommendations, and full generation support from Kanto to Paldea.
            </p>

            {/* CTAs — client island */}
            <div className="landing-reveal" style={{ animationDelay: "180ms" }}>
              <HeroAuthButtons />
            </div>

            {/* Stat strip */}
            <div
              className="landing-reveal mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
              style={{ animationDelay: "240ms" }}
            >
              {STATS.map((stat) => (
                <span key={stat} className="flex items-center gap-1.5 text-[0.72rem] font-semibold" style={{ color: "var(--text-muted)" }}>
                  <span style={{ color: "var(--accent)", fontSize: "0.5rem" }} aria-hidden="true">◈</span>
                  {stat}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────── */}
        <section className="py-16 sm:py-24" aria-labelledby="how-it-works-heading">
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
            <p
              id="how-it-works-heading"
              className="mb-8 text-center text-[0.62rem] font-semibold uppercase tracking-[0.24em]"
              style={{ color: "var(--text-muted)" }}
            >
              How it works
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <div key={step.num} className="landing-feature-card panel px-5 py-5" style={{ animationDelay: `${i * 60}ms` }}>
                  <div
                    className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl font-display text-sm font-bold"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid rgba(218,44,67,0.25)" }}
                    aria-hidden="true"
                  >
                    {step.num}
                  </div>
                  <h3 className="font-display text-[0.95rem] font-semibold" style={{ color: "var(--text-primary)" }}>
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────── */}
        <section className="py-16 sm:py-24" aria-labelledby="features-heading">
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
            <p
              className="mb-2 text-center text-[0.62rem] font-semibold uppercase tracking-[0.24em]"
              style={{ color: "var(--text-muted)" }}
            >
              Everything you need
            </p>
            <h2
              id="features-heading"
              className="font-display mb-10 text-center text-2xl sm:text-3xl"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}
            >
              Built for serious team planning.
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feat, i) => (
                <div
                  key={feat.title}
                  className="landing-feature-card panel px-5 py-5"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div
                    className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                    aria-hidden="true"
                  >
                    {feat.icon}
                  </div>
                  <h3 className="font-display text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {feat.title}
                  </h3>
                  <p className="mt-1.5 text-[0.78rem] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {feat.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Auth CTA — client island ────────────────────── */}
        <AuthCTASection />
      </main>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t py-8" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
            <Link
              href="/"
              className="font-display text-lg leading-none"
              style={{ letterSpacing: "-0.02em", textDecoration: "none" }}
              aria-label="Slatedex home"
            >
              <span style={{ color: "var(--text-primary)" }}>Slate</span>
              <span style={{ color: "var(--accent)" }}>dex</span>
            </Link>

            <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6" aria-label="Footer navigation">
              <Link href="/play" className="landing-footer-link text-[0.72rem] font-medium">Builder</Link>
              <Link href="/terms" className="landing-footer-link text-[0.72rem] font-medium">Terms</Link>
              <Link href="/privacy" className="landing-footer-link text-[0.72rem] font-medium">Privacy</Link>
              <FooterAuthLinks />
            </nav>

            <p className="text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
              © {new Date().getFullYear()} Slatedex
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
