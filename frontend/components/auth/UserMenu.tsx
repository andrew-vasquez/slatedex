"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { FiLogIn, FiLogOut, FiMoon, FiSettings, FiSun, FiUser, FiGrid } from "react-icons/fi";
import { signOut } from "@/lib/auth-client";
import { fetchMyProfile } from "@/lib/api";
import {
  AVATAR_FRAME_OPTIONS,
  getAvatarFrameStyles,
  type AvatarFrameKey,
} from "@/lib/profile";
import { useAuth } from "@/components/providers/AuthProvider";

type Theme = "dark" | "light";

const DARK_THEME_COLOR = "#060914";
const LIGHT_THEME_COLOR = "#f3ecde";

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  localStorage.setItem("theme", theme);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

interface UserMenuProps {
  className?: string;
  compactOnMobile?: boolean;
}

function toAvatarFrame(value: string | null | undefined): AvatarFrameKey {
  const match = AVATAR_FRAME_OPTIONS.find((option) => option.key === value);
  return match?.key ?? "classic";
}

const UserMenu = ({ className = "", compactOnMobile = false }: UserMenuProps) => {
  const { user, isAuthenticated, isLoading, openAuthDialog } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFrame, setAvatarFrame] = useState<AvatarFrameKey>("classic");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    const detected = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    setTheme(detected);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAvatarUrl(null);
      setAvatarFrame("classic");
      return;
    }

    let cancelled = false;

    fetchMyProfile()
      .then((profile) => {
        if (cancelled) return;
        setAvatarUrl(profile.avatarUrl ?? profile.image ?? null);
        setAvatarFrame(toAvatarFrame(profile.avatarFrame));
      })
      .catch(() => {
        if (cancelled) return;
        setAvatarUrl(user?.image ?? null);
        setAvatarFrame("classic");
      });

    const onAppearanceUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ avatarUrl?: string | null; avatarFrame?: string }>;
      if (customEvent.detail?.avatarUrl !== undefined) {
        setAvatarUrl(customEvent.detail.avatarUrl ?? null);
      }
      if (customEvent.detail?.avatarFrame !== undefined) {
        setAvatarFrame(toAvatarFrame(customEvent.detail.avatarFrame));
      }
    };

    window.addEventListener("profile-appearance-updated", onAppearanceUpdated as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener("profile-appearance-updated", onAppearanceUpdated as EventListener);
    };
  }, [isAuthenticated, user?.image]);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  const handleSignOut = async () => {
    await signOut();
    setAvatarUrl(null);
    setAvatarFrame("classic");
    setIsOpen(false);
  };

  const frameStyles = getAvatarFrameStyles(avatarFrame);
  const effectiveAvatarUrl = avatarUrl?.trim() || user?.image || "";

  return (
    <div className={`user-menu-shell${compactOnMobile ? " user-menu-shell--compact-mobile" : ""} ${className}`.trim()}>
        {/* Theme Toggle */}
        <button
          type="button"
          className="theme-toggle"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          onClick={toggleTheme}
        >
          <FiSun size={15} className={`theme-toggle-icon ${theme === "dark" ? "theme-toggle-icon--visible" : ""}`} aria-hidden="true" />
          <FiMoon size={15} className={`theme-toggle-icon ${theme === "light" ? "theme-toggle-icon--visible" : ""}`} aria-hidden="true" />
        </button>

        {/* Auth: loading */}
        {isLoading && (
          <div className={`user-menu-trigger user-menu-trigger--skeleton${compactOnMobile ? " user-menu-trigger--icon" : ""}`}>
            <span className="skeleton" style={{ width: compactOnMobile ? "1rem" : "3.5rem", height: "0.7rem", borderRadius: 4 }} />
          </div>
        )}

        {/* Auth: signed out */}
        {!isLoading && !isAuthenticated && (
          <button
            type="button"
            className={`user-menu-trigger user-menu-trigger--signin${compactOnMobile ? " user-menu-trigger--icon" : ""}`}
            aria-label="Sign in or create account"
            onClick={() => openAuthDialog("sign-in")}
          >
            <FiLogIn size={14} aria-hidden="true" />
            {!compactOnMobile && <span>Sign In</span>}
          </button>
        )}

        {/* Auth: signed in */}
        {!isLoading && isAuthenticated && (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="user-menu-avatar"
              style={{
                border: `2px solid ${frameStyles.border}`,
                boxShadow: frameStyles.glow,
                background: "rgba(8, 15, 34, 0.9)",
              }}
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-controls={menuId}
              aria-label="Open user menu"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              {effectiveAvatarUrl ? (
                <img
                  src={effectiveAvatarUrl}
                  alt={user?.name ? `${user.name} avatar` : "User avatar"}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                getInitials(user?.name ?? "?")
              )}
            </button>

            {isOpen && (
              <div id={menuId} className="user-menu-panel" role="menu" aria-label="User menu">
                <div className="user-menu-info">
                  <p className="user-menu-name">{user?.name}</p>
                  <p className="user-menu-email">{user?.email}</p>
                </div>

                <Link
                  href="/teams"
                  className="user-menu-item"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  <FiGrid size={14} aria-hidden="true" />
                  My Teams
                </Link>

                <Link
                  href={user?.username ? `/u/${user.username}` : "/settings/profile"}
                  className="user-menu-item"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  <FiUser size={14} aria-hidden="true" />
                  Profile
                </Link>

                <Link
                  href="/settings"
                  className="user-menu-item"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  <FiSettings size={14} aria-hidden="true" />
                  Settings
                </Link>

                <button
                  type="button"
                  className="user-menu-item"
                  role="menuitem"
                  onClick={handleSignOut}
                >
                  <FiLogOut size={14} aria-hidden="true" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default UserMenu;
