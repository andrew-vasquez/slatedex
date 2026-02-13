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
      <div className="mb-4 flex items-center justify-between sm:mb-5">
        <div>
          <h2 id="team-heading" className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
            Step 2: Build Team
          </h2>
          <p className="mt-0.5 text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
            Fill all slots for full coverage analysis.
          </p>
        </div>

        <span
          className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold tabular-nums"
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

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3" role="grid" aria-label="Team slots">
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
              <div className="h-full w-full p-0.5">
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
