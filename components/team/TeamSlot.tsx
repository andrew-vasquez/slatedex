"use client";

import { useDroppable } from "@dnd-kit/core";
import { FiX } from "react-icons/fi";
import type { Pokemon } from "@/lib/types";

interface TeamSlotProps {
  children?: React.ReactNode;
  id: string;
  isEmpty: boolean;
  isOver: boolean;
  pokemon: Pokemon | null;
  onRemove: (() => void) | null;
}

const TeamSlot = ({ children, id, isEmpty, isOver, pokemon, onRemove }: TeamSlotProps) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`
        relative aspect-square rounded-xl flex items-center justify-center
        transition-all duration-300
        ${isOver ? "drop-glow scale-[1.03]" : ""}
        ${isEmpty && !isOver ? "hover:border-[var(--border-hover)]" : ""}
      `}
      style={{
        background: isOver ? "rgba(229, 62, 62, 0.08)" : "var(--surface-2)",
        border: isOver
          ? "2px solid rgba(229, 62, 62, 0.4)"
          : isEmpty
            ? "2px dashed rgba(255,255,255,0.06)"
            : "2px solid var(--border)",
        borderRadius: "14px",
      }}
      role="region"
      aria-label={
        isEmpty
          ? `Empty team slot`
          : `Team slot — ${pokemon?.name}`
      }
    >
      {children || (
        <div className="flex flex-col items-center gap-1.5 pokeball-pulse">
          {/* Mini pokeball icon */}
          <svg
            width="28" height="28" viewBox="0 0 24 24" fill="none"
            style={{ color: "var(--text-muted)", opacity: 0.4 }}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="text-[0.6rem] font-medium" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
            Empty
          </span>
        </div>
      )}

      {pokemon && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center
                     transition-all duration-200 hover:scale-110 z-10 cursor-pointer shadow-lg"
          style={{
            background: "rgba(239, 68, 68, 0.9)",
            color: "white",
          }}
          aria-label={`Remove ${pokemon.name} from team`}
        >
          <FiX size={10} />
        </button>
      )}
    </div>
  );
};

export default TeamSlot;
