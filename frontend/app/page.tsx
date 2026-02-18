"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import UserMenu from "@/components/auth/UserMenu";
import { FiArrowRight, FiShield, FiZap, FiGrid, FiStar, FiUsers } from "react-icons/fi";

const FEATURES = [
  {
    icon: <FiShield size={18} />,
    title: "Defensive Coverage",
    body: "Instantly see where your team is weak or resistant across all 18 types — before the battle starts.",
  },
  {
    icon: <FiZap size={18} />,
    title: "Smart Picks",
    body: "Get Pokémon recommendations that patch your team's specific holes, ranked by coverage score.",
  },
  {
    icon: <FiGrid size={18} />,
    title: "9 Generations",
    body: "Full support for Gens 1–9 with accurate type history, regional dexes, and version exclusives.",
  },
  {
    icon: <FiStar size={18} />,
    title: "Save & Sync",
    body: "Create a free account to save teams across devices and share your builds with a public profile.",
  },
];

const STEPS = [
  { num: "01", title: "Pick a generation", body: "Choose from any main-series game across Gens 1–9." },
  { num: "02", title: "Draft your six", body: "Search and add Pokémon. Drag to rearrange slots." },
  { num: "03", title: "Analyze the coverage", body: "The heatmap shows gaps. Smart picks fill them." },
];

export default function LandingPage() {
  const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-gradient)" }}>
      {/* ── Sticky Nav ─────────────────────────────────────────────── */}
      <header className="glass sticky top-0 z-40 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="font-display text-xl leading-none"
            style={{ letterSpacing: "-0.025em", textDecoration: "none" }}
          >
            <span style={{ color: "var(--text-primary)" }}>Slate</span>
            <span style={{ color: "var(--accent)" }}>dex</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <UserMenu />
            <Link
              href="/play"
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-opacity"
              style={{
                background: "var(--accent)",
                color: "#fff",
              }}
            >
              Launch Builder
              <FiArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pb-16 pt-20 sm:pb-24 sm:pt-28">
          {/* Background glows */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div
              className="absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-30"
              style={{ background: "radial-gradient(circle, rgba(218,44,67,0.22) 0%, transparent 65%)" }}
            />
            <div
              className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)" }}
            />
          </div>

          <div className="relative mx-auto max-w-screen-md px-4 text-center sm:px-6">
            {/* Eyebrow */}
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1"
              style={{ borderColor: "rgba(218,44,67,0.3)", background: "var(--accent-soft)" }}
            >
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
                Free · No account required to start
              </span>
            </div>

            <h1
              className="font-display text-5xl leading-[1.05] sm:text-7xl"
              style={{ letterSpacing: "-0.03em", color: "var(--text-primary)" }}
            >
              Build the team that
              <br />
              <span style={{ color: "var(--accent)" }}>wins before you play.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed sm:text-lg" style={{ color: "var(--text-secondary)" }}>
              Slatedex is a tactical Pokémon team builder with live type coverage analysis, smart recommendations, and full support for every main-series generation.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/play"
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold sm:text-base"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                Start Building
                <FiArrowRight size={15} />
              </Link>
              {!isLoading && !isAuthenticated && (
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold sm:text-base"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--surface-2)" }}
                >
                  Create Free Account
                </Link>
              )}
              {!isLoading && isAuthenticated && (
                <Link
                  href="/teams"
                  className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold sm:text-base"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--surface-2)" }}
                >
                  <FiGrid size={14} />
                  My Teams
                </Link>
              )}
            </div>

            {/* Stat strip */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {["9 generations", "1,025+ Pokémon", "18-type coverage matrix", "Smart picks engine"].map((stat) => (
                <span key={stat} className="flex items-center gap-1.5 text-[0.72rem] font-semibold" style={{ color: "var(--text-muted)" }}>
                  <span style={{ color: "var(--accent)", fontSize: "0.5rem" }}>◈</span>
                  {stat}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────────────── */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
            <p className="mb-8 text-center text-[0.65rem] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-muted)" }}>
              How it works
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {STEPS.map((step) => (
                <div
                  key={step.num}
                  className="panel px-5 py-5"
                >
                  <div
                    className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid rgba(218,44,67,0.25)" }}
                  >
                    {step.num}
                  </div>
                  <h3 className="font-display text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Feature grid ───────────────────────────────────────────── */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
            <p className="mb-2 text-center text-[0.65rem] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-muted)" }}>
              Everything you need
            </p>
            <h2 className="font-display mb-8 text-center text-2xl sm:text-3xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Built for serious team planning.
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feat) => (
                <div
                  key={feat.title}
                  className="panel px-5 py-5"
                >
                  <div
                    className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
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

        {/* ── Auth CTA (only for guests) ──────────────────────────────── */}
        {!isLoading && !isAuthenticated && (
          <section className="py-16 sm:py-20">
            <div className="mx-auto max-w-screen-md px-4 sm:px-6">
              <div
                className="panel overflow-hidden px-6 py-8 text-center sm:px-12 sm:py-12"
                style={{ borderColor: "rgba(218,44,67,0.2)" }}
              >
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(218,44,67,0.25) 0%, transparent 60%)" }}
                  />
                </div>
                <div className="relative">
                  <div
                    className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ background: "var(--accent-soft)", border: "1px solid rgba(218,44,67,0.3)" }}
                  >
                    <FiUsers size={20} style={{ color: "var(--accent)" }} />
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                    Save your teams. Share your strategy.
                  </h2>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    Create a free account to sync teams across devices, get a public trainer profile, and never lose your builds.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/signup"
                      className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold"
                      style={{ background: "var(--accent)", color: "#fff" }}
                    >
                      Create Free Account
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-semibold"
                      style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--surface-2)" }}
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Signed-in welcome back ──────────────────────────────────── */}
        {!isLoading && isAuthenticated && (
          <section className="py-16 sm:py-20">
            <div className="mx-auto max-w-screen-md px-4 sm:px-6">
              <div className="panel px-6 py-8 text-center sm:px-12">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
                  Welcome back
                </p>
                <h2 className="font-display mt-1.5 text-2xl sm:text-3xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  {user?.name?.split(" ")[0] ?? "Trainer"}
                </h2>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/play"
                    className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    Launch Builder
                    <FiArrowRight size={14} />
                  </Link>
                  <Link
                    href="/teams"
                    className="inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-semibold"
                    style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--surface-2)" }}
                  >
                    <FiGrid size={14} />
                    My Teams
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t py-8" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <Link
              href="/"
              className="font-display text-lg leading-none"
              style={{ letterSpacing: "-0.02em", textDecoration: "none" }}
            >
              <span style={{ color: "var(--text-primary)" }}>Slate</span>
              <span style={{ color: "var(--accent)" }}>dex</span>
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <Link href="/play" className="text-[0.72rem] font-medium transition-colors" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
                Builder
              </Link>
              <Link href="/terms" className="text-[0.72rem] font-medium transition-colors" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
                Terms
              </Link>
              <Link href="/privacy" className="text-[0.72rem] font-medium transition-colors" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
                Privacy
              </Link>
              {!isLoading && !isAuthenticated && (
                <>
                  <Link href="/login" className="text-[0.72rem] font-medium transition-colors" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
                    Sign In
                  </Link>
                  <Link href="/signup" className="text-[0.72rem] font-medium transition-colors" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
            <p className="text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
              © {new Date().getFullYear()} Slatedex
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
