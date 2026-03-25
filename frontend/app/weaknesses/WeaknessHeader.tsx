import Link from "next/link";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import UserMenu from "@/components/auth/UserMenu";
import MobileHeaderMenu from "@/app/weaknesses/MobileHeaderMenu";
import DesktopToolsMenu from "@/components/ui/DesktopToolsMenu";

interface WeaknessHeaderProps {
  subtitle?: string;
  currentTool?: "weaknesses" | "type-chart";
}

export default function WeaknessHeader({
  subtitle = "Pokemon weakness lookup",
  currentTool = "weaknesses",
}: WeaknessHeaderProps) {
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
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden min-[820px]:flex min-[820px]:items-center min-[820px]:gap-3">
            <DesktopToolsMenu />
            <UserMenu />
          </div>
          <MobileHeaderMenu currentTool={currentTool} />
          <Link
            href="/play"
            className="landing-cta-primary header-nav-button weakness-header-cta weakness-header-cta-desktop inline-flex items-center gap-1.5"
          >
            Launch Builder
            <FiArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
