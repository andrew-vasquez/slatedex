"use client";

import { FiTool } from "react-icons/fi";
import TeamSlot from "./TeamSlot";
import PokemonCard from "@/components/ui/PokemonCard";
import type { Pokemon } from "@/lib/types";

interface TeamPanelProps {
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

const TeamPanel = ({
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
}: TeamPanelProps) => {
  return (
    <section className="panel p-4 sm:p-5" aria-labelledby="team-heading">
      <div className="mb-3 flex items-start justify-between gap-3 sm:mb-5 sm:items-center">
        <div className="min-w-0">
          <h2 id="team-heading" className="font-display text-base leading-tight sm:text-lg" style={{ color: "var(--text-primary)" }}>
            Step 2: Build Team
          </h2>
          <p className="mt-1 text-[0.68rem] leading-tight sm:mt-0.5 sm:text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
            Fill all slots for full coverage analysis.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onOpenTeamTools ? (
            <button
              type="button"
              onClick={onOpenTeamTools}
              className="btn-secondary !px-2.5 !py-1.5 !text-[0.62rem]"
              aria-label="Open team tools"
            >
              <FiTool size={12} />
              Team Tools
            </button>
          ) : null}

          <span
            className="rounded-full px-2.5 py-1 text-[0.62rem] font-semibold tabular-nums sm:text-[0.65rem]"
            style={{
              background: currentTeamLength > 0 ? "var(--accent-soft)" : "var(--surface-2)",
              border: "1px solid var(--border)",
              color: currentTeamLength > 0 ? "var(--accent)" : "var(--text-muted)",
            }}
            aria-label={`${currentTeamLength} out of 6 team slots filled`}
          >
            {currentTeamLength}/6
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3" role="grid" aria-label="Team slots">
        {team.map((pokemon: Pokemon | null, index: number) => (
          <TeamSlot
            key={index}
            id={`team-slot-${index}`}
            index={index}
            isEmpty={!pokemon}
            isOver={activeDropId === `team-slot-${index}`}
            pokemon={pokemon}
            onRemove={pokemon && !lockedSlots[index] ? () => onRemove(index) : null}
            isLocked={lockedSlots[index]}
            onToggleLock={() => onToggleLock(index)}
            replaceMode={replaceMode && !!pokemon && !lockedSlots[index]}
            isReplaceTarget={selectedReplaceSlot === index}
            onSelectForReplace={
              pokemon && !lockedSlots[index]
                ? () => onSelectReplaceSlot(selectedReplaceSlot === index ? null : index)
                : null
            }
          >
            {pokemon ? (
              <div className="h-full w-full p-1 sm:p-0.5">
                <PokemonCard
                  pokemon={pokemon}
                  isDraggable={true}
                  isCompact={true}
                  isAboveFold={true}
                  dragId={`team-${index}-${pokemon.id}`}
                  dragEnabled={dragEnabled}
                />
              </div>
            ) : null}
          </TeamSlot>
        ))}
      </div>
    </section>
  );
};

export default TeamPanel;
