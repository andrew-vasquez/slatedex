"use client";

import { useState, useCallback } from "react";
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
import PokemonSelection from "./PokemonSelection";
import TeamPanel from "./TeamPanel";
import { getTeamDefensiveCoverage } from "@/lib/teamAnalysis";
import type { Pokemon, Game } from "@/lib/types";

const DefensiveCoverage = dynamic(() => import("./DefensiveCoverage"));

const STORAGE_VERSION = 1;

function getStorageKey(gameId: number): string {
  return `team_game_${gameId}_v${STORAGE_VERSION}`;
}

interface TeamBuilderProps {
  selectedGame: Game;
  pokemonData: Pokemon[];
}

const TeamBuilder = ({ selectedGame, pokemonData }: TeamBuilderProps) => {
  const [team, setTeam] = useState<(Pokemon | null)[]>(() => {
    if (typeof window === "undefined") return Array(6).fill(null);
    try {
      const saved = localStorage.getItem(getStorageKey(selectedGame.id));
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore parse errors
    }
    return Array(6).fill(null);
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [draggedPokemon, setDraggedPokemon] = useState<Pokemon | null>(null);
  const [activeDropId, setActiveDropId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const persistTeam = useCallback(
    (newTeam: (Pokemon | null)[]) => {
      try {
        localStorage.setItem(getStorageKey(selectedGame.id), JSON.stringify(newTeam));
      } catch {
        // ignore storage errors
      }
    },
    [selectedGame.id]
  );

  const updateTeam = useCallback(
    (newTeam: (Pokemon | null)[]) => {
      setTeam(newTeam);
      persistTeam(newTeam);
    },
    [persistTeam]
  );

  const teamPokemonIds = new Set(team.filter((p): p is Pokemon => p !== null).map((p) => p.id));
  const lowerSearch = searchTerm.toLowerCase();

  const filteredPokemon = pokemonData.filter(
    (p) => !teamPokemonIds.has(p.id) && p.name.toLowerCase().includes(lowerSearch)
  );

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

  const clearTeam = useCallback(() => {
    if (team.every((slot) => slot === null)) return;
    if (!window.confirm("Clear all 6 slots? This will remove every Pokémon from your current team.")) return;

    const empty: (Pokemon | null)[] = Array(6).fill(null);
    updateTeam(empty);
  }, [team, updateTeam]);

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

  const currentTeam = team.filter((p): p is Pokemon => p !== null);
  const defensiveCoverage = getTeamDefensiveCoverage(currentTeam);

  const exposedTypes = Object.values(defensiveCoverage).filter(
    (entry) => entry.weakPokemon.length > entry.resistPokemon.length
  ).length;

  const stableTypes = Object.values(defensiveCoverage).filter(
    (entry) => entry.resistPokemon.length >= entry.weakPokemon.length
  ).length;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="min-h-screen" style={{ color: "var(--text-primary)" }}>
        <TeamBuilderHeader game={selectedGame} onShuffle={shuffleTeam} onClear={clearTeam} teamLength={currentTeam.length} />

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
            <PokemonSelection
              filteredPokemon={filteredPokemon}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onAddPokemon={addPokemonToTeam}
              currentTeamLength={currentTeam.length}
            />

            <TeamPanel
              team={team}
              currentTeamLength={currentTeam.length}
              activeDropId={activeDropId}
              onRemove={removeFromTeam}
            />
          </div>

          {currentTeam.length > 0 && (
            <section className="mt-4 sm:mt-5" aria-labelledby="coverage-heading">
              <DefensiveCoverage coverage={defensiveCoverage} />
            </section>
          )}
        </main>
      </div>

      <DragOverlay>{draggedPokemon && <PokemonDragPreview pokemon={draggedPokemon} />}</DragOverlay>
    </DndContext>
  );
};

export default TeamBuilder;
