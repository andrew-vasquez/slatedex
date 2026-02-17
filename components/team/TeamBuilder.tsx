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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FiCornerDownLeft, FiCornerDownRight, FiRepeat } from "react-icons/fi";
import PokemonDragPreview from "@/components/ui/PokemonDragPreview";
import TeamBuilderHeader from "./TeamBuilderHeader";
import ClearTeamDialog from "./ClearTeamDialog";
import PokemonSelection from "./PokemonSelection";
import TeamPanel from "./TeamPanel";
import SavedTeamsPanel from "./SavedTeamsPanel";
import ShareImportPanel from "./ShareImportPanel";
import UndoToast from "@/components/ui/UndoToast";
import PokemonDetailDrawer from "@/components/ui/PokemonDetailDrawer";
import { TYPE_EFFECTIVENESS, TYPE_RESISTANCES } from "@/lib/constants";
import { getTeamDefensiveCoverage, getTeamOffensiveCoverage } from "@/lib/teamAnalysis";
import { useTeamPersistence } from "@/hooks/useTeamPersistence";
import { useBuilderSettings } from "@/hooks/useBuilderSettings";
import {
  getLockedSlotsStorageKey,
  getSelectedGameStorageKey,
  getSelectedVersionStorageKey,
  getVersionFilterStorageKey,
} from "@/lib/storageKeys";
import {
  decodeSharedTeamPayload,
  type SharedTeamPayload,
} from "@/lib/teamShare";
import type { DexMode, Pokemon, PokemonPools, Game } from "@/lib/types";

const DefensiveCoverage = dynamic(() => import("./DefensiveCoverage"));
const OffensiveCoverage = dynamic(() => import("./OffensiveCoverage"));
const TeamRecommendations = dynamic(() => import("./TeamRecommendations"));

const HISTORY_LIMIT = 40;

type RecommendationRole = "all" | "bulky" | "fast" | "physical" | "special";

interface Recommendation {
  pokemon: Pokemon;
  score: number;
  covers: string[];
  risky: string[];
  reason: string;
}

interface PendingImportState {
  gameId: number;
  team: (Pokemon | null)[];
  lockedSlots: boolean[];
  selectedVersionId: string | null;
  dexMode: DexMode | null;
}

interface TeamBuilderProps {
  generation: number;
  games: Game[];
  allPools: Record<number, PokemonPools>;
}

function createEmptyTeam(): (Pokemon | null)[] {
  return Array(6).fill(null);
}

function createEmptyLockedSlots(): boolean[] {
  return Array(6).fill(false);
}

