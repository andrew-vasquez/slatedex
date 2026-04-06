import { Link } from "@tanstack/react-router";

interface SlatedexBrandProps {
  href?: string;
  titleClassName?: string;
  shellClassName?: string;
  compact?: boolean;
  iconScaleClassName?: string;
}

export default function SlatedexBrand({
  href = "/",
  titleClassName = "text-[2rem] sm:text-[2.45rem]",
  shellClassName = "",
  compact = false,
  iconScaleClassName = "h-[1.15rem] w-[1.15rem]",
}: SlatedexBrandProps) {
  return (
    <Link
      to={href}
      className={`slatedex-brand ${compact ? "slatedex-brand--compact" : ""} ${shellClassName}`.trim()}
      style={{ textDecoration: "none" }}
      aria-label="Go to Slatedex home"
    >
      <span className="slatedex-brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" className={`slatedex-brand-icon ${iconScaleClassName}`.trim()}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
          <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </span>
      <span className={`slatedex-brand-wordmark font-display leading-none ${titleClassName}`} style={{ letterSpacing: "-0.025em" }}>
        <span style={{ color: "var(--text-primary)" }}>Slate</span>
        <span style={{ color: "var(--accent)" }}>dex</span>
      </span>
    </Link>
  );
}
