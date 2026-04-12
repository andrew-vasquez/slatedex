import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import { FiArrowRight, FiMessageSquare } from "react-icons/fi";
import { useFeedback } from "@/components/feedback/FeedbackWidget";

function ToolsGridIcon() {
  return (
    <svg
      className="desktop-tools-menu-icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="4.5" y="4.5" width="5" height="5" rx="1.25" stroke="currentColor" strokeWidth="2" />
      <rect x="14.5" y="4.5" width="5" height="5" rx="1.25" stroke="currentColor" strokeWidth="2" />
      <rect x="4.5" y="14.5" width="5" height="5" rx="1.25" stroke="currentColor" strokeWidth="2" />
      <rect x="14.5" y="14.5" width="5" height="5" rx="1.25" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function DesktopToolsMenu() {
  const { openFeedback } = useFeedback();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
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
        className="header-nav-button desktop-tools-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label="Open tools menu"
        title="Tools"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <ToolsGridIcon />
        <span className="sr-only">Tools</span>
      </button>

      {isOpen ? (
        <div id={menuId} className="desktop-tools-menu-panel" role="menu" aria-label="Tools menu">
          <Link
            to="/weaknesses"
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
            to="/type-chart"
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

          <button
            type="button"
            className="desktop-tools-menu-item"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              openFeedback();
            }}
          >
            <span>
              <strong>Feedback</strong>
              <small>Report bugs, request features, or share ideas.</small>
            </span>
            <FiMessageSquare size={15} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
