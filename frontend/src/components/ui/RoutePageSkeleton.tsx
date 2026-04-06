interface RoutePageSkeletonProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  compact?: boolean;
}

export default function RoutePageSkeleton({
  eyebrow = "Loading",
  title = "Preparing your page",
  description = "Fetching data, warming route modules, and restoring your current view.",
  compact = false,
}: RoutePageSkeletonProps) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-gradient)" }} aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="panel p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded-full skeleton" />
              <div className="h-8 w-64 max-w-full rounded-2xl skeleton" />
              <div className="h-4 w-96 max-w-full rounded-full skeleton" />
            </div>
            <div className="h-10 w-10 rounded-2xl skeleton" />
          </div>
          <p className="sr-only">{eyebrow}. {title}. {description}</p>
        </div>

        <div className={`mt-4 grid gap-4 ${compact ? "lg:grid-cols-1" : "lg:grid-cols-[1.2fr_0.8fr]"}`}>
          <div className="space-y-4">
            <div className="panel p-4 sm:p-5">
              <div className="h-5 w-40 rounded-full skeleton" />
              <div className="mt-3 space-y-3">
                <div className="h-12 rounded-2xl skeleton" />
                <div className="h-12 rounded-2xl skeleton" />
                <div className="h-12 rounded-2xl skeleton" />
              </div>
            </div>
            <div className="panel p-4 sm:p-5">
              <div className="h-5 w-32 rounded-full skeleton" />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {Array.from({ length: compact ? 2 : 4 }).map((_, index) => (
                  <div key={index} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)" }}>
                    <div className="h-4 w-28 rounded-full skeleton" />
                    <div className="mt-3 h-16 rounded-2xl skeleton" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {!compact && (
            <div className="space-y-4">
              <div className="panel p-4 sm:p-5">
                <div className="h-5 w-36 rounded-full skeleton" />
                <div className="mt-3 space-y-3">
                  <div className="h-24 rounded-2xl skeleton" />
                  <div className="h-24 rounded-2xl skeleton" />
                </div>
              </div>
              <div className="panel p-4 sm:p-5">
                <div className="h-5 w-24 rounded-full skeleton" />
                <div className="mt-3 h-40 rounded-2xl skeleton" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