function teamsEqual(a: (Pokemon | null)[], b: (Pokemon | null)[]): boolean {
  return a.every((slot, index) => {
    const other = b[index];
    if (!slot && !other) return true;
    if (!slot || !other) return false;
    return slot.id === other.id;
  });
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

function getRoleLabel(role: RecommendationRole): string {
  if (role === "all") return "Balanced";
  if (role === "bulky") return "Bulky";
  if (role === "fast") return "Fast";
  if (role === "physical") return "Physical";
  return "Special";
}

const TeamBuilder = ({ generation, games, allPools }: TeamBuilderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const importedTokenRef = useRef<string | null>(null);

  const [selectedGameId, setSelectedGameId] = useState<number>(games[0].id);

  const [searchTerm, setSearchTerm] = useState("");
  const [draggedPokemon, setDraggedPokemon] = useState<Pokemon | null>(null);
  const [activeDropId, setActiveDropId] = useState<string | null>(null);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [recommendationsEnabled, setRecommendationsEnabled] = useState(true);
  const [recommendationRole, setRecommendationRole] = useState<RecommendationRole>("all");
  const [dexMode, setDexMode] = useState<DexMode>("national");
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [versionFilterEnabled, setVersionFilterEnabled] = useState(false);
  const [canUsePointerDrag, setCanUsePointerDrag] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [detailPokemon, setDetailPokemon] = useState<Pokemon | null>(null);
  const [lockedSlots, setLockedSlots] = useState<boolean[]>(createEmptyLockedSlots);
  const [replaceMode, setReplaceMode] = useState(false);
  const [replaceTargetSlot, setReplaceTargetSlot] = useState<number | null>(null);
  const [undoToastMessage, setUndoToastMessage] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImportState | null>(null);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  const pastTeamsRef = useRef<(Pokemon | null)[][]>([]);
  const futureTeamsRef = useRef<(Pokemon | null)[][]>([]);

  const { settings, updateSetting, resetSettings } = useBuilderSettings();

  const selectedGame = useMemo(() => games.find((g) => g.id === selectedGameId) ?? games[0], [games, selectedGameId]);
  const pokemonPools = useMemo(() => allPools[selectedGame.id] ?? allPools[games[0].id], [allPools, selectedGame.id, games]);

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

  const dragEnabled = useMemo(() => {
    if (settings.dragBehavior === "on") return true;
    if (settings.dragBehavior === "off") return false;
    return canUsePointerDrag;
  }, [canUsePointerDrag, settings.dragBehavior]);

  const syncHistoryState = useCallback(() => {
    setHistoryState({
      canUndo: pastTeamsRef.current.length > 0,
      canRedo: futureTeamsRef.current.length > 0,
    });
  }, []);

  const resetHistory = useCallback(() => {
    pastTeamsRef.current = [];
    futureTeamsRef.current = [];
    syncHistoryState();
  }, [syncHistoryState]);

  const pushHistory = useCallback(
    (snapshot: (Pokemon | null)[]) => {
      pastTeamsRef.current.push([...snapshot]);
      if (pastTeamsRef.current.length > HISTORY_LIMIT) {
        pastTeamsRef.current.shift();
      }
      futureTeamsRef.current = [];
      syncHistoryState();
    },
    [syncHistoryState]
  );

  const commitTeam = useCallback(
    (nextTeam: (Pokemon | null)[], options?: { message?: string }) => {
      if (teamsEqual(team, nextTeam)) return false;
      pushHistory(team);
      persistTeam(nextTeam);
      if (options?.message) setUndoToastMessage(options.message);
      return true;
    },
    [persistTeam, pushHistory, team]
  );

  const handleUndo = useCallback(() => {
    const previous = pastTeamsRef.current.pop();
    if (!previous) return;

    futureTeamsRef.current.push([...team]);
    persistTeam(previous);
    setUndoToastMessage(null);
    syncHistoryState();
  }, [persistTeam, syncHistoryState, team]);

  const handleRedo = useCallback(() => {
    const next = futureTeamsRef.current.pop();
    if (!next) return;

    pastTeamsRef.current.push([...team]);
    persistTeam(next);
    setUndoToastMessage("Redo applied");
    syncHistoryState();
  }, [persistTeam, syncHistoryState, team]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(getSelectedGameStorageKey(generation));
      if (saved) {
        const savedId = parseInt(saved, 10);
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

  useEffect(() => {
    try {
      localStorage.setItem(getSelectedGameStorageKey(generation), String(selectedGameId));
    } catch {
      // ignore
    }
  }, [generation, selectedGameId]);

  useEffect(() => {
    const canUseFinePointer =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches && navigator.maxTouchPoints === 0;
    setCanUsePointerDrag(canUseFinePointer);
  }, []);

  useEffect(() => {
    const preferred = settings.defaultDexMode;
    if (preferred === "regional" && !pokemonPools.regionalResolved) {
      setDexMode("national");
      return;
    }
    setDexMode(preferred);
  }, [pokemonPools.regionalResolved, selectedGame.id, settings.defaultDexMode]);

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
      if (saved === null) {
        setVersionFilterEnabled(settings.defaultVersionFilter);
      } else {
        setVersionFilterEnabled(saved === "true");
      }
    } catch {
      setVersionFilterEnabled(settings.defaultVersionFilter);
    }
  }, [selectedGame.id, settings.defaultVersionFilter]);

  useEffect(() => {
    const storageKey = getLockedSlotsStorageKey(generation, selectedGame.id);

    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        setLockedSlots(createEmptyLockedSlots());
        return;
      }

      const parsed = JSON.parse(saved) as boolean[];
      if (Array.isArray(parsed) && parsed.length === 6) {
        setLockedSlots(parsed.map((value) => !!value));
      } else {
        setLockedSlots(createEmptyLockedSlots());
      }
    } catch {
      setLockedSlots(createEmptyLockedSlots());
    }
  }, [generation, selectedGame.id]);

  useEffect(() => {
    try {
      localStorage.setItem(getLockedSlotsStorageKey(generation, selectedGame.id), JSON.stringify(lockedSlots));
    } catch {
      // ignore
    }
  }, [generation, lockedSlots, selectedGame.id]);

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

  useEffect(() => {
    resetHistory();
    setUndoToastMessage(null);
    setReplaceMode(false);
    setReplaceTargetSlot(null);
  }, [resetHistory, selectedGame.id]);

  useEffect(() => {
    if (!replaceMode) {
      setReplaceTargetSlot(null);
      return;
    }

    if (replaceTargetSlot === null) return;
    if (lockedSlots[replaceTargetSlot] || !team[replaceTargetSlot]) {
      setReplaceTargetSlot(null);
    }
  }, [lockedSlots, replaceMode, replaceTargetSlot, team]);

  const handleGameChange = useCallback((gameId: number) => {
    setSelectedGameId(gameId);
    setSearchTerm("");
    setTypeFilter(null);
  }, []);

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

  const handleDragStart = useCallback((event: DragStartEvent) => setDraggedPokemon(event.active.data.current?.pokemon), []);
  const handleDragOver = useCallback((event: DragOverEvent) => setActiveDropId((event.over?.id as string) || null), []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setDraggedPokemon(null);
      setActiveDropId(null);

      if (!over || !active.data.current?.pokemon) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      if (!overId.startsWith("team-slot-")) return;
      const targetSlot = parseInt(overId.split("-")[2], 10);
      if (targetSlot < 0 || targetSlot >= 6 || lockedSlots[targetSlot]) return;

      const isFromTeam = activeId.startsWith("team-") && !activeId.startsWith("team-slot-");

      if (isFromTeam) {
        const sourceSlot = parseInt(activeId.split("-")[1], 10);
        if (sourceSlot === targetSlot || lockedSlots[sourceSlot]) return;

        const newTeam = [...team];
        [newTeam[sourceSlot], newTeam[targetSlot]] = [newTeam[targetSlot], newTeam[sourceSlot]];
        commitTeam(newTeam, { message: "Swapped team slots" });
      } else {
        const newTeam = [...team];
        newTeam[targetSlot] = active.data.current.pokemon;
        if (commitTeam(newTeam, { message: `Added ${active.data.current.pokemon.name}` })) {
          setReplaceTargetSlot(null);
        }
      }
    },
    [commitTeam, lockedSlots, team]
  );

  const removeFromTeam = useCallback(
    (index: number) => {
      if (lockedSlots[index]) return;

      const removed = team[index];
      if (!removed) return;

      const newTeam = [...team];
      newTeam[index] = null;
      if (commitTeam(newTeam, { message: `Removed ${removed.name}` }) && replaceTargetSlot === index) {
        setReplaceTargetSlot(null);
      }
    },
    [commitTeam, lockedSlots, replaceTargetSlot, team]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        handleRedo();
        return;
      }

      if (event.key === "Escape") {
        const searchInput = document.getElementById("pokemon-search") as HTMLInputElement | null;
        if (searchInput && document.activeElement === searchInput) {
          if (searchTerm) {
            setSearchTerm("");
          } else {
            searchInput.blur();
          }
          event.preventDefault();
          return;
        }

        if (replaceTargetSlot !== null) {
          setReplaceTargetSlot(null);
          event.preventDefault();
          return;
        }

        if (typeFilter) {
          setTypeFilter(null);
          event.preventDefault();
        }
        return;
      }

      if (event.key === "/" && !isInput) {
        event.preventDefault();
        const searchInput = document.getElementById("pokemon-search") as HTMLInputElement | null;
        searchInput?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRedo, handleUndo, replaceTargetSlot, searchTerm, typeFilter]);

  const clearableCount = useMemo(
    () => team.filter((slot, index) => slot !== null && !lockedSlots[index]).length,
    [lockedSlots, team]
  );

  const openClearDialog = useCallback(() => {
    if (clearableCount === 0) return;
    setIsClearDialogOpen(true);
  }, [clearableCount]);

  const closeClearDialog = useCallback(() => {
    setIsClearDialogOpen(false);
  }, []);

  const confirmClearTeam = useCallback(() => {
    const newTeam = team.map((slot, index) => (lockedSlots[index] ? slot : null));
    commitTeam(newTeam, { message: "Cleared unlocked slots" });
    setIsClearDialogOpen(false);
    setReplaceTargetSlot(null);
  }, [commitTeam, lockedSlots, team]);

  const shuffleTeam = useCallback(() => {
    const movableIndexes = team
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot, index }) => slot !== null && !lockedSlots[index])
      .map(({ index }) => index);

    if (movableIndexes.length <= 1) return;

    const shuffled = movableIndexes.map((index) => team[index] as Pokemon);
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const newTeam = [...team];
    movableIndexes.forEach((slotIndex, idx) => {
      newTeam[slotIndex] = shuffled[idx];
    });

    commitTeam(newTeam, { message: "Shuffled unlocked slots" });
  }, [commitTeam, lockedSlots, team]);

  const addPokemonToTeam = useCallback(
    (pokemon: Pokemon) => {
      if (replaceMode && replaceTargetSlot !== null && !lockedSlots[replaceTargetSlot]) {
        const newTeam = [...team];
        newTeam[replaceTargetSlot] = pokemon;
        if (commitTeam(newTeam, { message: `Replaced slot ${replaceTargetSlot + 1} with ${pokemon.name}` })) {
          setReplaceTargetSlot(null);
        }
        return;
      }

      const firstEmptyUnlockedSlot = team.findIndex((slot, index) => slot === null && !lockedSlots[index]);
      if (firstEmptyUnlockedSlot === -1) return;

      const newTeam = [...team];
      newTeam[firstEmptyUnlockedSlot] = pokemon;
      commitTeam(newTeam, { message: `Added ${pokemon.name}` });
    },
    [commitTeam, lockedSlots, replaceMode, replaceTargetSlot, team]
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

  const deficitByType = useMemo(
    () =>
      Object.entries(defensiveCoverage)
        .filter(([, entry]) => !entry.locked)
        .map(([type, entry]) => ({ type, deficit: Math.max(0, entry.weakPokemon.length - entry.resistPokemon.length) }))
        .filter((entry) => entry.deficit > 0),
    [defensiveCoverage]
  );

  const exposedTypes = exposedTypeNames.length;

  const stableTypes = Object.values(defensiveCoverage).filter(
    (entry) => !entry.locked && entry.resistPokemon.length >= entry.weakPokemon.length
  ).length;

  const recommendations = useMemo<Recommendation[]>(() => {
    if (!recommendationsEnabled || currentTeam.length === 0 || availablePokemon.length === 0) return [];

    const candidatePool = availablePokemon.filter((pokemon) => pokemon.isFinalEvolution);
    if (candidatePool.length === 0 || deficitByType.length === 0) return [];

    const roleFilteredPool = candidatePool.filter((pokemon) => {
      if (recommendationRole === "all") return true;
      if (recommendationRole === "bulky") return pokemon.hp + pokemon.defense + pokemon.specialDefense >= 280;
      if (recommendationRole === "fast") return pokemon.speed >= 95;
      if (recommendationRole === "physical") return pokemon.attack >= 95;
      return pokemon.specialAttack >= 95;
    });

    if (roleFilteredPool.length === 0) return [];

    const ranked = roleFilteredPool.map((pokemon) => {
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

      const bulkBonus = (pokemon.hp + pokemon.defense + pokemon.specialDefense) / 220;
      score += bulkBonus;

      if (recommendationRole === "bulky") score += (pokemon.hp + pokemon.defense + pokemon.specialDefense) / 120;
      if (recommendationRole === "fast") score += pokemon.speed / 35;
      if (recommendationRole === "physical") score += pokemon.attack / 40;
      if (recommendationRole === "special") score += pokemon.specialAttack / 40;

      const reasonParts: string[] = [];
      if (covers.length > 0) {
        reasonParts.push(`Patches ${covers.slice(0, 2).join(" / ")}`);
      }

      if (recommendationRole === "all") {
        const allStats = [
          { label: "speed", value: pokemon.speed },
          { label: "bulk", value: pokemon.hp + pokemon.defense + pokemon.specialDefense },
          { label: "attack", value: pokemon.attack },
          { label: "special", value: pokemon.specialAttack },
        ].sort((a, b) => b.value - a.value);
        reasonParts.push(`Strong ${allStats[0].label} profile`);
      } else {
        reasonParts.push(`${getRoleLabel(recommendationRole)} role match`);
      }

      if (risky.length > 0) {
        reasonParts.push(`Watch ${risky[0]} pressure`);
      }

      return {
        pokemon,
        score,
        covers,
        risky,
        reason: reasonParts.join(" • "),
      };
    });

    return ranked.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [availablePokemon, currentTeam.length, deficitByType, recommendationRole, recommendationsEnabled]);

  const canReplaceWeakest = useMemo(
    () => team.some((slot, index) => slot !== null && !lockedSlots[index]),
    [lockedSlots, team]
  );

  const handleReplaceWeakest = useCallback(
    (pokemon: Pokemon) => {
      const replaceable = team
        .map((slot, index) => ({ slot, index }))
        .filter(({ slot, index }) => slot !== null && !lockedSlots[index]) as Array<{ slot: Pokemon; index: number }>;

      if (replaceable.length === 0) return;

      let weakest = replaceable[0];
      let weakestScore = Number.NEGATIVE_INFINITY;

      replaceable.forEach((entry) => {
        const vulnerabilityScore = deficitByType.reduce((sum, deficit) => {
          const effectiveness = getPokemonEffectivenessAgainstType(entry.slot, deficit.type);
          if (effectiveness > 1) return sum + effectiveness * deficit.deficit;
          if (effectiveness < 1) return sum - (1 / effectiveness) * deficit.deficit * 0.35;
          return sum;
        }, 0);

        if (vulnerabilityScore > weakestScore) {
          weakest = entry;
          weakestScore = vulnerabilityScore;
        }
      });

      const newTeam = [...team];
      newTeam[weakest.index] = pokemon;
      if (commitTeam(newTeam, { message: `Replaced ${weakest.slot.name} with ${pokemon.name}` })) {
        setReplaceTargetSlot(null);
      }
    },
    [commitTeam, deficitByType, lockedSlots, team]
  );

  const toggleLockSlot = useCallback((index: number) => {
    setLockedSlots((prev) => prev.map((value, slotIndex) => (slotIndex === index ? !value : value)));
    if (replaceTargetSlot === index) {
      setReplaceTargetSlot(null);
    }
  }, [replaceTargetSlot]);

  const handleLoadSavedTeam = useCallback(
    (teamId: string) => {
      const selected = savedTeams.find((savedTeam) => savedTeam.id === teamId);
      if (selected && !teamsEqual(team, selected.pokemon)) {
        pushHistory(team);
        setUndoToastMessage(`Loaded ${selected.name}`);
      }

      loadSavedTeam(teamId);
    },
    [loadSavedTeam, pushHistory, savedTeams, team]
  );

  const pokemonLookupByGame = useMemo(() => {
    const lookup: Record<number, Map<number, Pokemon>> = {};

    for (const [gameId, pools] of Object.entries(allPools)) {
      const gameLookup = new Map<number, Pokemon>();
      pools.national.forEach((pokemon) => {
        gameLookup.set(pokemon.id, pokemon);
      });
      lookup[Number(gameId)] = gameLookup;
    }

    return lookup;
  }, [allPools]);

  const queueImportPayload = useCallback(
    (payload: SharedTeamPayload): string => {
      if (payload.generation !== generation) {
        return `Invalid payload: this builder is Gen ${generation}.`;
      }

      const targetGame = games.find((game) => game.id === payload.gameId);
      if (!targetGame) {
        return "Invalid payload: game is not available in this generation.";
      }

      const lookup = pokemonLookupByGame[targetGame.id];
      if (!lookup) {
        return "Invalid payload: Pokédex data is unavailable for that game.";
      }

      const importedTeam = Array.from({ length: 6 }, (_, index) => {
        const pokemonId = payload.team[index] ?? null;
        if (pokemonId === null) return null;
        return lookup.get(pokemonId) ?? null;
      });

      const importedLocks = Array.from({ length: 6 }, (_, index) => payload.lockedSlots?.includes(index) ?? false);

      setPendingImport({
        gameId: targetGame.id,
        team: importedTeam,
        lockedSlots: importedLocks,
        selectedVersionId: payload.selectedVersionId ?? null,
        dexMode: payload.dexMode ?? null,
      });

      if (targetGame.id !== selectedGame.id) {
        setSelectedGameId(targetGame.id);
      }

      return "Imported payload. Applied to current team.";
    },
    [games, generation, pokemonLookupByGame, selectedGame.id]
  );

  useEffect(() => {
    if (!pendingImport || pendingImport.gameId !== selectedGame.id) return;

    const allowedVersionIds = new Set(selectedGame.versions.map((version) => version.id));

    if (pendingImport.selectedVersionId && allowedVersionIds.has(pendingImport.selectedVersionId)) {
      setSelectedVersionId(pendingImport.selectedVersionId);
    }

    if (pendingImport.dexMode) {
      handleDexModeChange(pendingImport.dexMode);
    }

    setLockedSlots(pendingImport.lockedSlots);
    commitTeam(pendingImport.team, { message: "Imported shared team" });
    setPendingImport(null);
    setReplaceMode(false);
    setReplaceTargetSlot(null);
  }, [commitTeam, handleDexModeChange, pendingImport, selectedGame.id, selectedGame.versions]);

  useEffect(() => {
    const token = searchParams.get("team");
    if (!token || token === importedTokenRef.current) return;

    importedTokenRef.current = token;
    const parsed = decodeSharedTeamPayload(token);

    if (parsed) {
      queueImportPayload(parsed);
    }

    router.replace(pathname, { scroll: false });
  }, [pathname, queueImportPayload, router, searchParams]);

  const sharePayload = useMemo<SharedTeamPayload>(
    () => ({
      v: 1,
      generation,
      gameId: selectedGame.id,
      team: team.map((pokemon) => pokemon?.id ?? null),
      lockedSlots: lockedSlots.map((locked, index) => (locked ? index : -1)).filter((index) => index >= 0),
      selectedVersionId,
      dexMode,
    }),
    [dexMode, generation, lockedSlots, selectedGame.id, selectedVersionId, team]
  );

  return (
    <DndContext
      id={`team-builder-dnd-${selectedGame.id}`}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen" style={{ color: "var(--text-primary)" }}>
        <TeamBuilderHeader
          game={selectedGame}
          generation={generation}
          onShuffle={shuffleTeam}
          onClear={openClearDialog}
          teamLength={currentTeam.length}
          settings={settings}
          onSettingsDexModeChange={(value) => updateSetting("defaultDexMode", value)}
          onSettingsVersionFilterDefaultChange={(value) => updateSetting("defaultVersionFilter", value)}
          onSettingsCardDensityChange={(value) => updateSetting("cardDensity", value)}
          onSettingsReduceMotionChange={(value) => updateSetting("reduceMotion", value)}
          onSettingsDragBehaviorChange={(value) => updateSetting("dragBehavior", value)}
          onSettingsReset={resetSettings}
        />

        <main id="main-content" className="mx-auto max-w-screen-xl px-4 pb-8 pt-4 sm:px-6 sm:pb-10" role="main">
          <section className="panel mb-4 p-4 sm:mb-5 sm:p-5" aria-label="Team planning status">
            <div className="flex items-center justify-between gap-3">
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

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!historyState.canUndo}
                className="btn-secondary disabled:pointer-events-none disabled:opacity-50"
              >
                <FiCornerDownLeft size={13} />
                Undo
              </button>

              <button
                type="button"
                onClick={handleRedo}
                disabled={!historyState.canRedo}
                className="btn-secondary disabled:pointer-events-none disabled:opacity-50"
              >
                <FiCornerDownRight size={13} />
                Redo
              </button>

              <button
                type="button"
                onClick={() => {
                  setReplaceMode((prev) => !prev);
                  setReplaceTargetSlot(null);
                }}
                className="btn-secondary"
                style={{
                  borderColor: replaceMode ? "rgba(59, 130, 246, 0.34)" : undefined,
                  background: replaceMode ? "rgba(59, 130, 246, 0.14)" : undefined,
                  color: replaceMode ? "#93c5fd" : undefined,
                }}
              >
                <FiRepeat size={13} />
                {replaceMode ? "Replace Mode On" : "Replace Mode Off"}
              </button>

              <div className="rounded-xl border px-3 py-2 text-[0.66rem]" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-muted)" }}>
                {replaceMode
                  ? replaceTargetSlot !== null
                    ? `Targeting slot ${replaceTargetSlot + 1}`
                    : "Pick a team slot to replace"
                  : "Fill empty unlocked slots first"}
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
                cardDensity={settings.cardDensity}
              />
            </div>

            <div className="flex flex-col gap-4">
              <TeamPanel
                team={team}
                currentTeamLength={currentTeam.length}
                activeDropId={activeDropId}
                onRemove={removeFromTeam}
                dragEnabled={dragEnabled}
                lockedSlots={lockedSlots}
                onToggleLock={toggleLockSlot}
                replaceMode={replaceMode}
                selectedReplaceSlot={replaceTargetSlot}
                onSelectReplaceSlot={setReplaceTargetSlot}
              />

              {isAuthenticated && (
                <SavedTeamsPanel
                  savedTeams={savedTeams}
                  activeTeamId={activeTeamId}
                  onSaveAs={saveTeamAs}
                  onLoad={handleLoadSavedTeam}
                  onDelete={deleteSavedTeam}
                  onRename={renameSavedTeam}
                  onRefresh={refreshSavedTeams}
                  isSaving={isSaving}
                />
              )}

              <ShareImportPanel payload={sharePayload} onImport={queueImportPayload} />
            </div>
          </div>

          {currentTeam.length === 0 ? (
            <section className="panel mt-4 p-6 text-center sm:mt-5 sm:p-8" aria-label="Getting started">
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
                  role={recommendationRole}
                  onRoleChange={setRecommendationRole}
                  onReplaceWeakest={handleReplaceWeakest}
                  canReplaceWeakest={canReplaceWeakest}
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
        teamCount={clearableCount}
        onCancel={closeClearDialog}
        onConfirm={confirmClearTeam}
      />

      <PokemonDetailDrawer
        pokemon={detailPokemon}
        onClose={() => setDetailPokemon(null)}
        onAdd={addPokemonToTeam}
        canAdd={currentTeam.length < 6}
      />

      {undoToastMessage && historyState.canUndo && (
        <UndoToast
          key={undoToastMessage}
          message={undoToastMessage}
          onUndo={handleUndo}
          onDismiss={() => setUndoToastMessage(null)}
        />
      )}
    </DndContext>
  );
};

export default TeamBuilder;
