"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import MatchupBucketCard from "@/components/ui/MatchupBucketCard";
import { PokemonTypeBadge, PokemonTypeButton } from "@/components/ui/PokemonTypeBadge";
import { pokemonSpriteSrc } from "@/lib/image";
import { formatPokemonType } from "@/lib/pokemonTypePalette";
import { getDefensiveMatchups, getTypeChartProfile } from "@/lib/type-matchups";
import { ALL_TYPES } from "@/lib/constants";

interface TypeChartPokemon {
  id: number;
  name: string;
  generation: number;
  sprite: string;
  types: string[];
}

interface TypeChartClientProps {
  pokemon: TypeChartPokemon[];
}

function formatPokemonName(name: string): string {
  return name
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export default function TypeChartClient({ pokemon }: TypeChartClientProps) {
  const [selectedType, setSelectedType] = useState("fire");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const searchablePokemon = useMemo(
    () =>
      pokemon.map((entry) => {
        const formattedName = formatPokemonName(entry.name);
        return {
          entry,
          formattedName,
          nameLower: entry.name.toLowerCase(),
          formattedNameLower: formattedName.toLowerCase(),
          typeSearch: entry.types.join(" ").toLowerCase(),
          dexSearch: String(entry.id),
        };
      }),
    [pokemon]
  );

  const searchResults = useMemo(() => {
    const normalizedQuery = deferredSearchTerm.trim().toLowerCase();
    if (!normalizedQuery) return [];

    return searchablePokemon
      .map((item) => {
        let score = Number.POSITIVE_INFINITY;
        if (item.dexSearch === normalizedQuery) score = 0;
        else if (item.nameLower === normalizedQuery || item.formattedNameLower === normalizedQuery) score = 1;
        else if (item.nameLower.startsWith(normalizedQuery) || item.formattedNameLower.startsWith(normalizedQuery)) score = 2;
        else if (item.typeSearch.includes(normalizedQuery)) score = 3;
        else if (item.nameLower.includes(normalizedQuery) || item.formattedNameLower.includes(normalizedQuery)) score = 4;

        return { item, score };
      })
      .filter((candidate) => Number.isFinite(candidate.score))
      .sort((a, b) => a.score - b.score || a.item.entry.id - b.item.entry.id)
      .slice(0, 12)
      .map(({ item }) => item.entry);
  }, [deferredSearchTerm, searchablePokemon]);

  const selectedPokemon = useMemo(
    () => pokemon.find((entry) => entry.id === selectedPokemonId) ?? null,
    [pokemon, selectedPokemonId]
  );

  const selectedPokemonMatchups = useMemo(
    () => (selectedPokemon ? getDefensiveMatchups(selectedPokemon.types) : null),
    [selectedPokemon]
  );

  const typeProfile = useMemo(
    () => getTypeChartProfile(selectedType),
    [selectedType]
  );

  return (
    <div className="weakness-tool-shell">
      <section className="panel weakness-tool-intro">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="weakness-kicker">Type reference</p>
            <h1 className="font-display weakness-page-title">Every type. Clear strengths and weaknesses.</h1>
            <p className="weakness-page-copy">
              Pick any type to see what it hits well, what resists it, and what it struggles against on defense.
              Search a Pokemon too, and you can instantly inspect its typing with the same bucket system from the weakness tool.
            </p>
          </div>
          <div className="weakness-summary-badges">
            <span className="weakness-summary-chip">{ALL_TYPES.length} Pokemon types</span>
            <span className="weakness-summary-chip">Type chart + Pokemon lookup in one place</span>
          </div>
        </div>
      </section>

      <div className="weakness-tool-layout">
        <section className="panel weakness-browser-panel">
          <div className="weakness-browser-toolbar">
            <label className="weakness-search-shell">
              <FiSearch size={18} aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  startTransition(() => {
                    setSearchTerm(nextValue);
                  });
                }}
                placeholder="Search a Pokemon by name, type, or dex number"
                className="weakness-search-input"
                aria-label="Search a Pokemon by name, type, or dex number"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="search"
                inputMode="search"
              />
              {searchTerm ? (
                <button
                  type="button"
                  className="weakness-search-clear"
                  onClick={() => {
                    startTransition(() => {
                      setSearchTerm("");
                    });
                  }}
                  aria-label="Clear Pokemon search"
                >
                  <FiX size={15} aria-hidden="true" />
                </button>
              ) : null}
            </label>

            <div className="weakness-toolbar-meta">
              <span>{searchResults.length > 0 ? `${searchResults.length} matches` : "Search a Pokemon to see its typing"}</span>
              <span>Selected type: {formatPokemonType(selectedType)}</span>
            </div>
          </div>

          <div className="type-chart-browser">
            <div className="panel-soft type-chart-type-panel">
              <p className="type-chart-section-label">Browse types</p>
              <div className="type-chart-type-grid">
                {ALL_TYPES.map((type) => (
                  <PokemonTypeButton
                    key={type}
                    pokemonType={type}
                    size="sm"
                    pressed={selectedType === type}
                    onClick={() => setSelectedType(type)}
                    className="type-chart-type-button"
                  >
                    {formatPokemonType(type)}
                  </PokemonTypeButton>
                ))}
              </div>
            </div>

            <div className="panel-soft type-chart-search-panel">
              <p className="type-chart-section-label">Pokemon lookup</p>
              {selectedPokemon ? (
                <div className="type-chart-selected-pokemon">
                  <img
                    src={pokemonSpriteSrc(selectedPokemon.sprite, selectedPokemon.id)}
                    alt={formatPokemonName(selectedPokemon.name)}
                    width={56}
                    height={56}
                    className="pixelated h-14 w-14 object-contain"
                  />
                  <div className="min-w-0">
                    <p className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
                      {formatPokemonName(selectedPokemon.name)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedPokemon.types.map((type) => (
                        <PokemonTypeButton
                          key={`${selectedPokemon.id}-${type}`}
                          pokemonType={type}
                          size="sm"
                          pressed={selectedType === type}
                          onClick={() => setSelectedType(type)}
                        >
                          {formatPokemonType(type)}
                        </PokemonTypeButton>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="coverage-summary-empty">Search a Pokemon and tap a result to pin its types here.</p>
              )}

              {searchResults.length > 0 ? (
                <div className="type-chart-search-results">
                  {searchResults.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className="type-chart-search-result"
                      onClick={() => {
                        setSelectedPokemonId(entry.id);
                        setSelectedType(entry.types[0] ?? selectedType);
                      }}
                    >
                      <img
                        src={pokemonSpriteSrc(entry.sprite, entry.id)}
                        alt=""
                        width={40}
                        height={40}
                        className="pixelated h-10 w-10 object-contain"
                      />
                      <div className="min-w-0">
                        <p className="type-chart-search-name">{formatPokemonName(entry.name)}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {entry.types.map((type) => (
                            <PokemonTypeBadge key={`${entry.id}-${type}`} pokemonType={type} size="xs" />
                          ))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchTerm ? (
                <p className="coverage-summary-empty">No Pokemon matched that search.</p>
              ) : null}
            </div>
          </div>
        </section>

        <aside className="weakness-detail-column">
          <div className="panel weakness-detail-panel">
            <div className="weakness-detail-header">
              <div className="type-chart-type-badge-wrap">
                <PokemonTypeBadge pokemonType={selectedType} size="md" />
              </div>
              <div className="min-w-0">
                <p className="weakness-kicker">Selected type</p>
                <h2 className="font-display weakness-detail-name">{formatPokemonType(selectedType)}</h2>
                <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
                  Offensive and defensive relationships for the {formatPokemonType(selectedType)} type.
                </p>
              </div>
            </div>

            <div className="type-chart-subsection">
              <p className="type-chart-subsection-label">Attack side</p>
              <div className="weakness-bucket-grid">
                <MatchupBucketCard title="Strong against" multiplier="2x" items={typeProfile.offensive.strongAgainst} tone="success" />
                <MatchupBucketCard title="Resisted by" multiplier="0.5x" items={typeProfile.offensive.resistedBy} tone="danger" />
                <MatchupBucketCard title="No effect" multiplier="0x" items={typeProfile.offensive.noEffectAgainst} tone="neutral" />
                <MatchupBucketCard
                  title="Neutral targets"
                  multiplier="1x"
                  items={typeProfile.offensive.neutralAgainst}
                  tone="neutral"
                  compactSummary={`${typeProfile.offensive.neutralAgainst.length} defending types take regular damage.`}
                />
              </div>
            </div>

            <div className="type-chart-subsection">
              <p className="type-chart-subsection-label">Defense side</p>
              <div className="weakness-bucket-grid">
                <MatchupBucketCard title="Weak to" multiplier="2x" items={typeProfile.defensive.weakTo} tone="danger" />
                <MatchupBucketCard title="Resists" multiplier="0.5x" items={typeProfile.defensive.resistTo} tone="success" />
                <MatchupBucketCard title="Immune to" multiplier="0x" items={typeProfile.defensive.immuneTo} tone="neutral" />
                <MatchupBucketCard
                  title="Neutral matchups"
                  multiplier="1x"
                  items={typeProfile.defensive.neutralTo}
                  tone="neutral"
                  compactSummary={`${typeProfile.defensive.neutralTo.length} attacking types hit for regular damage.`}
                />
              </div>
            </div>

            {selectedPokemon && selectedPokemonMatchups ? (
              <div className="type-chart-subsection">
                <p className="type-chart-subsection-label">Selected Pokemon weaknesses</p>
                <div className="weakness-bucket-grid">
                  <MatchupBucketCard title="Quad weaknesses" multiplier="4x" items={selectedPokemonMatchups.buckets.quadWeak} tone="danger" />
                  <MatchupBucketCard title="Weaknesses" multiplier="2x" items={selectedPokemonMatchups.buckets.weak} tone="danger" />
                  <MatchupBucketCard title="Resists" multiplier="0.5x" items={selectedPokemonMatchups.buckets.resist} tone="success" />
                  <MatchupBucketCard title="Strong resists" multiplier="0.25x" items={selectedPokemonMatchups.buckets.strongResist} tone="success" />
                  <MatchupBucketCard title="Immunities" multiplier="0x" items={selectedPokemonMatchups.buckets.immune} tone="neutral" />
                  <MatchupBucketCard
                    title="Neutral hits"
                    multiplier="1x"
                    items={selectedPokemonMatchups.buckets.neutral}
                    tone="neutral"
                    compactSummary={`${selectedPokemonMatchups.buckets.neutral.length} attacking types deal regular damage.`}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
