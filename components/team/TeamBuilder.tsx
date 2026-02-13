"use client";

import { useState, useCallback, useMemo, useEffect, useDeferredValue } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import dynamic from "next/dynamic";
import PokemonDragPreview from "@/components/ui/PokemonDragPreview";
import TeamBuilderHeader from "./TeamBuilderHeader";
import ClearTeamDialog from "./ClearTeamDialog";
import PokemonSelection from "./PokemonSelection";
import TeamPanel from "./TeamPanel";
import { TYPE_EFFECTIVENESS, TYPE_RESISTANCES } from "@/lib/constants";
import { getTeamDefensiveCoverage } from "@/lib/teamAnalysis";
import type { DexMode, Pokemon, PokemonPools, Game } from "@/lib/types";

const DefensiveCoverage = dynamic(() => import("./DefensiveCoverage"));
const TeamRecommendations = dynamic(() => import("./TeamRecommendations"));

const STORAGE_VERSION = 1;

function getStorageKey(generation: number, gameId: number): string {
  return `team_gen_${generation}_game_${gameId}_v${STORAGE_VERSION}`;
}

function getSelectedVersionStorageKey(gameId: number): string {
  return `selected_version_game_${gameId}_v${STORAGE_VERSION}`;
}

function getVersionFilterStorageKey(gameId: number): string {
  return `version_filter_game_${gameId}_v${STORAGE_VERSION}`;
}

function getSelectedGameStorageKey(generation: number): string {
  return `selected_game_gen_${generation}_v${STORAGE_VERSION}`;
}

function createEmptyTeam(): (Pokemon | null)[] {
  return Array(6).fill(null);
}

function getPokemonEffectivenessAgainstType(pokemon: Pokemon, attackingType: string): number {
  let effectiveness = 1;

  pokemon.types.forEach((defenderType: string) => {
    const weaknesses: string[] = TYPE_EFFECTIVENESS[defenderType] || [];
    if (weaknesses.includes(attackingType)) effectiveness *= 2;

    const resistances: string[] = TYPE_RESISTANCES[defenderType] || [];
    if (resistances.includes(attackingType)) effectiveness *= 0.5;
  });

  return effectiveness;
}

interface Recommendation {
  pokemon: Pokemon;
  score: number;
  covers: string[];
  risky: string[];
}

interface TeamBuilderProps {
  generation: number;
  games: Game[];
  allPools: Record<number, PokemonPools>;
}

