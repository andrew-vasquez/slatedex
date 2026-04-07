import { useEffect, useState } from "react";
import { FiUser, FiShield, FiFileText, FiChevronRight } from "react-icons/fi";
import AppLink from "~/components/ui/AppLink";
import { useAuth } from "@/components/providers/AuthProvider";
import Breadcrumb from "@/components/ui/Breadcrumb";
import AppHeader from "@/components/ui/AppHeader";
import { fetchMyProfile, type UserRoleValue } from "@/lib/api";
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  createConsent,
  openCookiePreferences,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsent,
} from "@/lib/privacy";

interface SettingsItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  external?: boolean;
}

const SETTINGS_SECTIONS: { title: string; items: SettingsItem[] }[] = [
  {
    title: "Account",
    items: [
      {
        href: "/settings/profile",
        icon: <FiUser size={16} />,
        label: "Profile",
        description: "Username, bio, avatar, favorite games and Pokémon",
      },
    ],
  },
  {
    title: "Legal",
    items: [
      {
        href: "/terms",
        icon: <FiFileText size={16} />,
        label: "Terms of Service",
        description: "Rules and conditions for using Slatedex",
      },
      {
        href: "/privacy",
        icon: <FiShield size={16} />,
        label: "Privacy Policy",
        description: "How we collect, use, and protect your data",
      },
    ],
  },
];

