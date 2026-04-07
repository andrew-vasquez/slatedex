import { useRef, useEffect, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { FiLock, FiUnlock, FiX } from "react-icons/fi";
import { useAnimatedUnmount } from "~/features/game/hooks/useAnimatedUnmount";
import type { Pokemon } from "@/lib/types";

interface TeamSlotProps {
  children?: React.ReactNode;
  id: string;
  isEmpty: boolean;
  isOver: boolean;
  pokemon: Pokemon | null;
  onRemove: (() => void) | null;
  isLocked?: boolean;
  onToggleLock?: (() => void) | null;
  replaceMode?: boolean;
  isReplaceTarget?: boolean;
  onSelectForReplace?: (() => void) | null;
  index?: number;
  droppableDisabled?: boolean;
  emptyHint?: string;
}

const TeamSlot = ({
  children,
  id,
  isEmpty,
  isOver,
  pokemon,
  onRemove,
  isLocked = false,
  onToggleLock = null,
  replaceMode = false,
  isReplaceTarget = false,
  onSelectForReplace = null,
  index = 0,
  droppableDisabled = false,
  emptyHint,
}: TeamSlotProps) => {
  const { setNodeRef } = useDroppable({ id, disabled: droppableDisabled });

  // Track pokemon presence for enter/exit animations
  const hasPokemon = pokemon !== null;
  const {
    shouldRender: shouldRenderContent,
    isAnimatingOut: isContentExiting,
  } = useAnimatedUnmount(hasPokemon, 200);

  const {
    shouldRender: shouldRenderEmpty,
    isAnimatingOut: isEmptyExiting,
  } = useAnimatedUnmount(!hasPokemon, 200);
  const prevPokemonIdRef = useRef<number | null>(pokemon?.id ?? null);
  const [slotSnapPulse, setSlotSnapPulse] = useState(false);

  useEffect(() => {
    const previousId = prevPokemonIdRef.current;
    const currentId = pokemon?.id ?? null;
    if (currentId !== null && currentId !== previousId) {
      setSlotSnapPulse(true);
      const timer = setTimeout(() => setSlotSnapPulse(false), 440);
      prevPokemonIdRef.current = currentId;
      return () => clearTimeout(timer);
    }
    prevPokemonIdRef.current = currentId;
  }, [pokemon?.id]);

  // Lock/unlock pulse
  const prevLockedRef = useRef(isLocked);
  const [lockPulse, setLockPulse] = useState(false);
  useEffect(() => {
    if (prevLockedRef.current !== isLocked) {
      prevLockedRef.current = isLocked;
      setLockPulse(true);
      const timer = setTimeout(() => setLockPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isLocked]);

  // Replace target pulse
  const prevReplaceTargetRef = useRef(isReplaceTarget);
  const [replacePulse, setReplacePulse] = useState(false);
  useEffect(() => {
    if (isReplaceTarget && !prevReplaceTargetRef.current) {
      setReplacePulse(true);
      const timer = setTimeout(() => setReplacePulse(false), 500);
      prevReplaceTargetRef.current = isReplaceTarget;
      return () => clearTimeout(timer);
    }
    prevReplaceTargetRef.current = isReplaceTarget;
  }, [isReplaceTarget]);

  let border = "2px solid var(--border)";
  const resolvedEmptyHint = emptyHint ?? (isLocked ? "Unlock to use this slot" : "Tap a Pokemon to add");

  if (isOver) {
    border = "2px solid var(--version-color-border, rgba(218, 44, 67, 0.4))";
  } else if (isEmpty && !shouldRenderContent) {
    border = "2px dashed rgba(148, 163, 184, 0.32)";
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        relative rounded-xl flex items-center justify-center overflow-hidden
        aspect-auto sm:aspect-square min-h-[8.5rem] sm:min-h-[7.5rem]
        ${isOver ? "drop-glow scale-[1.02]" : ""}
        ${slotSnapPulse ? "slot-snap-pulse" : ""}
      `}
      style={{
        background: isReplaceTarget
          ? "rgba(59, 130, 246, 0.12)"
          : isOver
            ? "var(--version-color-soft, rgba(218, 44, 67, 0.12))"
            : isEmpty && !shouldRenderContent
              ? `radial-gradient(circle at 50% 40%, rgba(148, 163, 184, 0.06), var(--surface-2))`
              : "var(--surface-2)",
        border,
        transition: "background 0.25s ease, border-color 0.25s ease, transform 0.25s ease",
        animationDelay: `${index * 50}ms`,
      }}
      role="region"
      aria-label={isEmpty ? "Empty team slot" : `Team slot for ${pokemon?.name}`}
    >
      {(hasPokemon || shouldRenderContent) && children && (
        <div className={isContentExiting ? "animate-scale-out" : "animate-scale-in"}>
          {children}
        </div>
      )}

      {(!hasPokemon || shouldRenderEmpty) && !children && (
        <div className={`flex flex-col items-center gap-2 ${isEmptyExiting ? "animate-scale-out" : "animate-fade-in-up"}`}>
          <span
            className="rounded-full px-2 py-0.5 text-[0.54rem] font-semibold uppercase tracking-[0.08em]"
            style={{
              background: "rgba(148,163,184,0.08)",
              border: "1px solid rgba(148,163,184,0.24)",
              color: "var(--text-muted)",
              opacity: 0.8,
            }}
          >
            Slot {index + 1}
          </span>
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: "var(--text-muted)", opacity: 0.48 }}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="text-[0.6rem] font-medium" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
            Empty
          </span>
          <p className="max-w-[7.5rem] text-center text-[0.55rem] leading-snug" style={{ color: "var(--text-muted)", opacity: 0.82 }}>
            {resolvedEmptyHint}
          </p>
        </div>
      )}

      {pokemon && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1.5 top-1.5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-transform duration-150 active:scale-90 sm:h-7 sm:w-7"
          style={{
            background: "rgba(218, 44, 67, 0.16)",
            borderColor: "rgba(218, 44, 67, 0.42)",
            color: "#ff9aa8",
          }}
          aria-label={`Remove ${pokemon.name} from team`}
        >
          <FiX size={15} aria-hidden="true" />
        </button>
      )}

      {onToggleLock && (
        <button
          type="button"
          onClick={onToggleLock}
          className={`absolute left-1.5 top-1.5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-transform duration-150 active:scale-90 sm:h-7 sm:w-7 ${lockPulse ? "animate-confirm-pulse" : ""}`}
          style={{
            background: isLocked ? "rgba(59, 130, 246, 0.16)" : "rgba(148, 163, 184, 0.12)",
            borderColor: isLocked ? "rgba(59, 130, 246, 0.38)" : "var(--border)",
            color: isLocked ? "#93c5fd" : "var(--text-muted)",
            "--pulse-color": isLocked ? "rgba(59, 130, 246, 0.45)" : "rgba(148, 163, 184, 0.35)",
          } as React.CSSProperties}
          aria-label={isLocked ? "Unlock team slot" : "Lock team slot"}
        >
          {isLocked ? <FiLock size={13} aria-hidden="true" /> : <FiUnlock size={13} aria-hidden="true" />}
        </button>
      )}

      {replaceMode && pokemon && onSelectForReplace && (
        <button
          type="button"
          onClick={onSelectForReplace}
          className={`absolute bottom-1.5 left-1/2 z-20 -translate-x-1/2 inline-flex min-h-[32px] items-center rounded-full border px-3 text-[0.62rem] font-semibold uppercase tracking-[0.08em] ${replacePulse ? "animate-confirm-pulse" : ""}`}
          style={{
            background: isReplaceTarget ? "rgba(59, 130, 246, 0.22)" : "var(--surface-1)",
            borderColor: isReplaceTarget ? "rgba(59, 130, 246, 0.45)" : "var(--border)",
            color: isReplaceTarget ? "#93c5fd" : "var(--text-muted)",
            "--pulse-color": "rgba(59, 130, 246, 0.45)",
          } as React.CSSProperties}
        >
          {isReplaceTarget ? "Targeted" : "Target"}
        </button>
      )}
    </div>
  );
};

export default TeamSlot;
