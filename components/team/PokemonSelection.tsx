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
      className="rounded-2xl p-5 sm:p-6"
      style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
      aria-labelledby="available-pokemon-heading"
    >
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <h2
            id="available-pokemon-heading"
            className="text-base sm:text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Available Pokémon
          </h2>
          <span
            className="text-[0.65rem] font-medium tabular-nums px-2 py-0.5 rounded-md"
            style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
            aria-label={`${filteredPokemon.length} Pokémon available`}
          >
            {filteredPokemon.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-56">
          <label htmlFor="pokemon-search" className="sr-only">Search Pokémon</label>
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2"
            size={14}
            style={{ color: "var(--text-muted)" }}
            aria-hidden="true"
          />
          <input
            id="pokemon-search"
            type="text"
            placeholder="Search…"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            className="pl-8 pr-3 py-2 w-full rounded-lg text-sm transition-all duration-200
                       focus:ring-2 focus:ring-red-500/40 focus:border-transparent"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {currentTeamLength < 6 && (
        <p className="text-[0.7rem] mb-4" style={{ color: "var(--text-muted)" }}>
          Tap or drag a Pokémon to add it to your team
        </p>
      )}

      {/* Pokemon grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] sm:max-h-[calc(100vh-280px)] overflow-y-auto pr-1 custom-scrollbar"
        role="list"
        aria-label="Available Pokémon"
      >
        {filteredPokemon.map((pokemon: Pokemon, i: number) => (
          <div
            key={pokemon.id}
            role="listitem"
            className="animate-fade-in-up"
            style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
          >
            <PokemonCard
              pokemon={pokemon}
              dragId={`available-${pokemon.id}`}
              onTap={onAddPokemon}
              canAddToTeam={currentTeamLength < 6}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default PokemonSelection;
