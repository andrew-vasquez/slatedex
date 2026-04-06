"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowRight, FiLogIn, FiLogOut, FiMenu, FiSettings, FiUser, FiX } from "react-icons/fi";
import { useAuth } from "@/components/providers/AuthProvider";
import { signOut } from "@/lib/auth-client";

export interface MobileSiteMenuItem {
  href: string;
  label: string;
  description?: string;
}

interface MobileSiteMenuProps {
  items: MobileSiteMenuItem[];
}

export default function MobileSiteMenu({ items }: MobileSiteMenuProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user, isAuthenticated, isLoading, openAuthDialog } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const profileHref = user?.username ? `/u/${user.username}` : "/settings/profile";

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
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

  const normalizedItems = useMemo(
    () =>
      items
        .filter((item) => {
          if (!isAuthenticated) return true;
          if (item.href === "/settings") return false;
          if (item.href === profileHref) return false;
          return true;
        })
        .map((item) => {
        const isCurrent =
          pathname === item.href ||
          (item.href !== "/" && pathname?.startsWith(`${item.href}/`));
        return { ...item, isCurrent };
      }),
    [isAuthenticated, items, pathname, profileHref]
  );

  return (
    <div ref={shellRef} className="site-mobile-nav md:hidden">
      <button
        type="button"
        className="site-mobile-nav-trigger"
        aria-label={isOpen ? "Close site navigation" : "Open site navigation"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <FiX size={18} aria-hidden="true" /> : <FiMenu size={18} aria-hidden="true" />}
      </button>

      <div className="site-mobile-nav-menu panel" data-open={isOpen}>
        {isLoading ? null : isAuthenticated ? (
          <>
            <div className="site-mobile-nav-account">
              <strong>{user?.name ?? "Trainer"}</strong>
              <small>{user?.email ?? "Signed in"}</small>
            </div>
            <Link
              to={profileHref}
              className="site-mobile-nav-link"
              onClick={() => setIsOpen(false)}
            >
              <span>
                <strong>Profile</strong>
                <small>Open your trainer page</small>
              </span>
              <FiUser size={16} aria-hidden="true" />
            </Link>
            <Link
              to="/settings"
              className="site-mobile-nav-link"
              onClick={() => setIsOpen(false)}
            >
              <span>
                <strong>Settings</strong>
                <small>Manage your account</small>
              </span>
              <FiSettings size={16} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <button
            type="button"
            className="site-mobile-nav-link site-mobile-nav-button"
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

        {normalizedItems.map((item) =>
          item.isCurrent ? (
            <span
              key={item.href}
              className="site-mobile-nav-link site-mobile-nav-link--current"
              aria-current="page"
            >
              <span>
                <strong>{item.label}</strong>
                {item.description ? <small>{item.description}</small> : <small>You are here</small>}
              </span>
            </span>
          ) : (
            <Link
              key={item.href}
                to={item.href}
              className="site-mobile-nav-link"
              onClick={() => setIsOpen(false)}
            >
              <span>
                <strong>{item.label}</strong>
                {item.description ? <small>{item.description}</small> : null}
              </span>
              <FiArrowRight size={16} aria-hidden="true" />
            </Link>
          )
        )}

        {isLoading ? null : isAuthenticated ? (
          <>
            <div className="site-mobile-nav-divider" aria-hidden="true" />
            <button
              type="button"
              className="site-mobile-nav-link site-mobile-nav-button"
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
