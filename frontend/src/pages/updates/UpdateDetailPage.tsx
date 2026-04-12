import AppHeader from "@/components/ui/AppHeader";
import SiteFooter from "@/components/ui/SiteFooter";
import type { UpdateEntry } from "~/lib/updates";
import AppLink from "~/components/ui/AppLink";

export default function UpdateDetailPage({ entry }: { entry: UpdateEntry }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-gradient)" }}>
      <AppHeader
        mobileItems={[
          { href: "/updates", label: "Updates", description: "Browse devlogs and product changes" },
          { href: "/play", label: "Launch Builder", description: "Choose a game and build a team" },
          { href: "/weaknesses", label: "Weakness Tool", description: "Check Pokemon weaknesses fast" },
          { href: "/type-chart", label: "Type Chart", description: "See type strengths and weaknesses" },
        ]}
        backHref="/updates"
        backLabel="Back to updates"
        badge={entry.category}
      />

      <main className="relative z-[1] mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <article className="panel overflow-hidden p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
            <span>{entry.eyebrow}</span>
            <span aria-hidden="true">•</span>
            <span>{entry.category}</span>
          </div>

          <h1 className="font-display mt-3 text-3xl sm:text-4xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            {entry.title}
          </h1>

          <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-secondary)" }}>
            {entry.summary}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-b py-4 text-sm" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            <span>{new Date(entry.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            <span aria-hidden="true">•</span>
            <span>{entry.readTime}</span>
            <span aria-hidden="true">•</span>
            <span>By {entry.author}</span>
          </div>

          <div className="mt-8 space-y-8">
            {entry.sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-display text-xl sm:text-2xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  {section.title}
                </h2>
                <div className="mt-3 space-y-4 text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-secondary)" }}>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-[1.5rem] border p-5 sm:p-6" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
              Keep following along
            </p>
            <h3 className="font-display mt-2 text-2xl" style={{ color: "var(--text-primary)" }}>
              More updates are coming
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Slatedex is still early, which means the best time to shape it is now. Check back here for future devlogs, release notes, and feature updates.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <AppLink href="/updates" className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: "var(--accent)", color: "white", textDecoration: "none" }}>
                Back to updates
              </AppLink>
              <AppLink href="/play" className="btn-secondary text-sm">
                Open builder
              </AppLink>
            </div>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
