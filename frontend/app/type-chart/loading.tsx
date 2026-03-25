import WeaknessHeader from "@/app/weaknesses/WeaknessHeader";

export default function TypeChartLoading() {
  return (
    <div className="landing-page-shell min-h-screen">
      <div className="landing-page-blur-layer" aria-hidden="true" />
      <div className="landing-page-atmosphere" aria-hidden="true">
        <div className="landing-page-grid" />
        <div className="landing-hero-orb landing-hero-orb-a" />
        <div className="landing-hero-orb landing-hero-orb-b" />
      </div>

      <WeaknessHeader currentTool="type-chart" subtitle="Pokemon type chart" />

      <main className="relative z-[1] mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="weakness-tool-shell">
          <section className="panel weakness-tool-intro weakness-skeleton-block">
            <div className="weakness-skeleton-line weakness-skeleton-line--short" />
            <div className="weakness-skeleton-line weakness-skeleton-line--hero" />
            <div className="weakness-skeleton-line weakness-skeleton-line--medium" />
          </section>

          <div className="weakness-tool-layout">
            <section className="panel weakness-browser-panel">
              <div className="weakness-browser-toolbar">
                <div className="weakness-skeleton-search" />
                <div className="weakness-skeleton-chip-row">
                  <div className="weakness-skeleton-pill" />
                  <div className="weakness-skeleton-pill" />
                  <div className="weakness-skeleton-pill" />
                </div>
              </div>
              <div className="type-chart-type-grid type-chart-type-grid--loading">
                {Array.from({ length: 18 }).map((_, index) => (
                  <div key={index} className="weakness-skeleton-pill weakness-skeleton-pill--wide" />
                ))}
              </div>
            </section>

            <aside className="weakness-detail-column">
              <div className="panel weakness-detail-panel">
                <div className="weakness-bucket-grid">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="panel-soft weakness-bucket weakness-skeleton-block">
                      <div className="weakness-bucket-header">
                        <div className="flex flex-col gap-2">
                          <div className="weakness-skeleton-line weakness-skeleton-line--tiny" />
                          <div className="weakness-skeleton-line weakness-skeleton-line--short" />
                        </div>
                        <div className="weakness-skeleton-count" />
                      </div>
                      <div className="weakness-skeleton-chip-row">
                        <div className="weakness-skeleton-pill" />
                        <div className="weakness-skeleton-pill" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
