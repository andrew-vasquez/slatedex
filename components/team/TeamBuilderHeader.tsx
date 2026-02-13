"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft, FiTrash2, FiShuffle } from "react-icons/fi";
import type { Game } from "@/lib/types";

interface TeamBuilderHeaderProps {
  game: Game;
  onShuffle: () => void;
  onClear: () => void;
  teamLength: number;
}

const TeamBuilderHeader = ({ game, onShuffle, onClear, teamLength }: TeamBuilderHeaderProps) => {
  const router = useRouter();

  return (
    <header className="glass sticky top-0 z-40 border-b border-[var(--border)]" role="banner">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Back + game context */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => router.push("/")}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200 cursor-pointer shrink-0"
              style={{ background: "var(--surface-3)" }}
              aria-label="Go back to game selection"
            >
              <FiArrowLeft size={16} style={{ color: "var(--text-secondary)" }} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm sm:text-base truncate" style={{ color: "var(--text-primary)" }}>
                  {game.name}
                </span>
                <span
                  className="text-[0.6rem] font-medium tracking-wider uppercase px-2 py-0.5 rounded shrink-0"
                  style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
                >
                  {game.region}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Team counter + actions */}
          <div className="flex items-center gap-2 sm:gap-3" role="toolbar" aria-label="Team management">
            <span
              className="text-xs font-medium tabular-nums hidden sm:block"
              style={{ color: "var(--text-muted)" }}
            >
              {teamLength}/6 slots
            </span>
            <button
              onClick={onShuffle}
              disabled={teamLength === 0}
              className="btn-secondary disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Shuffle current team members"
            >
              <FiShuffle size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Shuffle</span>
            </button>
            <button
              onClick={onClear}
              disabled={teamLength === 0}
              className="btn-danger disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Clear all team members"
            >
              <FiTrash2 size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TeamBuilderHeader;
