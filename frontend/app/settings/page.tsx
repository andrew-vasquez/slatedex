"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FiArrowLeft, FiUser, FiShield, FiFileText, FiChevronRight } from "react-icons/fi";
import { useAuth } from "@/components/providers/AuthProvider";
import UserMenu from "@/components/auth/UserMenu";
import Breadcrumb from "@/components/ui/Breadcrumb";

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
  const { isAuthenticated, isLoading, user, openAuthDialog } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openAuthDialog();
    }
  }, [isAuthenticated, isLoading, openAuthDialog]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-gradient)" }}>
      {/* Header */}
      <header className="glass sticky top-0 z-40 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-screen-sm items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/play"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              aria-label="Back to builder"
            >
              <FiArrowLeft size={14} />
            </Link>
            <Link
              href="/"
              className="font-display text-[0.95rem] leading-none"
              style={{ letterSpacing: "-0.02em", color: "var(--text-primary)", textDecoration: "none" }}
            >
              Slate<span style={{ color: "var(--accent)" }}>dex</span>
            </Link>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-screen-sm px-4 py-8 sm:px-6">
        <Breadcrumb
          items={[{ label: "Slatedex", href: "/play" }, { label: "Settings" }]}
          className="mb-5"
        />

        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-3xl" style={{ color: "var(--text-primary)" }}>
            Settings
          </h1>
          {user?.email && (
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {user.email}
            </p>
          )}
        </div>

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
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-4 transition-colors sm:px-5"
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
                    <FiChevronRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/teams"
            className="btn-secondary text-xs"
          >
            My Teams
          </Link>
          {user?.username && (
            <Link
              href={`/u/${user.username}`}
              className="btn-secondary text-xs"
            >
              Public Profile
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
