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
import PokemonCard from "@/components/ui/PokemonCard";
import PokemonDragPreview from "@/components/ui/PokemonDragPreview";
import TeamBuilderHeader from "./TeamBuilderHeader";
import PokemonSelection from "./PokemonSelection";
import TeamPanel from "./TeamPanel";
import { getTeamDefensiveCoverage } from "@/lib/teamAnalysis";
import type { Pokemon, Game } from "@/lib/types";

// Best practice §2.4: dynamic import — only rendered when team has members
const DefensiveCoverage = dynamic(() => import("./DefensiveCoverage"));

// Best practice §4.4: versioned localStorage schema
const STORAGE_VERSION = 1;

function getStorageKey(gameId: number): string {
  return `team_game_${gameId}_v${STORAGE_VERSION}`;
}

interface TeamBuilderProps {
  selectedGame: Game;
  pokemonData: Pokemon[];
}

const TeamBuilder = ({ selectedGame, pokemonData }: TeamBuilderProps) => {
  // Best practice §5.8: lazy state initialization for localStorage
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

  // Persist team to localStorage
  const persistTeam = useCallback(
    (newTeam: (Pokemon | null)[]) => {
      try {
        localStorage.setItem(getStorageKey(selectedGame.id), JSON.stringify(newTeam));
      } catch { /* ignore storage errors */ }
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

  // Best practice §7.6: combine iterations, §7.11: Set for O(1) lookups
  const teamPokemonIds = new Set(
    team.filter((p): p is Pokemon => p !== null).map((p) => p.id)
  );
  const lowerSearch = searchTerm.toLowerCase();
  const filteredPokemon = pokemonData.filter(
    (p) => !teamPokemonIds.has(p.id) && p.name.toLowerCase().includes(lowerSearch)
  );

  const handleDragStart = useCallback(
    (e: DragStartEvent) => setDraggedPokemon(e.active.data.current?.pokemon),
    []
  );
  const handleDragOver = useCallback(
    (e: DragOverEvent) => setActiveDropId(e.over?.id as string || null),
    []
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setDraggedPokemon(null);
      setActiveDropId(null);

      if (!over || !active.data.current?.pokemon) return;

      const slotIndex = parseInt((over.id as string).split("-")[2]);
      if (
        (over.id as string).startsWith("team-slot-") &&
        slotIndex >= 0 &&
        slotIndex < 6
      ) {
        // Best practice §5.7: functional setState
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

  // Best practice §5.7: functional setState updates
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
    const empty: (Pokemon | null)[] = Array(6).fill(null);
    updateTeam(empty);
  }, [updateTeam]);

  const shuffleTeam = useCallback(() => {
    setTeam((prev) => {
      const currentTeam = prev.filter((p): p is Pokemon => p !== null);
      for (let i = currentTeam.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentTeam[i], currentTeam[j]] = [currentTeam[j], currentTeam[i]];
      }
      const newTeam: (Pokemon | null)[] = [
        ...currentTeam,
        ...Array(6 - currentTeam.length).fill(null),
      ];
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

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-900 text-white font-sans">
        <TeamBuilderHeader
          onShuffle={shuffleTeam}
          onClear={clearTeam}
          teamLength={currentTeam.length}
        />

        <main className="max-w-screen-xl mx-auto p-4 sm:p-6" role="main">
          <h1 className="sr-only">
            Pokémon Team Builder for {selectedGame.name}
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
            <section
              className="mt-4 sm:mt-6"
              aria-labelledby="coverage-heading"
            >
              <DefensiveCoverage coverage={defensiveCoverage} />
            </section>
          )}
        </main>
      </div>
      <DragOverlay>
        {draggedPokemon && <PokemonDragPreview pokemon={draggedPokemon} />}
      </DragOverlay>
    </DndContext>
  );
};

export default TeamBuilder;
