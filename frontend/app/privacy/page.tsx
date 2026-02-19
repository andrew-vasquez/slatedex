import type { Metadata } from "next";
import Link from "next/link";
import OpenCookiePreferencesButton from "@/app/privacy/OpenCookiePreferencesButton";
import Breadcrumb from "@/components/ui/Breadcrumb";

export const metadata: Metadata = {
  title: "Privacy Policy | Slatedex",
  description: "Learn how Slatedex collects, uses, and protects your data.",
};

const LAST_UPDATED = "February 18, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-gradient)" }}>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumb
          items={[{ label: "Slatedex", href: "/" }, { label: "Privacy Policy" }]}
          className="mb-6"
        />

        <div className="panel p-6 sm:p-8">
          {/* Header */}
          <div className="mb-8 border-b pb-6" style={{ borderColor: "var(--border)" }}>
            <Link href="/" className="font-display text-2xl leading-none" style={{ letterSpacing: "-0.025em", textDecoration: "none" }}>
              <span style={{ color: "var(--text-primary)" }}>Slate</span>
              <span style={{ color: "var(--accent)" }}>dex</span>
            </Link>
            <h1 className="font-display mt-3 text-2xl sm:text-3xl" style={{ color: "var(--text-primary)" }}>
              Privacy Policy
            </h1>
            <p className="mt-1.5 text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
              Last updated: {LAST_UPDATED}
            </p>
          </div>

          <div className="mb-6">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Your privacy matters to us. This policy explains what data Slatedex collects, why we collect it, and how you can control it. We are committed to handling your data responsibly and transparently.
            </p>
          </div>

          <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {/* 1. What we collect */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                1. Information We Collect
              </h2>
              <p className="mb-3">We collect the following categories of data:</p>

              <div className="space-y-3">
                <div className="rounded-xl border p-3.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                  <p className="font-semibold text-[0.78rem] mb-1" style={{ color: "var(--text-primary)" }}>Account Information</p>
                  <p>When you create an account, we collect your name, email address, and a hashed version of your password. If you authenticate via OAuth (e.g., Google, Discord), we receive your name, email, and profile image from that provider.</p>
                </div>
                <div className="rounded-xl border p-3.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                  <p className="font-semibold text-[0.78rem] mb-1" style={{ color: "var(--text-primary)" }}>Profile Data</p>
                  <p>Your username, bio, avatar preferences, favorite games, favorite Pokémon, and saved teams are stored to power your public profile and team sync features.</p>
                </div>
                <div className="rounded-xl border p-3.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                  <p className="font-semibold text-[0.78rem] mb-1" style={{ color: "var(--text-primary)" }}>Team Data</p>
                  <p>Teams you save are stored on our servers, including the Pokémon in each slot, game and generation selection, and team name. This data is tied to your account.</p>
                </div>
                <div className="rounded-xl border p-3.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                  <p className="font-semibold text-[0.78rem] mb-1" style={{ color: "var(--text-primary)" }}>Local Storage (No Account Required)</p>
                  <p>Even without an account, teams and preferences are stored locally in your browser using <code className="rounded px-1 text-[0.7rem]" style={{ background: "var(--surface-3)" }}>localStorage</code>. This data stays on your device and is never sent to our servers unless you create an account and sync.</p>
                </div>
                <div className="rounded-xl border p-3.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                  <p className="font-semibold text-[0.78rem] mb-1" style={{ color: "var(--text-primary)" }}>Usage Data (Optional)</p>
                  <p>With your consent, we may collect anonymous analytics data such as page visits and feature usage through third-party analytics tools. This is always opt-in and can be managed through your cookie preferences.</p>
                </div>
              </div>
            </section>

            {/* 2. How we use it */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                2. How We Use Your Data
              </h2>
              <ul className="list-disc list-outside pl-4 space-y-1.5">
                <li>To authenticate you and maintain your session.</li>
                <li>To store and sync your saved teams across devices.</li>
                <li>To display your public trainer profile to other users.</li>
                <li>To enforce username change limits and prevent abuse.</li>
                <li>To improve the service using aggregated, anonymized analytics (only with your consent).</li>
                <li>To send transactional emails such as password resets (we do not send marketing emails without your explicit consent).</li>
              </ul>
            </section>

            {/* 3. Data sharing */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                3. Data Sharing
              </h2>
              <p>
                We do not sell your personal data. We share data only with service providers necessary to operate Slatedex, such as our database provider (Neon), hosting platform (Vercel / Railway), and email delivery service (Resend). These providers are bound by appropriate data processing agreements.
              </p>
              <p className="mt-2">
                Your public profile — including username, bio, avatar, and public teams — is visible to anyone with the link. You control what you include in your profile.
              </p>
            </section>

            {/* 4. Cookies */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                4. Cookies &amp; Local Storage
              </h2>
              <p className="mb-3">We use the following types of storage:</p>
              <ul className="list-disc list-outside pl-4 space-y-1.5">
                <li><strong style={{ color: "var(--text-primary)" }}>Session cookies</strong> — Required for authentication. These are set when you sign in and expire when your session ends.</li>
                <li><strong style={{ color: "var(--text-primary)" }}>localStorage</strong> — Used to store your local teams, theme preference, and app settings. No account required. Data stays on your device.</li>
                <li><strong style={{ color: "var(--text-primary)" }}>Analytics cookies</strong> — Optional. Used to understand how the app is used. Only set after you give consent.</li>
              </ul>
              <div className="mt-4">
                <OpenCookiePreferencesButton />
              </div>
            </section>

            {/* 5. Data retention */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                5. Data Retention
              </h2>
              <p>
                We retain your account data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or compliance reasons.
              </p>
            </section>

            {/* 6. Your rights */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                6. Your Rights
              </h2>
              <p className="mb-2">Depending on your location, you may have the right to:</p>
              <ul className="list-disc list-outside pl-4 space-y-1.5">
                <li>Access the personal data we hold about you.</li>
                <li>Request correction of inaccurate data.</li>
                <li>Request deletion of your account and associated data.</li>
                <li>Object to or restrict certain types of processing.</li>
                <li>Export your data in a portable format.</li>
              </ul>
              <p className="mt-2">
                To exercise any of these rights, contact us through the platform. We will respond within 30 days.
              </p>
            </section>

            {/* 7. Children */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                7. Children&apos;s Privacy
              </h2>
              <p>
                Slatedex is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately.
              </p>
            </section>

            {/* 8. Changes */}
            <section>
              <h2 className="font-display text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                8. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy as our service evolves. We will update the &quot;Last updated&quot; date at the top and, where appropriate, notify you of significant changes through the app.
              </p>
            </section>
          </div>

          {/* Footer nav */}
          <div className="mt-8 flex flex-wrap gap-3 border-t pt-6" style={{ borderColor: "var(--border)" }}>
            <Link href="/" className="btn-secondary text-[0.72rem]">
              Back to Team Builder
            </Link>
            <Link href="/terms" className="btn-secondary text-[0.72rem]">
              Terms of Service
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
