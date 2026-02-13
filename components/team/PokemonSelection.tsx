"use client";

import { FiSearch, FiX } from "react-icons/fi";
import PokemonCard from "@/components/ui/PokemonCard";
import type { DexMode, Pokemon } from "@/lib/types";

interface PokemonSelectionProps {
  filteredPokemon: Pokemon[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddPokemon: (pokemon: Pokemon) => void;
  currentTeamLength: number;
  dexMode: DexMode;
  onDexModeChange: (mode: DexMode) => void;
  regionalAvailable: boolean;
  dexNotice: string | null;
  generation: number;
  versions: { id: string; label: string }[];
  selectedVersionId: string;
  onVersionChange: (versionId: string) => void;
  versionFilterEnabled: boolean;
  onVersionFilterChange: (enabled: boolean) => void;
}

const PokemonSelection = ({
  filteredPokemon,
  searchTerm,
  onSearchChange,
  onAddPokemon,
  currentTeamLength,
  dexMode,
  onDexModeChange,
  regionalAvailable,
  dexNotice,
  generation,
  versions,
  selectedVersionId,
  onVersionChange,
  versionFilterEnabled,
  onVersionFilterChange,
}: PokemonSelectionProps) => {
  const versionLabelMap: Record<string, string> = Object.fromEntries(
    versions.map((version) => [version.id, version.label])
  );

  return (
    <section className="panel p-4 sm:p-5" aria-labelledby="available-pokemon-heading">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <h2 id="available-pokemon-heading" className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
            Step 1: Pick Pokémon
          </h2>
          <span
            className="rounded-md px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            aria-label={`${filteredPokemon.length} Pokémon available`}
          >
            {filteredPokemon.length}
          </span>
        </div>

        <div className="w-full sm:w-[21.5rem]">
          <div className="mb-2 inline-flex w-full rounded-xl border p-1" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            <button
              type="button"
              onClick={() => onDexModeChange("regional")}
              disabled={!regionalAvailable}
              aria-pressed={dexMode === "regional"}
              className="flex-1 rounded-lg px-2 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] disabled:pointer-events-none disabled:opacity-45"
              style={{
                background: dexMode === "regional" ? "var(--accent-soft)" : "transparent",
                color: dexMode === "regional" ? "var(--text-primary)" : "var(--text-muted)",
                border: dexMode === "regional" ? "1px solid rgba(218, 44, 67, 0.34)" : "1px solid transparent",
              }}
            >
              Regional
            </button>
            <button
              type="button"
              onClick={() => onDexModeChange("national")}
              aria-pressed={dexMode === "national"}
              className="flex-1 rounded-lg px-2 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em]"
              style={{
                background: dexMode === "national" ? "var(--accent-soft)" : "transparent",
                color: dexMode === "national" ? "var(--text-primary)" : "var(--text-muted)",
                border: dexMode === "national" ? "1px solid rgba(218, 44, 67, 0.34)" : "1px solid transparent",
              }}
            >
              National
            </button>
          </div>

          <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <label className="flex items-center gap-2 rounded-xl border px-2.5 py-2" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
                Version
              </span>
              <select
                value={selectedVersionId}
                onChange={(e) => onVersionChange(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none"
                style={{ color: "var(--text-primary)" }}
                aria-label="Select game version"
              >
                {versions.map((version) => (
                  <option key={version.id} value={version.id} style={{ color: "#111827" }}>
                    {version.label}
                  </option>
                ))}
              </select>
            </label>

            <label
              className="inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.08em] md:hover:cursor-pointer"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-muted)" }}
            >
              <input
                type="checkbox"
                checked={versionFilterEnabled}
                onChange={(e) => onVersionFilterChange(e.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                aria-label="Only show Pokemon available in selected version"
              />
              Show Pokémon from selected version
            </label>
          </div>

          <div className="relative">
            <label htmlFor="pokemon-search" className="sr-only">
              Search Pokémon
            </label>
            <FiSearch
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              size={14}
              style={{ color: "var(--text-muted)" }}
              aria-hidden="true"
            />

            <input
              id="pokemon-search"
              name="pokemon-search"
              type="search"
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-xl py-2 pl-8 pr-8 text-sm"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />

            {searchTerm.length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1"
                style={{ color: "var(--text-muted)" }}
                aria-label="Clear search"
              >
                <FiX size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mb-2 text-[0.68rem]" style={{ color: "var(--text-muted)" }}>
        {dexMode === "regional"
          ? "Showing Regional Pokédex entries for this game."
          : `Showing National Pokédex up to Generation ${generation}.`}
      </p>

      <p className="mb-2 text-[0.68rem]" style={{ color: "var(--text-muted)" }}>
        Version view: <span className="font-semibold">{versionLabelMap[selectedVersionId] ?? selectedVersionId}</span>
        {versionFilterEnabled ? " (filter ON)" : " (showing all)"}
      </p>

      {dexNotice && (
        <p className="mb-2 text-[0.68rem]" style={{ color: "#fca5a5" }}>
          {dexNotice}
        </p>
      )}

      <p className="mb-3 text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
        {currentTeamLength < 6
          ? "Tap or drag a card to place it into your team slots."
          : "Your team is full. Remove a member to add another Pokémon."}
      </p>

      <div
        className="grid max-h-[50vh] grid-cols-1 gap-2.5 overflow-y-auto pr-1 custom-scrollbar sm:max-h-[calc(100vh-360px)] sm:grid-cols-2"
        role="list"
        aria-label="Available Pokémon"
      >
        {filteredPokemon.length === 0 && (
          <div
            className="rounded-xl px-4 py-6 text-center text-sm sm:col-span-2"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            No matching Pokémon found. Try a different name.
          </div>
        )}

        {filteredPokemon.map((pokemon: Pokemon, i: number) => (
          <div key={pokemon.id} role="listitem" className="animate-fade-in-up pokemon-list-item" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
            <PokemonCard
              pokemon={pokemon}
              dragId={`available-${pokemon.id}`}
              onTap={onAddPokemon}
              canAddToTeam={currentTeamLength < 6}
              versionLabelMap={versionLabelMap}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default PokemonSelection;
