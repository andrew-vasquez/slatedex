"use client";

import TeamSlot from "./TeamSlot";
import PokemonCard from "@/components/ui/PokemonCard";
import type { Pokemon } from "@/lib/types";

interface TeamPanelProps {
  team: (Pokemon | null)[];
  currentTeamLength: number;
  activeDropId: string | null;
  onRemove: (index: number) => void;
}

const TeamPanel = ({ team, currentTeamLength, activeDropId, onRemove }: TeamPanelProps) => {
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

        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[0.62rem] font-semibold tabular-nums sm:text-[0.65rem]"
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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3" role="grid" aria-label="Team slots">
        {team.map((pokemon: Pokemon | null, index: number) => (
          <TeamSlot
            key={index}
            id={`team-slot-${index}`}
            isEmpty={!pokemon}
            isOver={activeDropId === `team-slot-${index}`}
            pokemon={pokemon}
            onRemove={pokemon ? () => onRemove(index) : null}
          >
            {pokemon ? (
              <div className="h-full w-full p-1 sm:p-0.5">
                <PokemonCard pokemon={pokemon} isDraggable={false} isCompact={true} dragId={`team-${index}-${pokemon.id}`} />
              </div>
            ) : null}
          </TeamSlot>
        ))}
      </div>
    </section>
  );
};

export default TeamPanel;
