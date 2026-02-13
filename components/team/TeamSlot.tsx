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
  let border = "2px solid var(--border)";

  if (isOver) {
    border = "2px solid rgba(218, 44, 67, 0.4)";
  } else if (isEmpty) {
    border = "2px dashed rgba(148, 163, 184, 0.32)";
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        relative aspect-square rounded-xl flex items-center justify-center
        ${isOver ? "drop-glow scale-[1.02]" : ""}
      `}
      style={{
        background: isOver ? "rgba(218, 44, 67, 0.12)" : "var(--surface-2)",
        border,
        transition: "background 0.25s ease, border-color 0.25s ease, transform 0.25s ease",
      }}
      role="region"
      aria-label={isEmpty ? "Empty team slot" : `Team slot for ${pokemon?.name}`}
    >
      {children || (
        <div className="pokeball-pulse flex flex-col items-center gap-1.5">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: "var(--text-muted)", opacity: 0.58 }}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="text-[0.62rem] font-medium" style={{ color: "var(--text-muted)" }}>
            Empty
          </span>
        </div>
      )}

      {pokemon && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1.5 top-1.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-transform duration-150 active:scale-95 sm:h-7 sm:w-7"
          style={{
            background: "rgba(218, 44, 67, 0.16)",
            borderColor: "rgba(218, 44, 67, 0.42)",
            color: "#ff9aa8",
          }}
          aria-label={`Remove ${pokemon.name} from team`}
        >
          <FiX size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default TeamSlot;
