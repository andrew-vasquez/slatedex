interface GameLoadingSkeletonProps {
  title?: string;
  subtitle?: string;
  compact?: boolean;
  overlay?: boolean;
}

export default function GameLoadingSkeleton({
  title = "Preparing your team builder",
  subtitle = "Loading Pokedex data, versions, and team tools for this game.",
  compact = false,
  overlay = false,
}: GameLoadingSkeletonProps) {
  const shellClassName = overlay
    ? "absolute inset-0 z-20 flex items-center justify-center bg-[rgba(6,9,20,0.74)] backdrop-blur-sm px-4"
    : "min-h-screen px-4 py-6 sm:px-6 sm:py-8";

  return (
    <div className={shellClassName} aria-live="polite" aria-busy="true">
      <div className="mx-auto w-full max-w-screen-xl">
        <div className="panel-soft border p-4 sm:p-5" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="h-3 w-28 rounded-full skeleton" />
              <div className="h-8 w-64 max-w-full rounded-2xl skeleton" />
              <div className="h-4 w-80 max-w-full rounded-full skeleton" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-28 rounded-xl skeleton" />
              <div className="h-10 w-28 rounded-xl skeleton" />
            </div>
          </div>
        </div>

        <div className={`mt-4 lg:grid lg:grid-cols-[1fr_440px] lg:gap-6 ${compact ? "opacity-95" : ""}`}>
          <div className="space-y-4">
            <div className="panel border p-4" style={{ borderColor: "var(--border)" }}>
              <div className="flex flex-wrap gap-2">
                <div className="h-10 w-full rounded-xl skeleton" />
                <div className="h-9 w-28 rounded-xl skeleton" />
                <div className="h-9 w-36 rounded-xl skeleton" />
                <div className="h-9 w-24 rounded-xl skeleton" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: compact ? 3 : 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border p-3"
                    style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl skeleton" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-2/3 rounded-full skeleton" />
                        <div className="h-3 w-1/2 rounded-full skeleton" />
                      </div>
                    </div>
                    <div className="mt-3 flex gap-1.5">
                      <div className="h-5 w-12 rounded-full skeleton" />
                      <div className="h-5 w-14 rounded-full skeleton" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!compact && (
              <div className="panel border p-4" style={{ borderColor: "var(--border)" }}>
                <div className="h-5 w-44 rounded-full skeleton" />
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="h-44 rounded-2xl skeleton" />
                  <div className="h-44 rounded-2xl skeleton" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 lg:mt-0">
            <div className="panel border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                    {title}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {subtitle}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-2xl skeleton" />
              </div>
              <div className="mt-4 space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-xl border p-2.5" style={{ borderColor: "var(--border)" }}>
                    <div className="h-11 w-11 rounded-2xl skeleton" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-28 rounded-full skeleton" />
                      <div className="h-3 w-20 rounded-full skeleton" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
