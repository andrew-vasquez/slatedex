"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FiChevronUp } from "react-icons/fi";
import Image from "next/image";
import TeamPanel from "./TeamPanel";
import TeamCaptureGuide from "./TeamCaptureGuide";
import { triggerHaptic } from "@/lib/haptics";
import { pokemonSpriteSrc } from "@/lib/image";
import type { Pokemon } from "@/lib/types";

const PEEK_HEIGHT = 72;

interface MobileTeamSheetProps {
  team: (Pokemon | null)[];
  currentTeamLength: number;
  activeDropId: string | null;
  onRemove: (index: number) => void;
  dragEnabled?: boolean;
  lockedSlots: boolean[];
  onToggleLock: (index: number) => void;
  replaceMode: boolean;
  selectedReplaceSlot: number | null;
  onSelectReplaceSlot: (index: number | null) => void;
  onOpenTeamTools?: () => void;
  selectedVersionId: string;
  selectedVersionLabel: string;
  hapticsEnabled?: boolean;
}

export default function MobileTeamSheet({
  team,
  currentTeamLength,
  activeDropId,
  onRemove,
  dragEnabled = false,
  lockedSlots,
  onToggleLock,
  replaceMode,
  selectedReplaceSlot,
  onSelectReplaceSlot,
  onOpenTeamTools,
  selectedVersionId,
  selectedVersionLabel,
  hapticsEnabled = true,
}: MobileTeamSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartY = useRef<number | null>(null);
  const touchLastY = useRef<number | null>(null);
  const touchLastTime = useRef<number | null>(null);
  const isDragging = useRef(false);
  const velocityRef = useRef(0);
  const savedScrollY = useRef(0);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);

  const emitHaptic = useCallback(
    (tone: Parameters<typeof triggerHaptic>[0] = "light") => {
      triggerHaptic(tone, { enabled: hapticsEnabled, mobileOnly: true });
    },
    [hapticsEnabled]
  );

  const toggleSheet = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      emitHaptic(next ? "medium" : "light");
      return next;
    });
  }, [emitHaptic]);

  // iOS-compatible scroll lock: position-fixed trick preserves scroll position
  useEffect(() => {
    if (isOpen) {
      savedScrollY.current = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${savedScrollY.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      window.scrollTo(0, savedScrollY.current);
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (suppressClickTimerRef.current != null) {
        window.clearTimeout(suppressClickTimerRef.current);
      }
    };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchLastY.current = e.touches[0].clientY;
    touchLastTime.current = Date.now();
    isDragging.current = false;
    velocityRef.current = 0;
    setDragOffset(0);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY.current === null) return;
      const currentY = e.touches[0].clientY;
      const delta = currentY - touchStartY.current;

      // Track velocity (px/ms) from last event
      if (touchLastY.current !== null && touchLastTime.current !== null) {
        const dt = Date.now() - touchLastTime.current;
        if (dt > 0) {
          velocityRef.current = (currentY - touchLastY.current) / dt;
        }
      }
      touchLastY.current = currentY;
      touchLastTime.current = Date.now();

      if (Math.abs(delta) > 6) {
        isDragging.current = true;
      }
      if (isOpen) {
        setDragOffset(Math.max(0, delta));
      } else {
        setDragOffset(Math.min(0, delta));
      }
    },
    [isOpen]
  );

  const handleTouchEnd = useCallback(() => {
    const velocity = velocityRef.current; // positive = downward
    if (!isDragging.current) {
      toggleSheet();
    } else {
      if (isOpen) {
        // Dismiss if dragged far enough OR swiped down fast
        const shouldClose = dragOffset > 80 || velocity > 0.45;
        setIsOpen(!shouldClose);
        if (shouldClose) emitHaptic("light");
      } else {
        // Open if dragged far enough OR swiped up fast
        const shouldOpen = dragOffset < -80 || velocity < -0.45;
        setIsOpen(shouldOpen);
        if (shouldOpen) emitHaptic("medium");
      }
    }
    touchStartY.current = null;
    touchLastY.current = null;
    touchLastTime.current = null;
    isDragging.current = false;
    velocityRef.current = 0;
    setDragOffset(0);

    // Prevent synthetic click after touch from immediately toggling back.
    suppressClickRef.current = true;
    if (suppressClickTimerRef.current != null) {
      window.clearTimeout(suppressClickTimerRef.current);
    }
    suppressClickTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
      suppressClickTimerRef.current = null;
    }, 320);
  }, [dragOffset, emitHaptic, isOpen, toggleSheet]);

  const close = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) emitHaptic("light");
      return false;
    });
    setDragOffset(0);
  }, [emitHaptic]);
  const useTransition = !isDragging.current;

  // Use env(safe-area-inset-bottom) inline — supported in all modern browsers
  const getTranslateY = () => {
    if (isDragging.current) {
      if (isOpen) {
        return `${Math.max(0, dragOffset)}px`;
      }
      const upDrag = Math.abs(Math.min(0, dragOffset));
      return `calc(100% - ${PEEK_HEIGHT}px - env(safe-area-inset-bottom, 0px) - ${upDrag}px)`;
    }
    return isOpen
      ? "0px"
      : `calc(100% - ${PEEK_HEIGHT}px - env(safe-area-inset-bottom, 0px))`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: "rgba(2, 5, 16, 0.72)",
          backdropFilter: "blur(3px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
        onClick={close}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col"
        style={{
          transform: `translateY(${getTranslateY()})`,
          transition: useTransition ? "transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)" : "none",
          maxHeight: "85dvh",
          willChange: "transform",
          borderRadius: "20px 20px 0 0",
          overflow: "hidden",
        }}
        role="dialog"
        aria-modal={isOpen}
        aria-label="Team panel"
      >
        {/* Handle / Peek Bar */}
        <div
          className="mobile-sheet-bar"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(event) => {
            if (suppressClickRef.current) {
              event.preventDefault();
              return;
            }
            if (!isDragging.current) toggleSheet();
          }}
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Collapse team panel" : "Expand team panel"}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleSheet();
            }
          }}
        >
          {/* Drag pill */}
          <div className="mobile-sheet-pill" />

          {/* Mini slot row */}
          <div className="flex items-center gap-2 px-4 pb-3">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              {team.map((pokemon, i) => (
                <div
                  key={i}
                  className="mobile-sheet-mini-slot"
                  style={{
                    border: pokemon
                      ? "1.5px solid var(--version-color-border, rgba(218, 44, 67, 0.4))"
                      : "1.5px dashed rgba(148, 163, 184, 0.25)",
                    background: pokemon
                      ? "var(--version-color-soft, rgba(218, 44, 67, 0.1))"
                      : "rgba(148, 163, 184, 0.05)",
                  }}
                  aria-label={pokemon ? pokemon.name : "Empty slot"}
                >
                  {pokemon ? (
                    <Image
                      src={pokemonSpriteSrc(pokemon.sprite, pokemon.id)}
                      alt={pokemon.name}
                      width={28}
                      height={28}
                      sizes="28px"
                      className="object-contain"
                      style={{ imageRendering: "pixelated" }}
                      unoptimized
                    />
                  ) : (
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ color: "var(--text-muted)", opacity: 0.35 }}
                    >
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                      <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  )}
                </div>
              ))}
            </div>

            {/* Count + chevron */}
            <div className="flex shrink-0 items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[0.62rem] font-semibold tabular-nums"
                style={{
                  background: currentTeamLength > 0 ? "var(--version-color-soft, var(--accent-soft))" : "var(--surface-3)",
                  border: `1px solid ${currentTeamLength > 0 ? "var(--version-color-border, var(--border))" : "var(--border)"}`,
                  color: currentTeamLength > 0 ? "var(--version-color, var(--accent))" : "var(--text-muted)",
                }}
              >
                {currentTeamLength}/6
              </span>
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  background: "var(--surface-3)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
                aria-hidden="true"
              >
                <FiChevronUp size={14} />
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          className="mobile-sheet-content custom-scrollbar"
          style={{
            overflowY: isOpen ? "auto" : "hidden",
            overscrollBehavior: "contain",
          }}
        >
          <div className="px-4 pb-6 pt-1">
            <TeamPanel
              team={team}
              currentTeamLength={currentTeamLength}
              activeDropId={activeDropId}
              onRemove={onRemove}
              dragEnabled={dragEnabled}
              lockedSlots={lockedSlots}
              onToggleLock={onToggleLock}
              replaceMode={replaceMode}
              selectedReplaceSlot={selectedReplaceSlot}
              onSelectReplaceSlot={onSelectReplaceSlot}
              onOpenTeamTools={onOpenTeamTools}
              droppableDisabled={true}
              slotIdPrefix="mobile-team-slot"
            />

            <TeamCaptureGuide
              team={team}
              selectedVersionId={selectedVersionId}
              selectedVersionLabel={selectedVersionLabel}
            />
          </div>
        </div>
      </div>
    </>
  );
}
