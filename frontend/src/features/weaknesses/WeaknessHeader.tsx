import AppLink from "~/components/ui/AppLink";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import UserMenu from "@/components/auth/UserMenu";
import MobileSiteMenu from "@/components/ui/MobileSiteMenu";
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
          <AppLink
            href="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)", textDecoration: "none" }}
            aria-label="Back to home"
          >
            <FiArrowLeft size={18} aria-hidden="true" />
          </AppLink>
          <div className="min-w-0">
            <AppLink
              href="/"
              className="truncate font-display text-lg leading-none"
              style={{ letterSpacing: "-0.02em", textDecoration: "none" }}
              aria-label="Slatedex home"
            >
              <span style={{ color: "var(--text-primary)" }}>Slate</span>
              <span style={{ color: "var(--accent)" }}>dex</span>
            </AppLink>
            <p className="mt-1 truncate text-xs" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden min-[820px]:flex min-[820px]:items-center min-[820px]:gap-3">
            <UserMenu betweenThemeAndAuth={<DesktopToolsMenu />} />
          </div>
          <MobileSiteMenu
            items={[
              { href: "/play", label: "Launch Builder", description: "Build a team with coverage tools" },
              {
                href: "/weaknesses",
                label: "Weakness Tool",
                description: currentTool === "weaknesses" ? "You are here" : "Check full Pokemon weaknesses fast",
              },
              {
                href: "/type-chart",
                label: "Type Chart",
                description: currentTool === "type-chart" ? "You are here" : "See every type at a glance",
              },
            ]}
          />
          <AppLink
            href="/play"
            className="landing-cta-primary header-nav-button weakness-header-cta hidden min-[820px]:inline-flex items-center gap-1.5"
          >
            Launch Builder
            <FiArrowRight size={14} aria-hidden="true" />
          </AppLink>
        </div>
      </div>
    </header>
  );
}
