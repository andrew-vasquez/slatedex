"use client";

import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiLogIn, FiLogOut, FiMoon, FiSun, FiUser } from "react-icons/fi";
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

interface UserMenuProps {
  className?: string;
}

const UserMenu = ({ className = "" }: UserMenuProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const detected = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    setTheme(detected);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isOpen]);

  const setThemeMode = (next: Theme) => {
    applyTheme(next);
    setTheme(next);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const themeButtons = (
    <>
      <p className="theme-menu-label">Appearance</p>
      <button
        type="button"
        className="theme-menu-item"
        role="menuitemradio"
        aria-checked={theme === "dark"}
        data-active={theme === "dark"}
        onClick={() => setThemeMode("dark")}
      >
        <span className="inline-flex items-center gap-2">
          <FiMoon size={14} aria-hidden="true" />
          Dark mode
        </span>
        {theme === "dark" && <FiCheck size={14} aria-hidden="true" />}
      </button>
      <button
        type="button"
        className="theme-menu-item"
        role="menuitemradio"
        aria-checked={theme === "light"}
        data-active={theme === "light"}
        onClick={() => setThemeMode("light")}
      >
        <span className="inline-flex items-center gap-2">
          <FiSun size={14} aria-hidden="true" />
          Light mode
        </span>
        {theme === "light" && <FiCheck size={14} aria-hidden="true" />}
      </button>
    </>
  );

  if (isLoading) {
    return (
      <div className={`theme-menu-shell ${className}`.trim()}>
        <div className="theme-menu-trigger opacity-50">
          <span className="theme-menu-avatar" aria-hidden="true">
            <FiUser size={14} />
          </span>
          <span className="text-[0.66rem] font-semibold">...</span>
        </div>
      </div>
    );
  }

  // Signed out: dropdown with theme toggle + sign in
  if (!isAuthenticated) {
    return (
      <>
        <div className={`theme-menu-shell ${className}`.trim()} ref={menuRef}>
          <button
            type="button"
            className="theme-menu-trigger"
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-label="Open menu"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <span className="theme-menu-avatar" aria-hidden="true">
              <FiUser size={14} />
            </span>
            <span className="text-[0.66rem] font-semibold">
              {theme === "dark" ? "Dark" : "Light"}
            </span>
            <FiChevronDown
              size={14}
              aria-hidden="true"
              style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
            />
          </button>

          {isOpen && (
            <div className="theme-menu-panel" role="menu" aria-label="Menu">
              {themeButtons}

              <div className="my-2" style={{ borderTop: "1px solid var(--border)" }} />

              <button
                type="button"
                className="theme-menu-item"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  setAuthDialogOpen(true);
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <FiLogIn size={14} aria-hidden="true" />
                  Sign In
                </span>
              </button>
            </div>
          )}
        </div>
        <AuthDialog isOpen={authDialogOpen} onClose={() => setAuthDialogOpen(false)} />
      </>
    );
  }

  // Signed in: dropdown with user info, theme toggle, sign out
  return (
    <>
      <div className={`theme-menu-shell ${className}`.trim()} ref={menuRef}>
        <button
          type="button"
          className="theme-menu-trigger"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label="Open user menu"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className="theme-menu-avatar" aria-hidden="true">
            <FiUser size={14} />
          </span>
          <span className="text-[0.66rem] font-semibold max-w-[80px] truncate">
            {user?.name?.split(" ")[0] ?? "Account"}
          </span>
          <FiChevronDown
            size={14}
            aria-hidden="true"
            style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
          />
        </button>

        {isOpen && (
          <div className="theme-menu-panel" role="menu" aria-label="User menu">
            <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-[0.72rem] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                {user?.name}
              </p>
              <p className="text-[0.62rem] truncate" style={{ color: "var(--text-muted)" }}>
                {user?.email}
              </p>
            </div>

            {themeButtons}

            <div className="my-2" style={{ borderTop: "1px solid var(--border)" }} />

            <button
              type="button"
              className="theme-menu-item"
              role="menuitem"
              onClick={handleSignOut}
            >
              <span className="inline-flex items-center gap-2">
                <FiLogOut size={14} aria-hidden="true" />
                Sign Out
              </span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default UserMenu;
