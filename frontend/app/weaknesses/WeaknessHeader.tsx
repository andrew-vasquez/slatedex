import Link from "next/link";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import UserMenu from "@/components/auth/UserMenu";
import MobileHeaderMenu from "@/app/weaknesses/MobileHeaderMenu";

export default function WeaknessHeader() {
  return (
    <header className="glass sticky top-0 z-40 border-b" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)", textDecoration: "none" }}
            aria-label="Back to home"
          >
            <FiArrowLeft size={18} aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <Link
              href="/"
              className="font-display text-lg leading-none"
              style={{ letterSpacing: "-0.02em", textDecoration: "none" }}
              aria-label="Slatedex home"
            >
              <span style={{ color: "var(--text-primary)" }}>Slate</span>
              <span style={{ color: "var(--accent)" }}>dex</span>
            </Link>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Pokemon weakness lookup
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <UserMenu />
          <MobileHeaderMenu />
          <Link
            href="/play"
            className="landing-cta-primary weakness-header-cta weakness-header-cta-desktop inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold"
          >
            Launch Builder
            <FiArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