const TeamBuilder = ({ generation, games, allPools }: TeamBuilderProps) => {
  const [selectedGameId, setSelectedGameId] = useState<number>(games[0].id);
  const [team, setTeam] = useState<(Pokemon | null)[]>(createEmptyTeam);

  const [searchTerm, setSearchTerm] = useState("");
  const [draggedPokemon, setDraggedPokemon] = useState<Pokemon | null>(null);
  const [activeDropId, setActiveDropId] = useState<string | null>(null);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [recommendationsEnabled, setRecommendationsEnabled] = useState(true);
  const [dexMode, setDexMode] = useState<DexMode>("national");
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [versionFilterEnabled, setVersionFilterEnabled] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(false);

  const selectedGame = useMemo(() => games.find((g) => g.id === selectedGameId) ?? games[0], [games, selectedGameId]);
  const pokemonPools = useMemo(() => allPools[selectedGame.id] ?? allPools[games[0].id], [allPools, selectedGame.id, games]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const persistTeam = useCallback(
    (newTeam: (Pokemon | null)[]) => {
      try {
        localStorage.setItem(getStorageKey(generation, selectedGame.id), JSON.stringify(newTeam));
      } catch {
        // ignore storage errors
      }
    },
    [generation, selectedGame.id]
  );

  // Load persisted game selection
  useEffect(() => {
    try {
      const saved = localStorage.getItem(getSelectedGameStorageKey(generation));
      if (saved) {
        const savedId = parseInt(saved);
        if (games.some((g) => g.id === savedId)) {
          setSelectedGameId(savedId);
          return;
        }
      }
    } catch {
      // ignore
    }
    setSelectedGameId(games[0].id);
  }, [generation, games]);

  // Persist game selection
  useEffect(() => {
    try {
      localStorage.setItem(getSelectedGameStorageKey(generation), String(selectedGameId));
    } catch {
      // ignore
    }
  }, [generation, selectedGameId]);

  // Load team from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(generation, selectedGame.id));
      if (!saved) {
        setTeam(createEmptyTeam());
        return;
      }

      const parsed = JSON.parse(saved) as (Pokemon | null)[];
      if (Array.isArray(parsed) && parsed.length === 6) {
        setTeam(parsed);
      } else {
        setTeam(createEmptyTeam());
      }
    } catch {
      setTeam(createEmptyTeam());
    }
  }, [generation, selectedGame.id]);

  useEffect(() => {
    const canUsePointerDrag =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches && navigator.maxTouchPoints === 0;
    setDragEnabled(canUsePointerDrag);
  }, []);

  useEffect(() => {
    setDexMode(pokemonPools.regionalResolved ? "regional" : "national");
  }, [selectedGame.id, pokemonPools.regionalResolved]);

  useEffect(() => {
    const allowedVersionIds = new Set(selectedGame.versions.map((version) => version.id));
    const defaultVersionId = selectedGame.versions[0]?.id ?? "";

    try {
      const saved = localStorage.getItem(getSelectedVersionStorageKey(selectedGame.id));
      if (saved && allowedVersionIds.has(saved)) {
        setSelectedVersionId(saved);
      } else {
        setSelectedVersionId(defaultVersionId);
      }
    } catch {
      setSelectedVersionId(defaultVersionId);
    }
  }, [selectedGame.id, selectedGame.versions]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(getVersionFilterStorageKey(selectedGame.id));
      setVersionFilterEnabled(saved === "true");
    } catch {
      setVersionFilterEnabled(false);
    }
  }, [selectedGame.id]);

  useEffect(() => {
    if (!selectedVersionId) return;
    try {
      localStorage.setItem(getSelectedVersionStorageKey(selectedGame.id), selectedVersionId);
    } catch {
      // ignore storage errors
    }
  }, [selectedGame.id, selectedVersionId]);

  useEffect(() => {
    try {
      localStorage.setItem(getVersionFilterStorageKey(selectedGame.id), versionFilterEnabled ? "true" : "false");
    } catch {
      // ignore storage errors
    }
  }, [selectedGame.id, versionFilterEnabled]);

  const handleGameChange = useCallback((gameId: number) => {
    setSelectedGameId(gameId);
    setSearchTerm("");
  }, []);

  const updateTeam = useCallback(
    (newTeam: (Pokemon | null)[]) => {
      setTeam(newTeam);
      persistTeam(newTeam);
    },
    [persistTeam]
  );

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const lowerSearch = deferredSearchTerm.toLowerCase();
  const teamPokemonIds = useMemo(
    () => new Set(team.filter((p): p is Pokemon => p !== null).map((p) => p.id)),
    [team]
  );

  const handleDexModeChange = useCallback(
    (nextMode: DexMode) => {
      if (nextMode === "regional" && !pokemonPools.regionalResolved) {
        setDexMode("national");
        return;
      }

      setDexMode(nextMode);
    },
    [pokemonPools.regionalResolved]
  );

  const activePokemonPool = useMemo(
    () => (dexMode === "regional" && pokemonPools.regionalResolved ? pokemonPools.regional : pokemonPools.national),
    [dexMode, pokemonPools.national, pokemonPools.regional, pokemonPools.regionalResolved]
  );

  const versionScopedPokemonPool = useMemo(() => {
    if (!versionFilterEnabled || !selectedVersionId) return activePokemonPool;

    return activePokemonPool.filter((pokemon) => {
      if (pokemon.exclusiveStatus !== "exclusive") return true;
      if (!pokemon.exclusiveToVersionIds || pokemon.exclusiveToVersionIds.length === 0) return true;
      return pokemon.exclusiveToVersionIds.includes(selectedVersionId);
    });
  }, [activePokemonPool, selectedVersionId, versionFilterEnabled]);

  const availablePokemon = useMemo(
    () => versionScopedPokemonPool.filter((p) => !teamPokemonIds.has(p.id)),
    [teamPokemonIds, versionScopedPokemonPool]
  );

  const filteredPokemon = useMemo(() => {
    if (!lowerSearch) return availablePokemon;
    return availablePokemon.filter((p) => p.name.toLowerCase().includes(lowerSearch));
  }, [availablePokemon, lowerSearch]);

  const handleDragStart = useCallback((e: DragStartEvent) => setDraggedPokemon(e.active.data.current?.pokemon), []);
  const handleDragOver = useCallback((e: DragOverEvent) => setActiveDropId((e.over?.id as string) || null), []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setDraggedPokemon(null);
      setActiveDropId(null);

      if (!over || !active.data.current?.pokemon) return;

      const slotIndex = parseInt((over.id as string).split("-")[2]);
      if ((over.id as string).startsWith("team-slot-") && slotIndex >= 0 && slotIndex < 6) {
        setTeam((prev) => {
          const newTeam = [...prev];
          newTeam[slotIndex] = active.data.current!.pokemon;
          persistTeam(newTeam);
          return newTeam;
        });
      }
    },
    [persistTeam]
  );

  const removeFromTeam = useCallback(
    (index: number) => {
      setTeam((prev) => {
        const newTeam = [...prev];
        newTeam[index] = null;
        persistTeam(newTeam);
        return newTeam;
      });
    },
    [persistTeam]
  );

  const openClearDialog = useCallback(() => {
    if (team.every((slot) => slot === null)) return;
    setIsClearDialogOpen(true);
  }, [team]);

  const closeClearDialog = useCallback(() => {
    setIsClearDialogOpen(false);
  }, []);

  const confirmClearTeam = useCallback(() => {
    const empty = createEmptyTeam();
    updateTeam(empty);
    setIsClearDialogOpen(false);
  }, [updateTeam]);

  const shuffleTeam = useCallback(() => {
    setTeam((prev) => {
      const currentTeam = prev.filter((p): p is Pokemon => p !== null);
      for (let i = currentTeam.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentTeam[i], currentTeam[j]] = [currentTeam[j], currentTeam[i]];
      }

      const newTeam: (Pokemon | null)[] = [...currentTeam, ...Array(6 - currentTeam.length).fill(null)];
      persistTeam(newTeam);
      return newTeam;
    });
  }, [persistTeam]);

  const addPokemonToTeam = useCallback(
    (pokemon: Pokemon) => {
      setTeam((prev) => {
        const firstEmptySlot = prev.findIndex((slot) => slot === null);
        if (firstEmptySlot === -1) return prev;

        const newTeam = [...prev];
        newTeam[firstEmptySlot] = pokemon;
        persistTeam(newTeam);
        return newTeam;
      });
    },
    [persistTeam]
  );

  const currentTeam = useMemo(() => team.filter((p): p is Pokemon => p !== null), [team]);
  const defensiveCoverage = useMemo(() => getTeamDefensiveCoverage(currentTeam, generation), [currentTeam, generation]);

  const exposedTypeNames = useMemo(
    () =>
      Object.entries(defensiveCoverage)
        .filter(([, entry]) => !entry.locked && entry.weakPokemon.length > entry.resistPokemon.length)
        .map(([type]) => type),
    [defensiveCoverage]
  );

  const exposedTypes = exposedTypeNames.length;

  const stableTypes = Object.values(defensiveCoverage).filter(
    (entry) => !entry.locked && entry.resistPokemon.length >= entry.weakPokemon.length
  ).length;

  const recommendations = useMemo<Recommendation[]>(() => {
    if (!recommendationsEnabled || currentTeam.length === 0 || availablePokemon.length === 0) return [];

    const candidatePool = availablePokemon.filter((pokemon) => pokemon.isFinalEvolution);

    if (candidatePool.length === 0) return [];

    const deficitByType = Object.entries(defensiveCoverage)
      .filter(([, entry]) => !entry.locked)
      .map(([type, entry]) => ({ type, deficit: Math.max(0, entry.weakPokemon.length - entry.resistPokemon.length) }))
      .filter((entry) => entry.deficit > 0);

    if (deficitByType.length === 0) return [];

    const ranked = candidatePool.map((pokemon) => {
      let score = 0;
      const covers: string[] = [];
      const risky: string[] = [];

      deficitByType.forEach(({ type, deficit }) => {
        const effectiveness = getPokemonEffectivenessAgainstType(pokemon, type);

        if (effectiveness < 1) {
          score += effectiveness <= 0.5 ? 1.9 * deficit : 1.4 * deficit;
          if (covers.length < 3) covers.push(type);
        } else if (effectiveness > 1) {
          score -= effectiveness >= 4 ? 1.9 * deficit : 1.1 * deficit;
          if (risky.length < 2) risky.push(type);
        } else {
          score += 0.15 * deficit;
        }
      });

      const bulkBonus = (pokemon.hp + pokemon.defense + pokemon.attack) / 240;
      score += bulkBonus;

      return { pokemon, score, covers, risky };
    });

    return ranked.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [availablePokemon, currentTeam.length, defensiveCoverage, recommendationsEnabled]);

  return (
    <DndContext
      id={`team-builder-dnd-${selectedGame.id}`}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen" style={{ color: "var(--text-primary)" }}>
        <TeamBuilderHeader game={selectedGame} generation={generation} onShuffle={shuffleTeam} onClear={openClearDialog} teamLength={currentTeam.length} />

        <main id="main-content" className="mx-auto max-w-screen-xl px-4 pb-8 pt-4 sm:px-6 sm:pb-10" role="main">
          <section className="panel mb-4 p-4 sm:mb-5 sm:p-5" aria-label="Team planning status">
            <h2 className="font-display text-lg sm:text-xl" style={{ color: "var(--text-primary)" }}>
              Build Order
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="panel-soft px-3.5 py-3">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                  Drafted
                </p>
                <p className="font-display mt-1 text-2xl" style={{ color: "var(--accent)" }}>
                  {currentTeam.length}/6
                </p>
              </div>
              <div className="panel-soft px-3.5 py-3">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                  Exposed Types
                </p>
                <p className="font-display mt-1 text-2xl" style={{ color: exposedTypes > 0 ? "#b91c1c" : "#136f3a" }}>
                  {exposedTypes}
                </p>
              </div>
              <div className="panel-soft px-3.5 py-3">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                  Stable Matchups
                </p>
                <p className="font-display mt-1 text-2xl" style={{ color: "var(--accent-blue)" }}>
                  {stableTypes}
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
            <div className="min-w-0">
              <PokemonSelection
                filteredPokemon={filteredPokemon}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onAddPokemon={addPokemonToTeam}
                currentTeamLength={currentTeam.length}
                dexMode={dexMode}
                onDexModeChange={handleDexModeChange}
                regionalAvailable={pokemonPools.regionalResolved}
                dexNotice={pokemonPools.regionalResolved ? null : "Regional dex unavailable; switched to National."}
                generation={generation}
                versions={selectedGame.versions}
                selectedVersionId={selectedVersionId}
                onVersionChange={setSelectedVersionId}
                versionFilterEnabled={versionFilterEnabled}
                onVersionFilterChange={setVersionFilterEnabled}
                dragEnabled={dragEnabled}
                games={games}
                selectedGameId={selectedGame.id}
                onGameChange={handleGameChange}
              />
            </div>

            <TeamPanel
              team={team}
              currentTeamLength={currentTeam.length}
              activeDropId={activeDropId}
              onRemove={removeFromTeam}
            />
          </div>

          {currentTeam.length > 0 && (
            <section className="mt-4 sm:mt-5">
              <TeamRecommendations
                recommendations={recommendations}
                exposedTypes={exposedTypeNames}
                teamFull={currentTeam.length >= 6}
                recommendationsEnabled={recommendationsEnabled}
                onToggleRecommendations={setRecommendationsEnabled}
                onAddPokemon={addPokemonToTeam}
              />
            </section>
          )}

          {currentTeam.length > 0 && (
            <section className="mt-4 sm:mt-5" aria-labelledby="coverage-heading">
              <DefensiveCoverage coverage={defensiveCoverage} generation={generation} />
            </section>
          )}
        </main>
      </div>

      <DragOverlay>{draggedPokemon && <PokemonDragPreview pokemon={draggedPokemon} />}</DragOverlay>
      <ClearTeamDialog
        isOpen={isClearDialogOpen}
        teamCount={currentTeam.length}
        onCancel={closeClearDialog}
        onConfirm={confirmClearTeam}
      />
    </DndContext>
  );
};

export default TeamBuilder;
