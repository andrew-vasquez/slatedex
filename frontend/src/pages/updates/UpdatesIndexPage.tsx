import AppHeader from "@/components/ui/AppHeader";
import SiteFooter from "@/components/ui/SiteFooter";
import { updates } from "~/lib/updates";
import AppLink from "~/components/ui/AppLink";

export default function UpdatesIndexPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-gradient)" }}>
      <AppHeader
        mobileItems={[
          { href: "/play", label: "Launch Builder", description: "Choose a game and build a team" },
          { href: "/weaknesses", label: "Weakness Tool", description: "Check Pokemon weaknesses fast" },
          { href: "/type-chart", label: "Type Chart", description: "See type strengths and weaknesses" },
          { href: "/updates", label: "Updates", description: "Follow devlogs and product changes" },
        ]}
        badge="Updates"
      />

      <main className="relative z-[1] mx-auto max-w-screen-xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="mx-auto max-w-3xl text-center">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-muted)" }}>
            Slatedex updates
          </p>
          <h1 className="font-display mt-3 text-3xl sm:text-5xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            Devlogs, release notes, and what is shipping next
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-secondary)" }}>
            A running look at how Slatedex is evolving, what is improving behind the scenes, and where the product is heading.
          </p>
        </section>

        <section className="mx-auto mt-10 grid max-w-4xl gap-5">
          {updates.map((entry) => (
            <article key={entry.slug} className="panel group overflow-hidden p-5 transition hover:-translate-y-0.5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                <span>{entry.category}</span>
                <span aria-hidden="true">•</span>
                <span>{entry.eyebrow}</span>
              </div>

              <h2 className="font-display mt-3 text-2xl sm:text-3xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                <AppLink href={`/updates/${entry.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  {entry.title}
                </AppLink>
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-relaxed sm:text-[0.98rem]" style={{ color: "var(--text-secondary)" }}>
                {entry.summary}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm" style={{ borderColor: "var(--border)" }}>
                <div className="flex flex-wrap items-center gap-2" style={{ color: "var(--text-muted)" }}>
                  <span>{new Date(entry.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                  <span aria-hidden="true">•</span>
                  <span>{entry.readTime}</span>
                  <span aria-hidden="true">•</span>
                  <span>By {entry.author}</span>
                </div>

                <AppLink href={`/updates/${entry.slug}`} className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: "var(--accent-soft)", color: "var(--accent)", textDecoration: "none" }}>
                  Read update
                </AppLink>
              </div>
            </article>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