export default function SettingsPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [cookieConsent, setCookieConsent] = useState<CookieConsent | null>(null);
  const [viewerRole, setViewerRole] = useState<UserRoleValue | null>(null);

  useEffect(() => {
    setCookieConsent(readCookieConsent());

    const onConsentUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<CookieConsent>;
      setCookieConsent(customEvent.detail ?? readCookieConsent());
    };

    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, onConsentUpdate as EventListener);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, onConsentUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setViewerRole(null);
      return;
    }

    let cancelled = false;
    fetchMyProfile()
      .then((profile) => {
        if (cancelled) return;
        setViewerRole(profile.role);
      })
      .catch(() => {
        if (cancelled) return;
        setViewerRole(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const updateConsent = (next: { analytics: boolean; marketing: boolean }) => {
    const consent = createConsent(next);
    writeCookieConsent(consent);
    setCookieConsent(consent);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-gradient)" }}>
        <header className="glass sticky top-0 z-40 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="mx-auto flex max-w-screen-sm items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-xl" style={{ background: "var(--skeleton-b)" }} />
              <div className="h-4 w-20 animate-pulse rounded" style={{ background: "var(--skeleton-b)" }} />
            </div>
            <div className="h-8 w-8 animate-pulse rounded-full" style={{ background: "var(--skeleton-b)" }} />
          </div>
        </header>
        <main className="mx-auto max-w-screen-sm px-4 py-8 sm:px-6">
          <div className="mb-6">
            <div className="h-7 w-28 animate-pulse rounded-lg" style={{ background: "var(--skeleton-b)" }} />
            <div className="mt-2 h-4 w-44 animate-pulse rounded" style={{ background: "var(--skeleton-b)" }} />
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="mb-2 h-3 w-16 animate-pulse rounded" style={{ background: "var(--skeleton-b)" }} />
                <div className="panel overflow-hidden p-0">
                  <div className="flex items-center gap-3 px-4 py-4">
                    <div className="h-9 w-9 animate-pulse rounded-xl" style={{ background: "var(--skeleton-b)" }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-24 animate-pulse rounded" style={{ background: "var(--skeleton-b)" }} />
                      <div className="h-3 w-48 animate-pulse rounded" style={{ background: "var(--skeleton-b)" }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }
  const canAccessAdmin = viewerRole === "ADMIN" || viewerRole === "OWNER";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-gradient)" }}>
      <AppHeader
        maxWidthClassName="max-w-screen-sm"
        backHref="/play"
        backLabel="Back to builder"
        badge="Settings"
        mobileItems={[
          { href: "/play", label: "Launch Builder", description: "Choose a game and build" },
          { href: "/weaknesses", label: "Weakness Tool", description: "Check Pokemon weaknesses fast" },
          { href: "/type-chart", label: "Type Chart", description: "See type strengths and weaknesses" },
          { href: "/teams", label: "My Teams", description: "Open your saved teams" },
          { href: "/settings", label: "Settings", description: "You are here" },
        ]}
        bottomSlot={(
          <div className="app-intro-card p-4 sm:p-5">
            <p className="app-header-kicker">Account</p>
            <h1 className="app-header-title font-display">Settings</h1>
            <p className="app-header-subtitle">Manage your account, profile, saved teams, and privacy preferences from one place.</p>
          </div>
        )}
      />

      <main className="app-page-main mx-auto max-w-screen-sm px-4 sm:px-6">
        <Breadcrumb
          items={[{ label: "Slatedex", href: "/play" }, { label: "Settings" }]}
          className="app-page-breadcrumb"
        />

        {user?.email && (
          <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Signed in as {user.email}
          </p>
        )}

        <div className="space-y-6">
          {SETTINGS_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2
                className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--text-muted)" }}
              >
                {section.title}
              </h2>
              <div className="panel overflow-hidden">
                {section.items.map((item, i) => (
                  <AppLink
                    key={item.href}
                    href={item.href}
                    className="settings-item flex items-center gap-3 px-4 py-4 sm:px-5"
                    style={{
                      borderTop: i > 0 ? "1px solid var(--border)" : "none",
                      color: "inherit",
                      textDecoration: "none",
                    }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
                        {item.description}
                      </p>
                    </div>
                    <FiChevronRight size={16} className="settings-item-chevron" style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  </AppLink>
                ))}
              </div>
            </section>
          ))}

          {canAccessAdmin && (
            <section>
              <h2
                className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--text-muted)" }}
              >
                Administration
              </h2>
              <div className="panel overflow-hidden">
                <AppLink
                  href="/settings/admin"
                  className="settings-item flex items-center gap-3 px-4 py-4 sm:px-5"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                  >
                    <FiShield size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      Admin Dashboard
                    </p>
                    <p className="mt-0.5 text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
                      User plans, quotas, roles, and platform metrics.
                    </p>
                  </div>
                  <FiChevronRight size={16} className="settings-item-chevron" style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                </AppLink>
              </div>
            </section>
          )}

          <section>
            <h2
              className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
              style={{ color: "var(--text-muted)" }}
            >
              Privacy Controls
            </h2>
            <div className="panel p-4 sm:p-5">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Decide what optional tracking is allowed. Required storage for sign-in and team saves always stays on.
              </p>

              <div className="mt-3 space-y-2">
                <label
                  className="flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5"
                  style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                >
                  <span>
                    <span className="block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      Product analytics
                    </span>
                    <span className="block text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
                      Helps us understand performance and feature quality.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={cookieConsent?.analytics ?? false}
                    onChange={(event) =>
                      updateConsent({
                        analytics: event.target.checked,
                        marketing: cookieConsent?.marketing ?? false,
                      })
                    }
                    className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                    aria-label="Enable product analytics"
                  />
                </label>

                <label
                  className="flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5"
                  style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                >
                  <span>
                    <span className="block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      Marketing measurement
                    </span>
                    <span className="block text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
                      Tracks referral and campaign performance. No ad personalization.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={cookieConsent?.marketing ?? false}
                    onChange={(event) =>
                      updateConsent({
                        analytics: cookieConsent?.analytics ?? false,
                        marketing: event.target.checked,
                      })
                    }
                    className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                    aria-label="Enable marketing measurement"
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateConsent({ analytics: false, marketing: false })}
                  className="btn-secondary text-xs"
                >
                  Reset Privacy Defaults
                </button>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="btn-secondary text-xs"
                >
                  Open Full Cookie Preferences
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <AppLink
            href="/teams"
            className="btn-secondary text-xs"
          >
            My Teams
          </AppLink>
          {user?.username && (
            <AppLink
              href={`/u/${user.username}`}
              className="btn-secondary text-xs"
            >
              Public Profile
            </AppLink>
          )}
        </div>
      </main>
    </div>
  );
}
