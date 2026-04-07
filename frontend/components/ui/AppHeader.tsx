import { FiArrowLeft } from "react-icons/fi";
import type { ReactNode } from "react";
import UserMenu from "@/components/auth/UserMenu";
import DesktopToolsMenu from "@/components/ui/DesktopToolsMenu";
import MobileSiteMenu, { type MobileSiteMenuItem } from "@/components/ui/MobileSiteMenu";
import SlatedexBrand from "@/components/ui/SlatedexBrand";
import AppLink from "~/components/ui/AppLink";

interface AppHeaderProps {
  mobileItems: MobileSiteMenuItem[];
  maxWidthClassName?: string;
  backHref?: string;
  backLabel?: string;
  badge?: string;
  bottomSlot?: ReactNode;
  leftSlot?: ReactNode;
}

export default function AppHeader({
  mobileItems,
  maxWidthClassName = "max-w-screen-xl",
  backHref,
  backLabel = "Go back",
  badge,
  bottomSlot = null,
  leftSlot = null,
}: AppHeaderProps) {
  const resolvedLeftSlot = leftSlot ?? (
    <>
      {backHref ? (
        <AppLink href={backHref} className="app-header-back" aria-label={backLabel}>
          <FiArrowLeft size={16} aria-hidden="true" />
        </AppLink>
      ) : null}
      <SlatedexBrand compact titleClassName="text-[1rem] sm:text-[1.05rem]" iconScaleClassName="h-[0.8rem] w-[0.8rem]" />
      {badge ? <span className="app-header-badge">{badge}</span> : null}
    </>
  );

  return (
    <>
      <header className="app-header glass sticky top-0 z-40 border-b" style={{ borderColor: "var(--border)" }}>
        <div className={`app-header-shell ${maxWidthClassName}`.trim()}>
          <div className="app-header-row">
            <div className="app-header-left">{resolvedLeftSlot}</div>
            <div className="app-header-right">
              <MobileSiteMenu items={mobileItems} />
              <div className="hidden min-[820px]:flex min-[820px]:items-center min-[820px]:gap-3">
                <UserMenu betweenThemeAndAuth={<DesktopToolsMenu />} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {bottomSlot ? (
        <div className="app-header-support">
          <div className={`app-header-shell ${maxWidthClassName}`.trim()}>
            <div className="app-header-bottom">{bottomSlot}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
