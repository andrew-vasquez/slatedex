"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { FiGrid, FiArrowRight } from "react-icons/fi";

export default function DesktopToolsMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
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

  const currentTool =
    pathname?.startsWith("/type-chart") ? "type-chart" : pathname?.startsWith("/weaknesses") ? "weaknesses" : null;

  return (
    <div ref={menuRef} className="desktop-tools-menu">
      <button
        type="button"
        className="landing-cta-secondary header-nav-button desktop-tools-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label="Open tools menu"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <FiGrid size={16} aria-hidden="true" />
        Tools
      </button>

      {isOpen ? (
        <div id={menuId} className="desktop-tools-menu-panel" role="menu" aria-label="Tools menu">
          <Link
            href="/weaknesses"
            className="desktop-tools-menu-item"
            data-current={currentTool === "weaknesses"}
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <span>
              <strong>Weakness Tool</strong>
              <small>Check full Pokemon weaknesses fast.</small>
            </span>
            <FiArrowRight size={15} aria-hidden="true" />
          </Link>

          <Link
            href="/type-chart"
            className="desktop-tools-menu-item"
            data-current={currentTool === "type-chart"}
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <span>
              <strong>Type Chart</strong>
              <small>See what each type hits, resists, and fears.</small>
            </span>
            <FiArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
