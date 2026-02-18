"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createConsent,
  OPEN_COOKIE_PREFERENCES_EVENT,
  readCookieConsent,
  type CookieConsent,
  writeCookieConsent,
} from "@/lib/privacy";

interface DraftPreferences {
  analytics: boolean;
  marketing: boolean;
}

function toDraft(consent: CookieConsent | null): DraftPreferences {
  return {
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
  };
}

export default function CookieConsentManager() {
  const [isReady, setIsReady] = useState(false);
  const [savedConsent, setSavedConsent] = useState<CookieConsent | null>(null);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [draft, setDraft] = useState<DraftPreferences>({ analytics: false, marketing: false });

  useEffect(() => {
    const consent = readCookieConsent();
    setSavedConsent(consent);
    setDraft(toDraft(consent));
    setIsReady(true);
  }, []);

  useEffect(() => {
    const openModal = () => {
      setDraft(toDraft(savedConsent));
      setIsPreferencesOpen(true);
    };

    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openModal as EventListener);
    return () => {
      window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openModal as EventListener);
    };
  }, [savedConsent]);

  useEffect(() => {
    if (!isPreferencesOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsPreferencesOpen(false);
    };

    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("keydown", onEscape);
    };
  }, [isPreferencesOpen]);

  const persistConsent = useCallback((next: CookieConsent) => {
    writeCookieConsent(next);
    setSavedConsent(next);
    setDraft(toDraft(next));
    setIsPreferencesOpen(false);
  }, []);

  const handleAcceptAll = useCallback(() => {
    persistConsent(createConsent({ analytics: true, marketing: true }));
  }, [persistConsent]);

  const handleRejectNonEssential = useCallback(() => {
    persistConsent(createConsent({ analytics: false, marketing: false }));
  }, [persistConsent]);

  const hasSavedConsent = useMemo(() => savedConsent !== null, [savedConsent]);

  if (!isReady) return null;

  return (
    <>
      {!hasSavedConsent && (
        <section className="cookie-banner glass" role="dialog" aria-modal="false" aria-labelledby="cookie-banner-title">
          <div className="cookie-banner__content">
            <h2 id="cookie-banner-title" className="font-display text-sm" style={{ color: "var(--text-primary)" }}>
              Your privacy choices
            </h2>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              We use essential storage for core app features, and optional cookies for analytics and marketing.
              You can choose what to allow.
            </p>
            <p className="mt-1 text-[0.68rem]" style={{ color: "var(--text-muted)" }}>
              See our <Link href="/privacy" className="cookie-inline-link">Privacy Notice</Link>.
            </p>
          </div>

          <div className="cookie-banner__actions">
            <button type="button" className="btn-secondary" onClick={() => setIsPreferencesOpen(true)}>
              Manage
            </button>
            <button type="button" className="btn-secondary" onClick={handleRejectNonEssential}>
              Reject Optional
            </button>
            <button type="button" className="btn-danger" onClick={handleAcceptAll}>
              Accept All
            </button>
          </div>
        </section>
      )}

      {/* Cookie preferences can still be opened via the OPEN_COOKIE_PREFERENCES_EVENT (e.g. from a footer link) */}

      {isPreferencesOpen && (
        <div className="cookie-modal-backdrop" role="presentation" onClick={() => setIsPreferencesOpen(false)}>
          <section
            className="cookie-modal panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="cookie-modal-title" className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
              Cookie preferences
            </h2>
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              Required storage is always enabled. Optional categories can be changed anytime.
            </p>

            <div className="mt-4 flex flex-col gap-2.5">
              <label className="cookie-pref-row">
                <span>
                  <span className="cookie-pref-row__title">Required</span>
                  <span className="cookie-pref-row__desc">Needed for authentication, team saves, and app settings.</span>
                </span>
                <span className="cookie-pref-badge">Always On</span>
              </label>

              <label className="cookie-pref-row">
                <span>
                  <span className="cookie-pref-row__title">Analytics</span>
                  <span className="cookie-pref-row__desc">Helps us improve performance and features.</span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.analytics}
                  onChange={(event) => setDraft((prev) => ({ ...prev, analytics: event.target.checked }))}
                  aria-label="Enable analytics cookies"
                />
              </label>

              <label className="cookie-pref-row">
                <span>
                  <span className="cookie-pref-row__title">Marketing</span>
                  <span className="cookie-pref-row__desc">Supports campaign and referral measurement.</span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.marketing}
                  onChange={(event) => setDraft((prev) => ({ ...prev, marketing: event.target.checked }))}
                  aria-label="Enable marketing cookies"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setIsPreferencesOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn-secondary" onClick={handleRejectNonEssential}>
                Reject Optional
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => persistConsent(createConsent(draft))}
              >
                Save Preferences
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
