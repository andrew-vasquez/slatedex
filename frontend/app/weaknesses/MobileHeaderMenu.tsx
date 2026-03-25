"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiArrowRight, FiMenu, FiX } from "react-icons/fi";

interface MobileHeaderMenuProps {
  currentTool?: "weaknesses" | "type-chart";
}

export default function MobileHeaderMenu({ currentTool = "weaknesses" }: MobileHeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={shellRef} className="weakness-mobile-nav">
      <button
        type="button"
        className="weakness-mobile-nav-trigger"
        aria-label={isOpen ? "Close quick navigation" : "Open quick navigation"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <FiX size={18} aria-hidden="true" /> : <FiMenu size={18} aria-hidden="true" />}
      </button>

      <div className="weakness-mobile-nav-menu panel" data-open={isOpen}>
        <Link href="/play" className="weakness-mobile-nav-link" onClick={() => setIsOpen(false)}>
          <span>
            <strong>Launch Builder</strong>
            <small>Build a team with coverage tools</small>
          </span>
          <FiArrowRight size={16} aria-hidden="true" />
        </Link>

        {currentTool === "weaknesses" ? (
          <span className="weakness-mobile-nav-link weakness-mobile-nav-link--current" aria-current="page">
            <span>
              <strong>Weakness Tool</strong>
              <small>You are here</small>
            </span>
          </span>
        ) : (
          <Link href="/weaknesses" className="weakness-mobile-nav-link" onClick={() => setIsOpen(false)}>
            <span>
              <strong>Weakness Tool</strong>
              <small>Check full Pokemon weaknesses fast</small>
            </span>
            <FiArrowRight size={16} aria-hidden="true" />
          </Link>
        )}

        {currentTool === "type-chart" ? (
          <span className="weakness-mobile-nav-link weakness-mobile-nav-link--current" aria-current="page">
            <span>
              <strong>Type Chart</strong>
              <small>You are here</small>
            </span>
          </span>
        ) : (
          <Link href="/type-chart" className="weakness-mobile-nav-link" onClick={() => setIsOpen(false)}>
            <span>
              <strong>Type Chart</strong>
              <small>See every type&apos;s strengths and weaknesses</small>
            </span>
            <FiArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
