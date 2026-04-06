"use client";

import { useEffect, useRef, useState } from "react";
import { FiArrowRight, FiLogIn, FiLogOut, FiMenu, FiSettings, FiUser, FiX } from "react-icons/fi";
import AppLink from "~/components/ui/AppLink";
import { useAuth } from "@/components/providers/AuthProvider";
import { signOut } from "@/lib/auth-client";

interface MobileHeaderMenuProps {
  currentTool?: "weaknesses" | "type-chart";
}

export default function MobileHeaderMenu({ currentTool = "weaknesses" }: MobileHeaderMenuProps) {
  const { user, isAuthenticated, isLoading, openAuthDialog } = useAuth();
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
        {isLoading ? null : isAuthenticated ? (
          <>
            <div className="site-mobile-nav-account">
              <strong>{user?.name ?? "Trainer"}</strong>
              <small>{user?.email ?? "Signed in"}</small>
            </div>
            <AppLink
              href={user?.username ? `/u/${user.username}` : "/settings/profile"}
              className="weakness-mobile-nav-link"
              onClick={() => setIsOpen(false)}
            >
              <span>
                <strong>Profile</strong>
                <small>Open your trainer page</small>
              </span>
              <FiUser size={16} aria-hidden="true" />
            </AppLink>
            <AppLink
              href="/settings"
              className="weakness-mobile-nav-link"
              onClick={() => setIsOpen(false)}
            >
              <span>
                <strong>Settings</strong>
                <small>Manage your account</small>
              </span>
              <FiSettings size={16} aria-hidden="true" />
            </AppLink>
          </>
        ) : (
          <button
            type="button"
            className="weakness-mobile-nav-link site-mobile-nav-button"
            onClick={() => {
              setIsOpen(false);
              openAuthDialog("sign-in");
            }}
          >
            <span>
              <strong>Sign In</strong>
              <small>Access teams, profile, and settings</small>
            </span>
            <FiLogIn size={16} aria-hidden="true" />
          </button>
        )}

        <AppLink href="/play" className="weakness-mobile-nav-link" onClick={() => setIsOpen(false)}>
          <span>
            <strong>Launch Builder</strong>
            <small>Build a team with coverage tools</small>
          </span>
          <FiArrowRight size={16} aria-hidden="true" />
        </AppLink>

        {currentTool === "weaknesses" ? (
          <span className="weakness-mobile-nav-link weakness-mobile-nav-link--current" aria-current="page">
            <span>
              <strong>Weakness Tool</strong>
              <small>You are here</small>
            </span>
          </span>
        ) : (
          <AppLink href="/weaknesses" className="weakness-mobile-nav-link" onClick={() => setIsOpen(false)}>
            <span>
              <strong>Weakness Tool</strong>
              <small>Check full Pokemon weaknesses fast</small>
            </span>
            <FiArrowRight size={16} aria-hidden="true" />
          </AppLink>
        )}

        {currentTool === "type-chart" ? (
          <span className="weakness-mobile-nav-link weakness-mobile-nav-link--current" aria-current="page">
            <span>
              <strong>Type Chart</strong>
              <small>You are here</small>
            </span>
          </span>
        ) : (
          <AppLink href="/type-chart" className="weakness-mobile-nav-link" onClick={() => setIsOpen(false)}>
            <span>
              <strong>Type Chart</strong>
              <small>See every type&apos;s strengths and weaknesses</small>
            </span>
            <FiArrowRight size={16} aria-hidden="true" />
          </AppLink>
        )}

        {isLoading ? null : isAuthenticated ? (
          <>
            <div className="site-mobile-nav-divider" aria-hidden="true" />
            <button
              type="button"
              className="weakness-mobile-nav-link site-mobile-nav-button"
              onClick={async () => {
                setIsOpen(false);
                await signOut();
              }}
            >
              <span>
                <strong>Sign Out</strong>
                <small>End this session</small>
              </span>
              <FiLogOut size={16} aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
