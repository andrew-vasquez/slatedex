import { useFeedback } from "@/components/feedback/FeedbackWidget";
import { useAuth } from "@/components/providers/AuthProvider";
import AppLink from "~/components/ui/AppLink";

export default function SiteFooter() {
  const { openFeedback } = useFeedback();
  const { isAuthenticated, isLoading, openAuthDialog } = useAuth();

  return (
    <footer className="relative z-[1] border-t py-8" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
          <AppLink
            href="/"
            className="font-display text-lg leading-none"
            style={{ letterSpacing: "-0.02em", textDecoration: "none" }}
            aria-label="Slatedex home"
          >
            <span style={{ color: "var(--text-primary)" }}>Slate</span>
            <span style={{ color: "var(--accent)" }}>dex</span>
          </AppLink>

          <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6" aria-label="Footer navigation">
            <AppLink href="/play" className="landing-footer-link text-[0.72rem] font-medium">Builder</AppLink>
            <AppLink href="/weaknesses" className="landing-footer-link text-[0.72rem] font-medium">Weaknesses</AppLink>
            <AppLink href="/type-chart" className="landing-footer-link text-[0.72rem] font-medium">Type Chart</AppLink>
            <AppLink href="/updates" className="landing-footer-link text-[0.72rem] font-medium">Updates</AppLink>
            <button type="button" onClick={openFeedback} className="landing-footer-link text-[0.72rem] font-medium">Feedback</button>
            <AppLink href="/terms" className="landing-footer-link text-[0.72rem] font-medium">Terms</AppLink>
            <AppLink href="/privacy" className="landing-footer-link text-[0.72rem] font-medium">Privacy</AppLink>
            {!isLoading && !isAuthenticated ? (
              <>
                <button type="button" onClick={() => openAuthDialog("sign-in")} className="landing-footer-link text-[0.72rem] font-medium">Sign In</button>
                <button type="button" onClick={() => openAuthDialog("sign-up")} className="landing-footer-link text-[0.72rem] font-medium">Sign Up</button>
              </>
            ) : null}
          </nav>

          <p className="text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} Slatedex
          </p>
        </div>
      </div>
    </footer>
  );
}
