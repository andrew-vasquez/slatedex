"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { FiLogIn, FiLogOut, FiMoon, FiSettings, FiSun, FiUser, FiGrid } from "react-icons/fi";
import { signOut } from "@/lib/auth-client";
import { useAuth } from "@/components/providers/AuthProvider";
import AuthDialog from "./AuthDialog";

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

const UserMenu = ({ className = "", compactOnMobile = false }: UserMenuProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
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

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <>
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
            onClick={() => setAuthDialogOpen(true)}
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
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-controls={menuId}
              aria-label="Open user menu"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              {getInitials(user?.name ?? "?")}
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

      <AuthDialog isOpen={authDialogOpen} onClose={() => setAuthDialogOpen(false)} />
    </>
  );
};

export default UserMenu;
