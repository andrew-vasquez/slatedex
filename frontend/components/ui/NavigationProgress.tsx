"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { usePathname } from "next/navigation";

function Progress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const [completing, setCompleting] = useState(false);
  const prevPathname = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const start = useCallback(() => {
    clear();
    setCompleting(false);
    setWidth(8);
    setVisible(true);
    let w = 8;
    intervalRef.current = setInterval(() => {
      // Eased progress that slows as it approaches 90%
      w += (90 - w) * 0.09 + Math.random() * 1.5;
      if (w >= 90) {
        w = 90;
        clear();
      }
      setWidth(w);
    }, 160);
  }, []);

  const done = useCallback(() => {
    clear();
    setCompleting(true);
    setWidth(100);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
      setCompleting(false);
    }, 380);
  }, []);

  // Detect navigation completion via pathname change
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      done();
    }
  }, [pathname, done]);

  // Detect navigation start by intercepting link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest("a[href]") as HTMLAnchorElement | null;
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      try {
        const url = new URL(a.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        const currentKey = window.location.pathname + window.location.search;
        const nextKey = url.pathname + url.search;
        if (nextKey !== currentKey) {
          start();
        }
      } catch {
        // ignore malformed hrefs
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [start]);

  useEffect(() => () => clear(), []);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-label="Page loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
      aria-live="polite"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          background: "linear-gradient(90deg, var(--accent), #f05060)",
          boxShadow: "0 0 12px var(--accent-glow), 0 0 4px var(--accent)",
          borderRadius: "0 2px 2px 0",
          transition: completing
            ? "width 0.14s ease, opacity 0.28s ease 0.12s"
            : "width 0.18s ease",
          opacity: completing ? 0 : 1,
        }}
      />
    </div>
  );
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <Progress />
    </Suspense>
  );
}
