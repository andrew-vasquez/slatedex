import { FiShield, FiZap, FiGrid, FiStar, FiTarget, FiActivity } from "react-icons/fi";
import AppLink from "~/components/ui/AppLink";
import { LandingNav, HeroAuthButtons, AuthCTASection, FooterAuthLinks } from "~/features/home/AuthSection";
import HeroTypewriter from "~/features/home/HeroTypewriter";
import LiveMiniDemo from "~/features/home/LiveMiniDemo";
import SlatedexBrand from "@/components/ui/SlatedexBrand";

const FEATURES = [
  {
    icon: <FiTarget size={18} aria-hidden="true" />,
    title: "Filter-Legal Suggestions",
    body: "Recommendations follow your active game, dex mode, and version filters so AI advice stays legal.",
  },
  {
    icon: <FiShield size={18} aria-hidden="true" />,
    title: "Defensive Radar",
    body: "See weak points and resist windows across the full 18-type matrix before you lock a team.",
  },
  {
    icon: <FiZap size={18} aria-hidden="true" />,
    title: "AI Team Coach",
    body: "Chat for tactical guidance and run full analysis with contextual prompts tied to your current build.",
  },
  {
    icon: <FiActivity size={18} aria-hidden="true" />,
    title: "Capture Guide Context",
    body: "See where your targets are found in your selected version while refining team swaps.",
  },
  {
    icon: <FiGrid size={18} aria-hidden="true" />,
    title: "Generation + Version Accurate",
    body: "Built for multi-game generations and legacy type rules so your prep matches in-game reality.",
  },
  {
    icon: <FiStar size={18} aria-hidden="true" />,
    title: "Save & Sync",
    body: "Create a free account to save teams across devices and share your builds with a public profile.",
  },
];

const STEPS = [
  { num: "01", title: "Select your exact version", body: "Start with the game, dex mode, and filters you actually play." },
  { num: "02", title: "Build and tune your party", body: "Draft six, lock slots, compare options, and test coverage live." },
  { num: "03", title: "Run AI + capture validation", body: "Use coach analysis, then confirm where each pick is obtainable." },
];

const STATS = [
  "9 generations",
  "1,025+ Pokémon",
  "18-type coverage matrix",
  "Smart picks engine",
];
const SOCIAL_PROOF = ["50k+ teams built", "8k+ coach analyses/week", "Used across all 9 gens"];

export default function LandingPage() {
  return (
    <div className="landing-page-shell min-h-screen">
      <div className="landing-page-blur-layer" aria-hidden="true" />
      <div className="landing-page-atmosphere" aria-hidden="true">
        <div className="landing-page-grid" />
        <div className="landing-hero-orb landing-hero-orb-a" />
        <div className="landing-hero-orb landing-hero-orb-b" />
        <div className="landing-hero-orb landing-hero-orb-c" />
        <div className="landing-hero-scanline" />
      </div>
      {/* ── Sticky Nav ─────────────────────────────────────── */}
      <header className="glass sticky top-0 z-40 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3 sm:px-6">
          <SlatedexBrand titleClassName="text-[1.6rem] sm:text-[1.9rem]" iconScaleClassName="h-[1.02rem] w-[1.02rem]" />
          <LandingNav />
        </div>
      </header>

      <main className="relative z-[1]">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden pb-20 pt-24 sm:pb-28 sm:pt-32">
          <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6">
            <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10">
              <div className="text-center lg:text-left">
                <div
                  className="landing-reveal mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
                  style={{
                    borderColor: "rgba(218,44,67,0.3)",
                    background: "var(--accent-soft)",
                    animationDelay: "0ms",
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} aria-hidden="true" />
                  <span className="text-[0.6rem] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>
                    Team Prep Engine
                  </span>
                </div>

                <h1
                  className="landing-reveal landing-hero-title font-display text-4xl leading-[1.04] sm:text-6xl lg:text-7xl"
                  style={{ letterSpacing: "-0.03em", color: "var(--text-primary)", animationDelay: "50ms" }}
                >
                  <span className="landing-hero-title-static">Build before you play.</span>
                  <span className="landing-type-row">
                    <HeroTypewriter
                      lines={[
                        "Counter key threats first.",
                        "Plan six fast.",
                        "Lock coverage before battle.",
                      ]}
                    />
                  </span>
                </h1>

                <p
                  className="landing-reveal mt-5 max-w-2xl text-base leading-relaxed sm:text-lg lg:mx-0"
                  style={{ color: "var(--text-secondary)", animationDelay: "120ms" }}
                >
                  Build legal teams faster with version-accurate data, instant coverage feedback, and AI coaching anchored to your exact run context.
                </p>

                <div className="landing-reveal" style={{ animationDelay: "180ms" }}>
                  <HeroAuthButtons />
                </div>

                <div className="landing-reveal landing-metric-board mt-7" style={{ animationDelay: "220ms" }}>
                  <div className="landing-metric-row landing-metric-row-proof">
                    {SOCIAL_PROOF.map((item) => (
                      <span key={item} className="landing-stat-chip landing-stat-chip--proof">
                        <span className="landing-stat-dot" aria-hidden="true" />
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="landing-metric-row">
                    {STATS.map((stat) => (
                      <span key={stat} className="landing-stat-chip landing-stat-chip--metric">
                        <span className="landing-stat-dot" aria-hidden="true" />
                        {stat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:block">
                <LiveMiniDemo />
              </div>
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
              Built for team planning.
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      <footer className="relative z-[1] border-t py-8" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
            <AppLink
              href="/"
              className="font-display text-lg leading-none"
              style={{ letterSpacing: "-0.02em", textDecoration: "none" }}
              aria-label="Slatedex home"
            >
              <span style={{ color: "var(--text-primary)" }}>Slate</span>
              <span style={{ color: "var(--accent)" }}>dex</span>
            </AppLink>

            <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6" aria-label="Footer navigation">
              <AppLink href="/weaknesses" className="landing-footer-link text-[0.72rem] font-medium">Weaknesses</AppLink>
              <AppLink href="/play" className="landing-footer-link text-[0.72rem] font-medium">Builder</AppLink>
              <AppLink href="/terms" className="landing-footer-link text-[0.72rem] font-medium">Terms</AppLink>
              <AppLink href="/privacy" className="landing-footer-link text-[0.72rem] font-medium">Privacy</AppLink>
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
