"use client";

import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiMoon, FiSun, FiUser } from "react-icons/fi";

type Theme = "dark" | "light";

const DARK_THEME_COLOR = "#060914";
const LIGHT_THEME_COLOR = "#f3ecde";

interface ThemeMenuProps {
  className?: string;
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  localStorage.setItem("theme", theme);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
}

const ThemeMenu = ({ className = "" }: ThemeMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className={`theme-menu-shell ${className}`.trim()} ref={menuRef}>
      <button
        type="button"
        className="theme-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open appearance menu"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="theme-menu-avatar" aria-hidden="true">
          <FiUser size={14} />
        </span>
        <span className="text-[0.66rem] font-semibold">{theme === "dark" ? "Dark" : "Light"}</span>
        <FiChevronDown size={14} aria-hidden="true" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }} />
      </button>

      {isOpen && (
        <div className="theme-menu-panel" role="menu" aria-label="Appearance">
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
        </div>
      )}
    </div>
  );
};

export default ThemeMenu;
