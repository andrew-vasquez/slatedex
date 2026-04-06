import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="panel max-w-md p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
          404
        </p>
        <h1 className="font-display mt-2 text-3xl" style={{ color: "var(--text-primary)" }}>
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          The route you requested does not exist or is no longer available.
        </p>
        <Link to="/" className="landing-cta-primary inline-flex mt-5">
          Go Home
        </Link>
      </div>
    </div>
  );
}
