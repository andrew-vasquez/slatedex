export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="glass sticky top-0 z-40 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-screen-xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="skeleton h-8 w-8 rounded-xl" />
              <div>
                <div className="skeleton h-3 w-20 rounded" />
                <div className="mt-1 skeleton h-5 w-32 rounded" />
              </div>
            </div>
            <div className="hidden gap-2 sm:flex">
              <div className="skeleton h-8 w-20 rounded-xl" />
              <div className="skeleton h-8 w-24 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl px-4 pb-8 pt-4 sm:px-6">
        <div className="panel mb-4 p-4 sm:mb-5 sm:p-5">
          <div className="skeleton h-6 w-44 rounded" />
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="panel-soft p-3">
                <div className="skeleton h-2.5 w-24 rounded" />
                <div className="mt-2 skeleton h-7 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="panel mb-4 p-4 sm:mb-5 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="skeleton h-5 w-32 rounded" />
            <div className="hidden sm:block skeleton h-4 w-28 rounded" />
          </div>
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="panel-soft p-3">
                <div className="flex items-center gap-2.5">
                  <div className="skeleton h-12 w-12 rounded-lg shrink-0" />
                  <div className="flex-1">
                    <div className="skeleton h-3.5 w-20 rounded" />
                    <div className="mt-1 skeleton h-3 w-16 rounded" />
                  </div>
                </div>
                <div className="mt-3 skeleton h-8 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          <div className="panel p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="skeleton h-5 w-40 rounded" />
              <div className="skeleton h-10 w-44 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                  <div className="flex items-center gap-3">
                    <div className="skeleton h-14 w-14 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-24 rounded" />
                      <div className="flex gap-1">
                        <div className="skeleton h-4 w-12 rounded" />
                        <div className="skeleton h-4 w-12 rounded" />
                      </div>
                      <div className="flex gap-2">
                        <div className="skeleton h-1 flex-1 rounded-full" />
                        <div className="skeleton h-1 flex-1 rounded-full" />
                        <div className="skeleton h-1 flex-1 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="skeleton h-5 w-36 rounded" />
              <div className="skeleton h-6 w-12 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex aspect-square items-center justify-center rounded-xl border-2" style={{ borderStyle: "dashed", borderColor: "rgba(69, 51, 34, 0.28)", background: "var(--surface-2)" }}>
                  <div className="skeleton h-8 w-8 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel mt-4 p-4 sm:mt-5 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="skeleton h-5 w-36 rounded" />
              <div className="mt-1 skeleton h-3 w-52 rounded" />
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="skeleton h-3 w-14 rounded" />
              <div className="skeleton h-3 w-14 rounded" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9 sm:gap-2">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} className="skeleton aspect-square rounded-lg" />
                ))}
              </div>
            </div>

            <div className="panel-soft p-3.5">
              <div className="mb-3 flex items-center gap-2">
                <div className="skeleton h-6 w-6 rounded-md" />
                <div className="skeleton h-4 w-24 rounded" />
              </div>
              <div className="mb-3 grid grid-cols-3 gap-1.5">
                <div className="skeleton h-11 rounded-md" />
                <div className="skeleton h-11 rounded-md" />
                <div className="skeleton h-11 rounded-md" />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="mt-1.5 flex gap-1">
                    <div className="skeleton h-7 w-7 rounded" />
                    <div className="skeleton h-7 w-7 rounded" />
                    <div className="skeleton h-7 w-7 rounded" />
                  </div>
                </div>
                <div>
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="mt-1.5 flex gap-1">
                    <div className="skeleton h-7 w-7 rounded" />
                    <div className="skeleton h-7 w-7 rounded" />
                    <div className="skeleton h-7 w-7 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
