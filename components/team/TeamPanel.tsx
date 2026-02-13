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
      className="bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-xl p-4 sm:p-6"
      aria-labelledby="team-heading"
    >
      <h2
        id="team-heading"
        className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center justify-between"
      >
        Your Team
        <span
          className="text-xs sm:text-sm bg-red-600 px-2 sm:px-3 py-1 rounded-full text-white"
          aria-label={`${currentTeamLength} out of 6 team slots filled`}
        >
          {currentTeamLength}/6
        </span>
      </h2>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 max-h-[50vh] sm:max-h-[calc(100vh-350px)]  pr-1 sm:pr-2 custom-scrollbar my-6"
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
            {pokemon && (
              <div className="w-full h-full p-0.5 sm:p-1">
                <PokemonCard
                  pokemon={pokemon}
                  isDraggable={false}
                  isCompact={true}
                  dragId={`team-${index}-${pokemon.id}`}
                />
              </div>
            )}
          </TeamSlot>
        ))}
      </div>
    </section>
  );
};

export default TeamPanel;
