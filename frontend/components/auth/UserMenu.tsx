"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FiGrid, FiLogIn, FiLogOut, FiMoon, FiSettings, FiShield, FiSun, FiUser } from "react-icons/fi";
import AppImage from "~/components/ui/AppImage";
import AppLink from "~/components/ui/AppLink";
import { signOut } from "@/lib/auth-client";
import { fetchMyProfile, type MyProfile, type UserRoleValue } from "@/lib/api";
import { normalizeAvatarUrl } from "@/lib/avatar";
import { safeImageSrc } from "@/lib/image";
import {
  AVATAR_FRAME_OPTIONS,
  getAvatarFrameStyles,
  type AvatarFrameKey,
} from "@/lib/profile";
import { useAuth } from "@/components/providers/AuthProvider";

type Theme = "dark" | "light";

const DARK_THEME_COLOR = "#060914";
const LIGHT_THEME_COLOR = "#f3ecde";
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedProfile: { profile: MyProfile; fetchedAt: number } | null = null;
let inFlightProfileRequest: Promise<MyProfile> | null = null;
let themeAnimationTimer: number | null = null;
const THEME_CHANGE_EVENT = "slatedex-theme-change";

function getResolvedTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReducedMotion) {
    root.classList.add("theme-animating");
    if (themeAnimationTimer !== null) {
      window.clearTimeout(themeAnimationTimer);
    }
  }

  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  localStorage.setItem("theme", theme);
  document.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax`;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);

  window.dispatchEvent(new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: theme }));

  if (!prefersReducedMotion) {
    themeAnimationTimer = window.setTimeout(() => {
      root.classList.remove("theme-animating");
      themeAnimationTimer = null;
    }, 280);
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

interface UserMenuProps {
  className?: string;
  compactOnMobile?: boolean;
  betweenThemeAndAuth?: React.ReactNode;
}

interface ThemeToggleButtonProps {
  className?: string;
}

function toAvatarFrame(value: string | null | undefined): AvatarFrameKey {
  const match = AVATAR_FRAME_OPTIONS.find((option) => option.key === value);
  return match?.key ?? "classic";
}

function readCachedProfile(): MyProfile | null {
  if (!cachedProfile) return null;
  if (Date.now() - cachedProfile.fetchedAt > PROFILE_CACHE_TTL_MS) {
    cachedProfile = null;
    return null;
  }
  return cachedProfile.profile;
}

function clearProfileCache(): void {
  cachedProfile = null;
  inFlightProfileRequest = null;
}

function fetchMyProfileCached(): Promise<MyProfile> {
  const cached = readCachedProfile();
  if (cached) return Promise.resolve(cached);
  if (inFlightProfileRequest) return inFlightProfileRequest;

  inFlightProfileRequest = fetchMyProfile()
    .then((profile) => {
      cachedProfile = { profile, fetchedAt: Date.now() };
      return profile;
    })
    .finally(() => {
      inFlightProfileRequest = null;
    });

  return inFlightProfileRequest;
}

export function ThemeToggleButton({ className = "" }: ThemeToggleButtonProps) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const syncTheme = () => {
      setTheme(getResolvedTheme());
    };

    syncTheme();
    window.addEventListener(THEME_CHANGE_EVENT, syncTheme as EventListener);
    window.addEventListener("storage", syncTheme);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, syncTheme as EventListener);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      className={["theme-toggle", className].filter(Boolean).join(" ")}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      onClick={toggleTheme}
    >
      <FiSun size={15} className={`theme-toggle-icon ${theme === "dark" ? "theme-toggle-icon--visible" : ""}`} aria-hidden="true" />
      <FiMoon size={15} className={`theme-toggle-icon ${theme === "light" ? "theme-toggle-icon--visible" : ""}`} aria-hidden="true" />
    </button>
  );
}

const UserMenu = ({ className = "", compactOnMobile = false, betweenThemeAndAuth = null }: UserMenuProps) => {
  const { user, isAuthenticated, isLoading, openAuthDialog } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFrame, setAvatarFrame] = useState<AvatarFrameKey>("classic");
  const [viewerRole, setViewerRole] = useState<UserRoleValue | null>(null);
  const [avatarImageLoaded, setAvatarImageLoaded] = useState(false);
  const [avatarImageError, setAvatarImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

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
      setViewerRole(null);
      clearProfileCache();
      return;
    }

    let cancelled = false;
    const cached = readCachedProfile();
    if (cached) {
      setAvatarUrl(cached.avatarUrl ?? cached.image ?? null);
      setAvatarFrame(toAvatarFrame(cached.avatarFrame));
      setViewerRole(cached.role);
    }

    fetchMyProfileCached()
      .then((profile) => {
        if (cancelled) return;
        setAvatarUrl(profile.avatarUrl ?? profile.image ?? null);
        setAvatarFrame(toAvatarFrame(profile.avatarFrame));
        setViewerRole(profile.role);
      })
      .catch(() => {
        if (cancelled) return;
        setAvatarUrl(user?.image ?? null);
        setAvatarFrame("classic");
        setViewerRole(null);
      });

    const onAppearanceUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ avatarUrl?: string | null; avatarFrame?: string }>;
      if (customEvent.detail?.avatarUrl !== undefined) {
        setAvatarUrl(customEvent.detail.avatarUrl ?? null);
        if (cachedProfile) {
          cachedProfile = {
            ...cachedProfile,
            profile: { ...cachedProfile.profile, avatarUrl: customEvent.detail.avatarUrl ?? null },
          };
        }
      }
      if (customEvent.detail?.avatarFrame !== undefined) {
        setAvatarFrame(toAvatarFrame(customEvent.detail.avatarFrame));
        if (cachedProfile) {
          cachedProfile = {
            ...cachedProfile,
            profile: { ...cachedProfile.profile, avatarFrame: customEvent.detail.avatarFrame },
          };
        }
      }
    };

    window.addEventListener("profile-appearance-updated", onAppearanceUpdated as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener("profile-appearance-updated", onAppearanceUpdated as EventListener);
    };
  }, [isAuthenticated, user?.image]);

  // Reset image load state when avatar URL changes (e.g. user picks new avatar)
  useEffect(() => {
    setAvatarImageLoaded(false);
    setAvatarImageError(false);
  }, [avatarUrl, user?.image]);

  const handleSignOut = async () => {
    await signOut();
    clearProfileCache();
    setAvatarUrl(null);
    setAvatarFrame("classic");
    setIsOpen(false);
  };

  const frameStyles = getAvatarFrameStyles(avatarFrame);
  const canAccessAdmin = viewerRole === "ADMIN" || viewerRole === "OWNER";
  const normalizedAvatarInput = safeImageSrc(avatarUrl) ?? safeImageSrc(user?.image) ?? "";
  const effectiveAvatarUrl = normalizeAvatarUrl(normalizedAvatarInput);

  return (
    <div className={`user-menu-shell${compactOnMobile ? " user-menu-shell--compact-mobile" : ""} ${className}`.trim()}>
        <ThemeToggleButton />

        {betweenThemeAndAuth}

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
              aria-busy={!!(effectiveAvatarUrl && !avatarImageError && !avatarImageLoaded)}
              onClick={() => setIsOpen((prev) => !prev)}
            >
              {effectiveAvatarUrl && !avatarImageError ? (
                <span className="relative block h-full w-full overflow-hidden rounded-full">
                  {/* Skeleton placeholder until custom avatar loads */}
                  <span
                    className="skeleton absolute inset-0 rounded-full transition-opacity duration-200"
                    style={{ opacity: avatarImageLoaded ? 0 : 1 }}
                    aria-hidden
                  />
                  <AppImage
                    src={effectiveAvatarUrl}
                    alt={user?.name ? `${user.name} avatar` : "User avatar"}
                    width={40}
                    height={40}
                    sizes="40px"
                    unoptimized
                    className="h-full w-full rounded-full object-cover"
                    onLoad={() => setAvatarImageLoaded(true)}
                    onError={() => setAvatarImageError(true)}
                  />
                </span>
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

                <AppLink
                  href="/teams"
                  className="user-menu-item"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  <FiGrid size={14} aria-hidden="true" />
                  My Teams
                </AppLink>

                <AppLink
                  href={user?.username ? `/u/${user.username}` : "/settings/profile"}
                  className="user-menu-item"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  <FiUser size={14} aria-hidden="true" />
                  Profile
                </AppLink>

                <AppLink
                  href="/settings"
                  className="user-menu-item"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  <FiSettings size={14} aria-hidden="true" />
                  Settings
                </AppLink>

                {canAccessAdmin && (
                  <AppLink
                    href="/settings/admin"
                    className="user-menu-item"
                    role="menuitem"
                    onClick={() => setIsOpen(false)}
                  >
                    <FiShield size={14} aria-hidden="true" />
                    Admin Dashboard
                  </AppLink>
                )}

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
