export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--surface-0)" }}>
      {/* Header skeleton */}
      <div className="glass sticky top-0 z-40 border-b border-[var(--border)]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="skeleton w-5 h-5 rounded" />
              <div className="skeleton w-24 h-5 rounded" />
            </div>
            <div className="flex items-center gap-3">
              <div className="skeleton w-20 h-4 rounded" />
              <div className="flex gap-2">
                <div className="skeleton w-24 h-9 rounded-lg" />
                <div className="skeleton w-20 h-9 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* Pokemon selection skeleton */}
          <div className="rounded-2xl p-5 sm:p-6" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="skeleton w-40 h-6 rounded" />
                <div className="skeleton w-10 h-5 rounded-md" />
              </div>
              <div className="skeleton w-48 h-10 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ background: "var(--surface-2)", animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="skeleton w-14 h-14 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton w-24 h-4 rounded" />
                      <div className="flex gap-1.5">
                        <div className="skeleton w-14 h-5 rounded-full" />
                        <div className="skeleton w-14 h-5 rounded-full" />
                      </div>
                      <div className="flex gap-2 mt-1">
                        <div className="skeleton flex-1 h-1.5 rounded-full" />
                        <div className="skeleton flex-1 h-1.5 rounded-full" />
                        <div className="skeleton flex-1 h-1.5 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team panel skeleton */}
          <div className="rounded-2xl p-5 sm:p-6" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="skeleton w-28 h-6 rounded" />
              <div className="skeleton w-12 h-6 rounded-full" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl aspect-square flex items-center justify-center"
                  style={{
                    background: "var(--surface-2)",
                    border: "2px dashed rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="skeleton w-10 h-10 rounded-full" style={{ opacity: 0.3 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
