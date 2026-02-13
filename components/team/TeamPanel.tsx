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
    <section
      className="rounded-2xl p-5 sm:p-6"
      style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
      aria-labelledby="team-heading"
    >
      <div className="flex items-center justify-between mb-5">
        <h2
          id="team-heading"
          className="text-base sm:text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Your Team
        </h2>
        <span
          className="text-[0.65rem] font-semibold tabular-nums px-2.5 py-1 rounded-full"
          style={{
            background: currentTeamLength > 0 ? "rgba(229, 62, 62, 0.15)" : "var(--surface-3)",
            color: currentTeamLength > 0 ? "#f87171" : "var(--text-muted)",
          }}
          aria-label={`${currentTeamLength} out of 6 team slots filled`}
        >
          {currentTeamLength}/6
        </span>
      </div>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3"
        role="grid"
        aria-label="Team slots"
      >
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
              <div className="w-full h-full p-0.5">
                <PokemonCard
                  pokemon={pokemon}
                  isDraggable={false}
                  isCompact={true}
                  dragId={`team-${index}-${pokemon.id}`}
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
