"use client";

import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export default function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const ref = useRef<HTMLDivElement>(null);
  const isFirst = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Skip the very first render — pages have their own entrance animations
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    // Check if the user prefers reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const anim = el.animate(
      [
        { opacity: 0 },
        { opacity: 1 },
      ],
      {
        duration: 260,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "backwards",
      }
    );

    return () => anim.cancel();
  }, [pathname]);

  return <div ref={ref}>{children}</div>;
}
