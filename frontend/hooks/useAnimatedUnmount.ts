"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useAnimatedUnmount(isVisible: boolean, exitDurationMs = 200) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const shouldRenderRef = useRef(isVisible);

  useEffect(() => {
    if (isVisible) {
      shouldRenderRef.current = true;
      setShouldRender(true);
      setIsAnimatingOut(false);
    } else if (shouldRenderRef.current) {
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        shouldRenderRef.current = false;
        setShouldRender(false);
        setIsAnimatingOut(false);
      }, exitDurationMs);
      return () => clearTimeout(timer);
    }
  }, [isVisible, exitDurationMs]);

  const onAnimationEnd = useCallback(() => {
    if (!isVisible) {
      shouldRenderRef.current = false;
      setShouldRender(false);
      setIsAnimatingOut(false);
    }
  }, [isVisible]);

  return { shouldRender, isAnimatingOut, onAnimationEnd };
}
