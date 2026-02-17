"use client";

import { useState, useCallback, useMemo, useEffect, useDeferredValue, useRef } from "react";
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
import SavedTeamsPanel from "./SavedTeamsPanel";
import UndoToast from "@/components/ui/UndoToast";
import PokemonDetailDrawer from "@/components/ui/PokemonDetailDrawer";
import { TYPE_EFFECTIVENESS, TYPE_RESISTANCES } from "@/lib/constants";
import { getTeamDefensiveCoverage, getTeamOffensiveCoverage } from "@/lib/teamAnalysis";
import { useTeamPersistence } from "@/hooks/useTeamPersistence";
import type { DexMode, Pokemon, PokemonPools, Game } from "@/lib/types";

const DefensiveCoverage = dynamic(() => import("./DefensiveCoverage"));
const OffensiveCoverage = dynamic(() => import("./OffensiveCoverage"));
const TeamRecommendations = dynamic(() => import("./TeamRecommendations"));

const STORAGE_VERSION = 1;

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

  const [searchTerm, setSearchTerm] = useState("");
  const [draggedPokemon, setDraggedPokemon] = useState<Pokemon | null>(null);
  const [activeDropId, setActiveDropId] = useState<string | null>(null);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [recommendationsEnabled, setRecommendationsEnabled] = useState(true);
  const [dexMode, setDexMode] = useState<DexMode>("national");
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [versionFilterEnabled, setVersionFilterEnabled] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [undoAction, setUndoAction] = useState<{ pokemon: Pokemon; index: number } | null>(null);
  const undoTeamRef = useRef<(Pokemon | null)[]>(createEmptyTeam());
  const [detailPokemon, setDetailPokemon] = useState<Pokemon | null>(null);

  const selectedGame = useMemo(() => games.find((g) => g.id === selectedGameId) ?? games[0], [games, selectedGameId]);
  const pokemonPools = useMemo(() => allPools[selectedGame.id] ?? allPools[games[0].id], [allPools, selectedGame.id, games]);

  // Team persistence (API for authenticated, localStorage for guests)
  const {
    team,
    setTeam: persistTeam,
    savedTeams,
    activeTeamId,
    saveTeamAs,
    loadSavedTeam,
    deleteSavedTeam,
    renameSavedTeam,
    isAuthenticated,
    isSaving,
    refreshSavedTeams,
  } = useTeamPersistence({ generation, gameId: selectedGame.id });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
    let pool = availablePokemon;
    if (typeFilter) {
      pool = pool.filter((p) => p.types.includes(typeFilter));
    }
    if (!lowerSearch) return pool;
    return pool.filter((p) => p.name.toLowerCase().includes(lowerSearch));
  }, [availablePokemon, lowerSearch, typeFilter]);

  const handleDragStart = useCallback((e: DragStartEvent) => setDraggedPokemon(e.active.data.current?.pokemon), []);
  const handleDragOver = useCallback((e: DragOverEvent) => setActiveDropId((e.over?.id as string) || null), []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setDraggedPokemon(null);
      setActiveDropId(null);

      if (!over || !active.data.current?.pokemon) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Determine if drop target is a team slot
      if (!overId.startsWith("team-slot-")) return;
      const targetSlot = parseInt(overId.split("-")[2]);
      if (targetSlot < 0 || targetSlot >= 6) return;

      // Determine if drag originated from a team slot (format: "team-{index}-{pokemonId}")
      const isFromTeam = activeId.startsWith("team-") && !activeId.startsWith("team-slot-");

      if (isFromTeam) {
        // Slot-to-slot swap
        const sourceSlot = parseInt(activeId.split("-")[1]);
        if (sourceSlot === targetSlot) return;
        const newTeam = [...team];
        [newTeam[sourceSlot], newTeam[targetSlot]] = [newTeam[targetSlot], newTeam[sourceSlot]];
        persistTeam(newTeam);
      } else {
        // Adding from available pool to team slot
        const newTeam = [...team];
        newTeam[targetSlot] = active.data.current!.pokemon;
        persistTeam(newTeam);
      }
    },
    [team, persistTeam]
  );

  const removeFromTeam = useCallback(
    (index: number) => {
      const removed = team[index];
      if (removed) {
        undoTeamRef.current = [...team];
        setUndoAction({ pokemon: removed, index });
      }
      const newTeam = [...team];
      newTeam[index] = null;
      persistTeam(newTeam);
    },
    [team, persistTeam]
  );

  const handleUndo = useCallback(() => {
    if (!undoAction) return;
    persistTeam(undoTeamRef.current);
    setUndoAction(null);
  }, [undoAction, persistTeam]);

  const dismissUndo = useCallback(() => {
    setUndoAction(null);
  }, []);

  // Keyboard shortcuts: / to focus search, Esc to clear, Ctrl+Z to undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;

      // Ctrl/Cmd+Z for undo — works even when in an input
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (undoAction) {
          e.preventDefault();
          handleUndo();
        }
        return;
      }

      // Escape: clear search if search is focused, otherwise close type filter
      if (e.key === "Escape") {
        const searchInput = document.getElementById("pokemon-search") as HTMLInputElement | null;
        if (searchInput && document.activeElement === searchInput) {
          if (searchTerm) {
            setSearchTerm("");
          } else {
            searchInput.blur();
          }
          e.preventDefault();
          return;
        }
        if (typeFilter) {
          setTypeFilter(null);
          e.preventDefault();
        }
        return;
      }

      // / to focus search (only when not in an input)
      if (e.key === "/" && !isInput) {
        e.preventDefault();
        const searchInput = document.getElementById("pokemon-search") as HTMLInputElement | null;
        searchInput?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undoAction, handleUndo, searchTerm, typeFilter]);

  const openClearDialog = useCallback(() => {
    if (team.every((slot) => slot === null)) return;
    setIsClearDialogOpen(true);
  }, [team]);

  const closeClearDialog = useCallback(() => {
    setIsClearDialogOpen(false);
  }, []);

  const confirmClearTeam = useCallback(() => {
    updateTeam(createEmptyTeam());
    setIsClearDialogOpen(false);
  }, [updateTeam]);

  const shuffleTeam = useCallback(() => {
    const currentMembers = team.filter((p): p is Pokemon => p !== null);
    for (let i = currentMembers.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentMembers[i], currentMembers[j]] = [currentMembers[j], currentMembers[i]];
    }
    const newTeam: (Pokemon | null)[] = [...currentMembers, ...Array(6 - currentMembers.length).fill(null)];
    persistTeam(newTeam);
  }, [team, persistTeam]);

  const addPokemonToTeam = useCallback(
    (pokemon: Pokemon) => {
      const firstEmptySlot = team.findIndex((slot) => slot === null);
      if (firstEmptySlot === -1) return;

      const newTeam = [...team];
      newTeam[firstEmptySlot] = pokemon;
      persistTeam(newTeam);
    },
    [team, persistTeam]
  );

  const currentTeam = useMemo(() => team.filter((p): p is Pokemon => p !== null), [team]);
  const defensiveCoverage = useMemo(() => getTeamDefensiveCoverage(currentTeam, generation), [currentTeam, generation]);
  const offensiveCoverage = useMemo(() => getTeamOffensiveCoverage(currentTeam, generation), [currentTeam, generation]);

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
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg sm:text-xl" style={{ color: "var(--text-primary)" }}>
                Build Order
              </h2>
              {isSaving && (
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                  Saving...
                </span>
              )}
            </div>
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
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                onInspect={setDetailPokemon}
              />
            </div>

            <div className="flex flex-col gap-4">
              <TeamPanel
                team={team}
                currentTeamLength={currentTeam.length}
                activeDropId={activeDropId}
                onRemove={removeFromTeam}
                dragEnabled={dragEnabled}
              />

              {isAuthenticated && (
                <SavedTeamsPanel
                  savedTeams={savedTeams}
                  activeTeamId={activeTeamId}
                  onSaveAs={saveTeamAs}
                  onLoad={loadSavedTeam}
                  onDelete={deleteSavedTeam}
                  onRename={renameSavedTeam}
                  onRefresh={refreshSavedTeams}
                  isSaving={isSaving}
                />
              )}
            </div>
          </div>

          {currentTeam.length === 0 ? (
            <section className="panel mt-4 p-6 sm:mt-5 sm:p-8 text-center" aria-label="Getting started">
              <div className="mx-auto max-w-md">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <h3 className="font-display text-base sm:text-lg" style={{ color: "var(--text-primary)" }}>
                  Add your first Pokemon
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
                  Pick a Pokemon from the list to start building your team. Once you add members, you&apos;ll see type coverage analysis, defensive matchups, and smart recommendations here.
                </p>
              </div>
            </section>
          ) : (
            <>
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

              <section className="mt-4 sm:mt-5" aria-labelledby="coverage-heading">
                <DefensiveCoverage coverage={defensiveCoverage} generation={generation} />
              </section>

              <section className="mt-4 sm:mt-5" aria-label="Offensive coverage">
                <OffensiveCoverage coverage={offensiveCoverage} generation={generation} />
              </section>
            </>
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
      <PokemonDetailDrawer
        pokemon={detailPokemon}
        onClose={() => setDetailPokemon(null)}
        onAdd={addPokemonToTeam}
        canAdd={currentTeam.length < 6}
      />
      {undoAction && (
        <UndoToast
          key={`${undoAction.pokemon.id}-${undoAction.index}`}
          message={`Removed ${undoAction.pokemon.name}`}
          onUndo={handleUndo}
          onDismiss={dismissUndo}
        />
      )}
    </DndContext>
  );
};

export default TeamBuilder;
