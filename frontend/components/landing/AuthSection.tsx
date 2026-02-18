"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { FiArrowRight, FiGrid } from "react-icons/fi";
import UserMenu from "@/components/auth/UserMenu";

export function LandingNav() {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <UserMenu />
      <Link
        href="/play"
        className="landing-cta-primary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold"
      >
        Launch Builder
        <FiArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  );
}

export function HeroAuthButtons() {
  const { isAuthenticated, isLoading, openAuthDialog } = useAuth();

  if (isLoading) return <div style={{ height: 44 }} aria-hidden="true" />;

  if (isAuthenticated) {
    return (
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/play" className="landing-cta-primary inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold sm:text-base">
          Start Building
          <FiArrowRight size={15} aria-hidden="true" />
        </Link>
        <Link href="/teams" className="landing-cta-secondary inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold sm:text-base">
          <FiGrid size={14} aria-hidden="true" />
          My Teams
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <Link href="/play" className="landing-cta-primary inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold sm:text-base">
        Start Building
        <FiArrowRight size={15} aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={() => openAuthDialog("sign-up")}
        className="landing-cta-secondary inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold sm:text-base"
      >
        Create Free Account
      </button>
    </div>
  );
}

export function AuthCTASection() {
  const { isAuthenticated, isLoading, user, openAuthDialog } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated) {
    return (
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-screen-md px-4 sm:px-6">
          <div className="panel relative overflow-hidden px-6 py-8 text-center sm:px-12">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
              Welcome back
            </p>
            <h2 className="font-display mt-1.5 text-2xl sm:text-3xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              {user?.name?.split(" ")[0] ?? "Trainer"}
            </h2>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/play" className="landing-cta-primary inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold">
                Launch Builder <FiArrowRight size={14} aria-hidden="true" />
              </Link>
              <Link href="/teams" className="landing-cta-secondary inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-semibold">
                <FiGrid size={14} aria-hidden="true" /> My Teams
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-screen-md px-4 sm:px-6">
        <div
          className="panel relative overflow-hidden px-6 py-10 text-center sm:px-12 sm:py-14"
          style={{ borderColor: "rgba(218,44,67,0.22)" }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(218,44,67,0.2) 0%, transparent 60%)" }}
          />
          <div className="relative">
            <div
              className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ background: "var(--accent-soft)", border: "1px solid rgba(218,44,67,0.32)" }}
              aria-hidden="true"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Save your teams. Share your strategy.
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Create a free account to sync teams across devices, get a public trainer profile, and never lose your builds.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => openAuthDialog("sign-up")}
                className="landing-cta-primary inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold"
              >
                Create Free Account
              </button>
              <button
                type="button"
                onClick={() => openAuthDialog("sign-in")}
                className="landing-cta-secondary inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-semibold"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FooterAuthLinks() {
  const { isAuthenticated, isLoading, openAuthDialog } = useAuth();
  if (isLoading || isAuthenticated) return null;
  return (
    <>
      <button type="button" onClick={() => openAuthDialog("sign-in")} className="landing-footer-link text-[0.72rem] font-medium">Sign In</button>
      <button type="button" onClick={() => openAuthDialog("sign-up")} className="landing-footer-link text-[0.72rem] font-medium">Sign Up</button>
    </>
  );
}
