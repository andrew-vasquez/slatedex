"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiInfo, FiX } from "react-icons/fi";

interface InfoTooltipProps {
  /** Label shown in the UI (e.g. "Slots", "Risks") */
  label?: React.ReactNode;
  /** Description shown in the hover panel */
  description: string;
  /** Optional: render as a different element (e.g. span wrapping the label) */
  children?: React.ReactNode;
  /** When true, only show the info icon (no label). Use for compact placements. */
  iconOnly?: boolean;
  /** Aria-label for the trigger when iconOnly (required for accessibility) */
  triggerLabel?: string;
  /** Delay in ms before showing tooltip (matches Pokemon card ~400ms) */
  delay?: number;
}

export default function InfoTooltip({
  label,
  description,
  children,
  iconOnly = false,
  triggerLabel,
  delay = 400,
}: InfoTooltipProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [popoverRect, setPopoverRect] = useState<{ top: number; left: number } | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
    setIsTouchDevice(mq.matches);
  }, []);

  const openPopover = useCallback(() => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPopoverRect({ top: r.top - 8, left: r.left + r.width / 2 });
    }
    setShowPopover(true);
  }, []);

  const closePopover = useCallback(() => {
    setShowPopover(false);
    setPopoverRect(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (isTouchDevice) return;
    timerRef.current = setTimeout(openPopover, delay);
  }, [delay, openPopover, isTouchDevice]);

  const handleMouseLeave = useCallback(() => {
    if (isTouchDevice) return;
    closePopover();
  }, [closePopover, isTouchDevice]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isTouchDevice) {
        e.preventDefault();
        e.stopPropagation();
        if (showPopover) {
          closePopover();
        } else if (triggerRef.current) {
          const r = triggerRef.current.getBoundingClientRect();
          setPopoverRect({ top: r.top - 8, left: r.left + r.width / 2 });
          setShowPopover(true);
        }
      }
    },
    [isTouchDevice, showPopover, closePopover]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const content = iconOnly ? null : (children ?? label);

  const popover =
    showPopover &&
    typeof document !== "undefined" &&
    createPortal(
      <>
        {isTouchDevice && (
          <div
            className="info-tooltip-backdrop"
            onClick={closePopover}
            onTouchEnd={(e) => {
              e.preventDefault();
              closePopover();
            }}
            aria-hidden
          />
        )}
        <div
          className={`info-tooltip-popover ${isTouchDevice ? "info-tooltip-popover--touch" : ""}`}
          style={
            popoverRect
              ? { top: popoverRect.top, left: popoverRect.left }
              : undefined
          }
          onMouseEnter={() => !isTouchDevice && setShowPopover(true)}
          onMouseLeave={!isTouchDevice ? closePopover : undefined}
          role="tooltip"
          aria-live="polite"
        >
          {isTouchDevice && (
            <button
              type="button"
              onClick={closePopover}
              className="info-tooltip-close"
              aria-label="Close"
            >
              <FiX size={14} />
            </button>
          )}
          <p className="text-[0.72rem] sm:text-[0.74rem] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>
        </div>
      </>,
      document.body
    );

  const handleFocus = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    openPopover();
  }, [openPopover]);

  const handleBlur = useCallback(() => {
    closePopover();
  }, [closePopover]);

  return (
    <span
      ref={triggerRef}
      tabIndex={0}
      role="button"
      className={`info-tooltip-trigger ${iconOnly ? "info-tooltip-trigger--icon-only" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (showPopover) closePopover();
          else openPopover();
        }
      }}
      aria-label={iconOnly ? triggerLabel : undefined}
      aria-expanded={showPopover}
    >
      {content}
      <span className="info-tooltip-icon" aria-hidden={!iconOnly}>
        <FiInfo size={iconOnly ? 14 : 12} />
      </span>
      {popover}
    </span>
  );
}
