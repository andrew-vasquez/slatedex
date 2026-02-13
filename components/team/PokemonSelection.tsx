"use client";

import { FiSearch } from "react-icons/fi";
import PokemonCard from "@/components/ui/PokemonCard";
import type { Pokemon } from "@/lib/types";

interface PokemonSelectionProps {
  filteredPokemon: Pokemon[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddPokemon: (pokemon: Pokemon) => void;
  currentTeamLength: number;
}

const PokemonSelection = ({
  filteredPokemon,
  searchTerm,
  onSearchChange,
  onAddPokemon,
  currentTeamLength,
}: PokemonSelectionProps) => {
  return (
    <section
      className="bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-xl p-4 sm:p-6"
      aria-labelledby="available-pokemon-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="flex flex-col gap-2">
          <h2
            id="available-pokemon-heading"
            className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3"
          >
            Available Pokémon
            <span
              className="text-xs sm:text-sm bg-gray-700 px-2 sm:px-3 py-1 rounded-full text-gray-300"
              aria-label={`${filteredPokemon.length} Pokémon available`}
            >
              {filteredPokemon.length}
            </span>
          </h2>
          {currentTeamLength < 6 && (
            <p className="text-xs text-gray-400">
              Tap any Pokémon to add to your team
            </p>
          )}
        </div>
        <div className="relative w-full sm:w-auto">
          <label htmlFor="pokemon-search" className="sr-only">
            Search Pokémon
          </label>
          <FiSearch
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
            aria-hidden="true"
          />
          <input
            id="pokemon-search"
            type="text"
            placeholder="Search Pokémon..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            className="pl-10 sm:pl-12 pr-4 py-2 w-full sm:w-64 bg-gray-700/80 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition text-sm sm:text-base"
            aria-describedby="search-help"
          />
          <div id="search-help" className="sr-only">
            Search through available Pokémon by name
          </div>
        </div>
      </div>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 max-h-[50vh] sm:max-h-[calc(100vh-350px)] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar"
        role="grid"
        aria-label="Available Pokémon selection"
      >
        {filteredPokemon.map((pokemon: Pokemon) => (
          <PokemonCard
            key={pokemon.id}
            pokemon={pokemon}
            dragId={`available-${pokemon.id}`}
            onTap={onAddPokemon}
            canAddToTeam={currentTeamLength < 6}
          />
        ))}
      </div>
    </section>
  );
};

export default PokemonSelection;
