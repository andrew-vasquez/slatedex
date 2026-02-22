const TEAM_SLOTS = 6;
const POKEMON_CARDS = 8;

export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--surface-0)" }}>
      <header
        className="glass sticky top-0 z-40 border-b lg:fixed lg:left-0 lg:right-0"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mx-auto max-w-screen-xl px-4 py-2.5 sm:px-6 lg:py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="skeleton h-8 w-8 shrink-0 rounded-xl" />
              <div className="skeleton hidden h-5 w-20 rounded sm:block" />
              <div className="skeleton h-6 w-28 rounded-md" />
              <div className="hidden min-w-0 items-center gap-2 sm:flex">
                <div className="skeleton h-1.5 w-28 rounded-full" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="skeleton hidden h-8 w-24 rounded-lg sm:block" />
              <div className="skeleton h-8 w-8 rounded-full sm:h-8 sm:w-20 sm:rounded-lg" />
              <div className="skeleton h-8 w-8 rounded-full sm:h-8 sm:w-20 sm:rounded-lg" />
              <div className="skeleton h-8 w-8 rounded-full" />
              <div className="skeleton h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      </header>

      <main
        className="mx-auto max-w-screen-xl px-4 pb-24 pt-4 sm:px-6 lg:pb-8 lg:pt-28"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="lg:grid lg:grid-cols-[1fr_440px] lg:items-start lg:gap-6">
          <section className="flex min-w-0 flex-col gap-4 lg:order-1" aria-hidden="true">
            <div className="panel p-3.5 sm:p-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="skeleton h-5 w-48 rounded" />
                  <div className="skeleton h-3.5 w-64 rounded" />
                </div>
                <div className="hidden items-center gap-1.5 sm:flex">
                  <div className="skeleton h-6 w-20 rounded-md" />
                  <div className="skeleton h-6 w-10 rounded-md" />
                </div>
              </div>

              <div className="skeleton mb-2.5 h-10 w-full rounded-xl" />
              <div className="mb-2 flex items-center gap-2">
                <div className="skeleton h-7 w-28 rounded-lg" />
                <div className="skeleton h-7 w-32 rounded-lg" />
              </div>

              <div className="mb-2.5 space-y-1.5">
                <div className="skeleton h-3 w-12 rounded" />
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="skeleton h-12 rounded-lg" />
                  <div className="skeleton h-12 rounded-lg" />
                  <div className="skeleton h-12 rounded-lg" />
                </div>
              </div>

              <div className="mb-2.5 space-y-1.5">
                <div className="skeleton h-3 w-14 rounded" />
                <div className="flex flex-wrap gap-1.5">
                  <div className="skeleton h-8 w-12 rounded-lg" />
                  <div className="skeleton h-8 w-14 rounded-lg" />
                  <div className="skeleton h-8 w-24 rounded-lg" />
                </div>
              </div>

              <div className="skeleton h-9 w-full rounded-xl" />
            </div>

            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
              {Array.from({ length: POKEMON_CARDS }).map((_, index) => (
                <article
                  key={index}
                  className="rounded-xl border px-3 py-2.5"
                  style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="skeleton h-12 w-12 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="skeleton h-4 w-24 rounded" />
                      <div className="flex gap-1.5">
                        <div className="skeleton h-4 w-10 rounded" />
                        <div className="skeleton h-4 w-10 rounded" />
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="skeleton h-1.5 rounded-full" />
                        <div className="skeleton h-1.5 rounded-full" />
                        <div className="skeleton h-1.5 rounded-full" />
                      </div>
                    </div>
                    <div className="skeleton h-7 w-7 rounded-full" />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="hidden lg:order-2 lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-28" aria-hidden="true">
            <section className="panel p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="skeleton h-5 w-24 rounded" />
                  <div className="skeleton h-3 w-44 rounded" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="skeleton h-8 w-24 rounded-lg" />
                  <div className="skeleton h-8 w-10 rounded-full" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: TEAM_SLOTS }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-xl border-2 px-2 py-3"
                    style={{
                      borderColor: "rgba(148, 163, 184, 0.3)",
                      borderStyle: "dashed",
                      background: "var(--surface-2)",
                    }}
                  >
                    <div className="mx-auto mb-2 skeleton h-6 w-6 rounded-full" />
                    <div className="skeleton mx-auto h-3 w-12 rounded" />
                    <div className="mt-1 skeleton mx-auto h-2.5 w-16 rounded" />
                  </div>
                ))}
              </div>
            </section>

            <section className="panel p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="skeleton h-3.5 w-12 rounded" />
                <div className="skeleton h-5 w-10 rounded" />
              </div>
              <div className="skeleton mb-3 h-1.5 w-full rounded-full" />

              <div className="grid grid-cols-2 gap-1.5">
                <div className="skeleton h-8 rounded-lg" />
                <div className="skeleton h-8 rounded-lg" />
                <div className="skeleton h-8 rounded-lg" />
                <div className="skeleton h-8 rounded-lg" />
              </div>
              <div className="skeleton mt-2 h-8 w-full rounded-xl" />
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
