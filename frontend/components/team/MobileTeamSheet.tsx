"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import Image from "next/image";
import TeamPanel from "./TeamPanel";
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
}: MobileTeamSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);
  const isDragging = useRef(false);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    isDragging.current = false;
    setDragOffset(0);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY.current === null) return;
      const delta = e.touches[0].clientY - touchStartY.current;
      touchCurrentY.current = e.touches[0].clientY;
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
    if (!isDragging.current) {
      setIsOpen((prev) => !prev);
    } else {
      if (isOpen) {
        setIsOpen(dragOffset > 80 ? false : true);
      } else {
        setIsOpen(dragOffset < -80 ? true : false);
      }
    }
    touchStartY.current = null;
    touchCurrentY.current = null;
    isDragging.current = false;
    setDragOffset(0);
  }, [isOpen, dragOffset]);

  const animatingRef = useRef(false);
  const open = () => {
    if (animatingRef.current) return;
    setIsOpen(true);
  };
  const close = () => {
    if (animatingRef.current) return;
    setIsOpen(false);
  };

  const translateY = isOpen
    ? `${Math.max(0, dragOffset)}px`
    : `calc(100% - ${PEEK_HEIGHT}px + ${Math.min(0, dragOffset) * -1}px)`;

  const useTransition = !isDragging.current;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: "rgba(2, 5, 16, 0.68)",
          backdropFilter: "blur(2px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.32s ease",
        }}
        onClick={close}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col"
        style={{
          transform: `translateY(${translateY})`,
          transition: useTransition ? "transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)" : "none",
          maxHeight: "82vh",
          willChange: "transform",
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
          onClick={() => !isDragging.current && setIsOpen((prev) => !prev)}
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Collapse team panel" : "Expand team panel"}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen((prev) => !prev);
            }
          }}
        >
          {/* Drag pill */}
          <div className="mobile-sheet-pill" />

          {/* Mini slot row */}
          <div className="flex items-center gap-2 px-4 pb-3">
            <div className="flex flex-1 items-center gap-1.5">
              {team.map((pokemon, i) => (
                <div
                  key={i}
                  className="mobile-sheet-mini-slot"
                  style={{
                    border: pokemon
                      ? "1.5px solid rgba(218, 44, 67, 0.35)"
                      : "1.5px dashed rgba(148, 163, 184, 0.28)",
                    background: pokemon
                      ? "rgba(218, 44, 67, 0.1)"
                      : "rgba(148, 163, 184, 0.06)",
                  }}
                  aria-label={pokemon ? pokemon.name : "Empty slot"}
                >
                  {pokemon ? (
                    <Image
                      src={pokemon.sprite}
                      alt={pokemon.name}
                      width={28}
                      height={28}
                      className="object-contain"
                      style={{ imageRendering: "pixelated" }}
                      unoptimized
                    />
                  ) : (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ color: "var(--text-muted)", opacity: 0.4 }}
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
                  background:
                    currentTeamLength > 0 ? "var(--accent-soft)" : "var(--surface-3)",
                  border: "1px solid var(--border)",
                  color: currentTeamLength > 0 ? "var(--accent)" : "var(--text-muted)",
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
                  transition: "transform 0.3s ease",
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
          style={{ overflowY: isOpen ? "auto" : "hidden" }}
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
            />
          </div>
        </div>
      </div>
    </>
  );
}
