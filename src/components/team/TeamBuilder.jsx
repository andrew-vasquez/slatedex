import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import PokemonCard from "../ui/PokemonCard";
import PokemonDragPreview from "../ui/PokemonDragPreview";
import TeamBuilderHeader from "./TeamBuilderHeader";
import PokemonSelection from "./PokemonSelection";
import TeamPanel from "./TeamPanel";
import DefensiveCoverage from "./DefensiveCoverage";
import {
  getPokemonByGeneration,
  getTeamDefensiveCoverage,
} from "../../data/pokemon";

const TeamBuilder = ({ selectedGame }) => {


  const [availablePokemon, setAvailablePokemon] = useState([]);
  const [team, setTeam] = useState(Array(6).fill(null));
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedPokemon, setDraggedPokemon] = useState(null);
  const [activeDropId, setActiveDropId] = useState(null);
  const [isTeamLoaded, setIsTeamLoaded] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const pokemon = getPokemonByGeneration(selectedGame.generation);
    setAvailablePokemon(pokemon);

    // Reset team state when switching games
    setTeam(Array(6).fill(null));
    setIsTeamLoaded(false);

    const savedTeam = localStorage.getItem(
      `team_game_${selectedGame.id}`
    );
    if (savedTeam) {
      try {
        const parsedTeam = JSON.parse(savedTeam);
        setTeam(parsedTeam);
      } catch (error) {
        console.error("Error loading saved team:", error);
      }
    }
    setIsTeamLoaded(true);
  }, [selectedGame.generation, selectedGame.id]);

  useEffect(() => {
    // Only save after the team has been loaded to prevent overwriting saved data
    if (!isTeamLoaded) return;
    
    const teamKey = `team_game_${selectedGame.id}`;
    
    try {
      localStorage.setItem(teamKey, JSON.stringify(team));
    } catch (error) {
      console.error('Error saving team to localStorage:', error);
    }
  }, [team, selectedGame.id, isTeamLoaded]);

  // Filter out Pokémon that are already in the team
  const teamPokemonIds = team.filter((p) => p !== null).map((p) => p.id);
  const filteredPokemon = availablePokemon
    .filter((p) => !teamPokemonIds.includes(p.id))
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDragStart = useCallback(
    (e) => setDraggedPokemon(e.active.data.current?.pokemon),
    []
  );
  const handleDragOver = useCallback(
    (e) => setActiveDropId(e.over?.id || null),
    []
  );

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      setDraggedPokemon(null);
      setActiveDropId(null);

      if (!over || !active.data.current?.pokemon) return;

      const slotIndex = parseInt(over.id.split("-")[2]);
      if (over.id.startsWith("team-slot-") && slotIndex >= 0 && slotIndex < 6) {
        const newTeam = [...team];
        newTeam[slotIndex] = active.data.current.pokemon;
        setTeam(newTeam);
      }
    },
    [team]
  );

  const removeFromTeam = useCallback(
    (index) => {
      const newTeam = [...team];
      newTeam[index] = null;
      setTeam(newTeam);
    },
    [team]
  );

  const clearTeam = useCallback(() => setTeam(Array(6).fill(null)), []);

  const shuffleTeam = useCallback(() => {
    const currentTeam = team.filter((p) => p !== null);
    for (let i = currentTeam.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentTeam[i], currentTeam[j]] = [currentTeam[j], currentTeam[i]];
    }
    setTeam([...currentTeam, ...Array(6 - currentTeam.length).fill(null)]);
  }, [team]);

  const addPokemonToTeam = useCallback(
    (pokemon) => {
      const firstEmptySlot = team.findIndex((slot) => slot === null);
      if (firstEmptySlot !== -1) {
        const newTeam = [...team];
        newTeam[firstEmptySlot] = pokemon;
        setTeam(newTeam);
      }
    },
    [team]
  );

  const currentTeam = team.filter((p) => p !== null);
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
