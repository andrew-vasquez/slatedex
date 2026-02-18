import type { Metadata } from "next";
import Link from "next/link";
import OpenCookiePreferencesButton from "@/components/privacy/OpenCookiePreferencesButton";

export const metadata: Metadata = {
  title: "Privacy Notice | Pokemon Team Builder",
  description: "Learn how Pokemon Team Builder uses cookies, local storage, and account data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <section className="panel p-5 sm:p-6">
        <h1 className="font-display text-2xl sm:text-3xl" style={{ color: "var(--text-primary)" }}>
          Privacy Notice
        </h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          This page explains what data is used by Pokemon Team Builder and how you can control optional cookies.
        </p>

        <div className="mt-5 space-y-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <section>
            <h2 className="font-display text-base" style={{ color: "var(--text-primary)" }}>Required Data</h2>
            <p className="mt-1">
              We store essential app preferences and team data needed to keep the builder functional, including
              authentication state and saved teams.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base" style={{ color: "var(--text-primary)" }}>Optional Cookies</h2>
            <p className="mt-1">
              Optional categories include analytics and marketing. These are off until you accept them.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base" style={{ color: "var(--text-primary)" }}>Manage Preferences</h2>
            <p className="mt-1">
              You can update your consent at any time.
            </p>
            <div className="mt-3">
              <OpenCookiePreferencesButton />
            </div>
          </section>
        </div>

        <div className="mt-6">
          <Link href="/" className="btn-secondary">
            Back to Team Builder
          </Link>
        </div>
      </section>
    </main>
  );
}
