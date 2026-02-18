"use client";

import { Suspense, useState, useCallback, useMemo, useEffect, useDeferredValue, useRef } from "react";
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
import { usePathname, useRouter } from "next/navigation";
import { FiCornerDownLeft, FiCornerDownRight, FiRepeat } from "react-icons/fi";
import PokemonDragPreview from "@/components/ui/PokemonDragPreview";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import TeamBuilderHeader from "./TeamBuilderHeader";
import ClearTeamDialog from "./ClearTeamDialog";
import PokemonSelection from "./PokemonSelection";
import TeamPanel from "./TeamPanel";
import SavedTeamsPanel from "./SavedTeamsPanel";
import ShareImportPanel from "./ShareImportPanel";
import UndoToast from "@/components/ui/UndoToast";
import PokemonDetailDrawer from "@/components/ui/PokemonDetailDrawer";
import { useAnimatedUnmount } from "@/hooks/useAnimatedUnmount";
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

const DefensiveCoverage = dynamic(() => import("./DefensiveCoverage"), { loading: () => null });
const OffensiveCoverage = dynamic(() => import("./OffensiveCoverage"), { loading: () => null });
const TeamRecommendations = dynamic(() => import("./TeamRecommendations"), { loading: () => null });

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
  initialPoolsByGame: Record<number, PokemonPools>;
}

const EMPTY_POOLS: PokemonPools = {
  national: [],
  regional: [],
  regionalResolved: false,
  regionalDexName: null,
};

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

const TeamBuilder = ({ generation, games, initialPoolsByGame }: TeamBuilderProps) => {
  const router = useRouter();
  const pathname = usePathname();
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
  const [isDesktopScreen, setIsDesktopScreen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [detailPokemon, setDetailPokemon] = useState<Pokemon | null>(null);
  const [lockedSlots, setLockedSlots] = useState<boolean[]>(createEmptyLockedSlots);
  const [replaceMode, setReplaceMode] = useState(false);
  const [replaceTargetSlot, setReplaceTargetSlot] = useState<number | null>(null);
  const [undoToastMessage, setUndoToastMessage] = useState<string | null>(null);
  const dismissUndoToast = useCallback(() => setUndoToastMessage(null), []);
  const [pendingImport, setPendingImport] = useState<PendingImportState | null>(null);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [poolsByGame, setPoolsByGame] = useState<Record<number, PokemonPools>>(initialPoolsByGame);
  const [poolLoadErrorByGame, setPoolLoadErrorByGame] = useState<Record<number, string>>({});

  const pastTeamsRef = useRef<(Pokemon | null)[][]>([]);
  const futureTeamsRef = useRef<(Pokemon | null)[][]>([]);
  const poolsByGameRef = useRef<Record<number, PokemonPools>>(initialPoolsByGame);
  const poolRequestsRef = useRef<Map<number, Promise<PokemonPools | null>>>(new Map());

  const { settings, updateSetting, resetSettings } = useBuilderSettings();

  const selectedGame = useMemo(() => games.find((g) => g.id === selectedGameId) ?? games[0], [games, selectedGameId]);
  const isSelectedGamePoolReady = Boolean(poolsByGame[selectedGame.id]);
  const selectedGamePoolError = poolLoadErrorByGame[selectedGame.id] ?? null;
  const pokemonPools = useMemo(() => poolsByGame[selectedGame.id] ?? EMPTY_POOLS, [poolsByGame, selectedGame.id]);

  useEffect(() => {
    poolsByGameRef.current = poolsByGame;
  }, [poolsByGame]);

  const ensureGamePool = useCallback(
    async (gameId: number): Promise<PokemonPools | null> => {
      const existing = poolsByGameRef.current[gameId];
      if (existing) return existing;

      const inFlight = poolRequestsRef.current.get(gameId);
      if (inFlight) return inFlight;

      const request = (async () => {
        try {
          const response = await fetch(`/api/pokemon-pools?generation=${generation}&gameId=${gameId}`, {
            method: "GET",
            cache: "force-cache",
          });
          if (!response.ok) {
            throw new Error(`Failed to load Pokemon pools for game ${gameId}`);
          }

          const payload = (await response.json()) as { pools?: PokemonPools };
          const nextPools = payload.pools;
          if (!nextPools) throw new Error("Pokemon pool payload is missing");

          setPoolsByGame((prev) => (prev[gameId] ? prev : { ...prev, [gameId]: nextPools }));
          setPoolLoadErrorByGame((prev) => {
            if (!(gameId in prev)) return prev;
            const next = { ...prev };
            delete next[gameId];
            return next;
          });

          return nextPools;
        } catch {
          setPoolLoadErrorByGame((prev) => ({ ...prev, [gameId]: "Could not load Pokédex data for this game." }));
          return null;
        } finally {
          poolRequestsRef.current.delete(gameId);
        }
      })();

      poolRequestsRef.current.set(gameId, request);
      return request;
    },
    [generation]
  );

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
    if (!isDesktopScreen) return false;
    if (settings.dragBehavior === "on") return true;
    if (settings.dragBehavior === "off") return false;
    return canUsePointerDrag;
  }, [canUsePointerDrag, isDesktopScreen, settings.dragBehavior]);

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
    void ensureGamePool(selectedGameId);
  }, [ensureGamePool, selectedGameId]);

  useEffect(() => {
    if (!isSelectedGamePoolReady) return;

    const pendingGameIds = games
      .map((game) => game.id)
      .filter((gameId) => gameId !== selectedGameId && !poolsByGameRef.current[gameId]);

    if (pendingGameIds.length === 0) return;

    let cancelled = false;
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const startPrefetch = () => {
      if (cancelled) return;
      for (const gameId of pendingGameIds) {
        if (cancelled) break;
        void ensureGamePool(gameId);
      }
    };

    const windowWithIdle = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof windowWithIdle.requestIdleCallback === "function") {
      idleId = windowWithIdle.requestIdleCallback(startPrefetch, { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(startPrefetch, 900);
    }

    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (idleId !== null && typeof windowWithIdle.cancelIdleCallback === "function") {
        windowWithIdle.cancelIdleCallback(idleId);
      }
    };
  }, [ensureGamePool, games, isSelectedGamePoolReady, selectedGameId]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateCapabilities = () => {
      const canUseFinePointer = pointerQuery.matches && navigator.maxTouchPoints === 0;
      setCanUsePointerDrag(canUseFinePointer);
      setIsDesktopScreen(desktopQuery.matches);
    };

    updateCapabilities();
    desktopQuery.addEventListener("change", updateCapabilities);
    pointerQuery.addEventListener("change", updateCapabilities);

    return () => {
      desktopQuery.removeEventListener("change", updateCapabilities);
      pointerQuery.removeEventListener("change", updateCapabilities);
    };
  }, []);

  useEffect(() => {
    if (!isSelectedGamePoolReady) return;
    const preferred = settings.defaultDexMode;
    if (preferred === "regional" && !pokemonPools.regionalResolved) {
      setDexMode("national");
      return;
    }
    setDexMode(preferred);
  }, [isSelectedGamePoolReady, pokemonPools.regionalResolved, selectedGame.id, settings.defaultDexMode]);

  useEffect(() => {
    if (dragEnabled) return;
    setDraggedPokemon(null);
    setActiveDropId(null);
  }, [dragEnabled]);

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
    void ensureGamePool(gameId);
  }, [ensureGamePool]);

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const lowerSearch = deferredSearchTerm.toLowerCase();

  const teamPokemonIds = useMemo(
    () => new Set(team.filter((p): p is Pokemon => p !== null).map((p) => p.id)),
    [team]
  );

  const handleDexModeChange = useCallback(
    (nextMode: DexMode) => {
      if (!isSelectedGamePoolReady) {
        setDexMode("national");
        return;
      }

      if (nextMode === "regional" && !pokemonPools.regionalResolved) {
        setDexMode("national");
        return;
      }

      setDexMode(nextMode);
    },
    [isSelectedGamePoolReady, pokemonPools.regionalResolved]
  );

  const activePokemonPool = useMemo(
    () => {
      if (!isSelectedGamePoolReady) return [];
      return dexMode === "regional" && pokemonPools.regionalResolved ? pokemonPools.regional : pokemonPools.national;
    },
    [dexMode, isSelectedGamePoolReady, pokemonPools.national, pokemonPools.regional, pokemonPools.regionalResolved]
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
  const hasTeam = currentTeam.length > 0;
  const {
    shouldRender: shouldRenderEmpty,
    isAnimatingOut: isEmptyExiting,
  } = useAnimatedUnmount(!hasTeam, 200);
  const {
    shouldRender: shouldRenderAnalysis,
    isAnimatingOut: isAnalysisExiting,
  } = useAnimatedUnmount(hasTeam, 200);

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

  const buildPendingImportState = useCallback(
    (payload: SharedTeamPayload, gameId: number): PendingImportState | null => {
      const pools = poolsByGameRef.current[gameId];
      if (!pools) return null;

      const lookup = new Map<number, Pokemon>();
      pools.national.forEach((pokemon) => {
        lookup.set(pokemon.id, pokemon);
      });

      const importedTeam = Array.from({ length: 6 }, (_, index) => {
        const pokemonId = payload.team[index] ?? null;
        if (pokemonId === null) return null;
        return lookup.get(pokemonId) ?? null;
      });

      return {
        gameId,
        team: importedTeam,
        lockedSlots: Array.from({ length: 6 }, (_, index) => payload.lockedSlots?.includes(index) ?? false),
        selectedVersionId: payload.selectedVersionId ?? null,
        dexMode: payload.dexMode ?? null,
      };
    },
    []
  );

  const queueImportPayload = useCallback(
    (payload: SharedTeamPayload): string => {
      if (payload.generation !== generation) {
        return `Invalid payload: this builder is Gen ${generation}.`;
      }

      const targetGame = games.find((game) => game.id === payload.gameId);
      if (!targetGame) {
        return "Invalid payload: game is not available in this generation.";
      }

      const immediateImport = buildPendingImportState(payload, targetGame.id);
      if (immediateImport) {
        setPendingImport(immediateImport);
        if (targetGame.id !== selectedGame.id) {
          setSelectedGameId(targetGame.id);
        }
        return "Imported payload. Applied to current team.";
      }

      void ensureGamePool(targetGame.id).then((loaded) => {
        if (!loaded) return;
        const resolvedImport = buildPendingImportState(payload, targetGame.id);
        if (!resolvedImport) return;
        setPendingImport(resolvedImport);
        setSelectedGameId(targetGame.id);
      });

      return "Loading game data for import. It will apply automatically.";
    },
    [buildPendingImportState, ensureGamePool, games, generation, selectedGame.id]
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
    const params = new URLSearchParams(window.location.search);
    const token = params.get("team");
    if (!token || token === importedTokenRef.current) return;

    importedTokenRef.current = token;
    const parsed = decodeSharedTeamPayload(token);

    if (parsed) {
      queueImportPayload(parsed);
    }

    router.replace(pathname, { scroll: false });
  }, [pathname, queueImportPayload, router]);

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

        <main id="main-content" className="mx-auto max-w-screen-xl px-4 pb-8 pt-4 sm:px-6 sm:pb-10 lg:pt-28" role="main">
          <section className="panel mb-4 p-4 sm:mb-5 sm:p-5" aria-label="Team planning status">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg sm:text-xl" style={{ color: "var(--text-primary)" }}>
                  Build Flow
                </h2>
                <p className="mt-0.5 text-[0.7rem] sm:text-[0.74rem]" style={{ color: "var(--text-muted)" }}>
                  Follow the steps left to right: pick Pokémon, fill team slots, then refine with analysis.
                </p>
              </div>
              {isSaving && (
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                  Saving...
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              <div className="panel-soft px-3 py-1.5">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                  1. Search & Pick
                </p>
              </div>
              <div className="panel-soft px-3 py-1.5">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                  2. Fill Team Slots
                </p>
              </div>
              <div className="panel-soft px-3 py-1.5">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                  3. Analyze Coverage
                </p>
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="panel-soft px-3.5 py-3">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                  Team Slots Filled
                </p>
                <AnimatedNumber
                  value={`${currentTeam.length}/6`}
                  className="font-display mt-1 text-2xl"
                  style={{ color: "var(--accent)" }}
                />
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--stat-track)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(currentTeam.length / 6) * 100}%`,
                      background: "linear-gradient(90deg, var(--accent) 0%, #ef6f40 100%)",
                      transition: "width 0.25s ease",
                    }}
                  />
                </div>
              </div>
              <div className="panel-soft px-3.5 py-3">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                  Coverage Snapshot
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
                    <p className="text-[0.56rem] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                      Risks
                    </p>
                    <AnimatedNumber
                      value={exposedTypes}
                      className="font-display mt-0.5 text-xl"
                      style={{ color: exposedTypes > 0 ? "#b91c1c" : "#136f3a", transition: "color 0.3s ease" }}
                    />
                  </div>
                  <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
                    <p className="text-[0.56rem] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                      Stable
                    </p>
                    <AnimatedNumber
                      value={stableTypes}
                      className="font-display mt-0.5 text-xl"
                      style={{ color: "var(--accent-blue)" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!historyState.canUndo}
                className="btn-secondary action-btn w-full disabled:pointer-events-none disabled:opacity-50"
              >
                <FiCornerDownLeft size={13} />
                Undo
              </button>

              <button
                type="button"
                onClick={handleRedo}
                disabled={!historyState.canRedo}
                className="btn-secondary action-btn w-full disabled:pointer-events-none disabled:opacity-50"
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
                className="btn-secondary action-btn col-span-2 w-full lg:col-span-1"
                style={{
                  borderColor: replaceMode ? "rgba(59, 130, 246, 0.34)" : undefined,
                  background: replaceMode ? "rgba(59, 130, 246, 0.14)" : undefined,
                  color: replaceMode ? "#93c5fd" : undefined,
                }}
              >
                <FiRepeat size={13} />
                {replaceMode ? "Replace Mode On" : "Replace Mode Off"}
              </button>

              <div className="col-span-2 rounded-xl border px-3 py-2 text-[0.66rem] lg:col-span-1" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-muted)" }}>
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
                dexNotice={
                  selectedGamePoolError
                  ?? (!isSelectedGamePoolReady
                    ? "Loading Pokédex data for selected game..."
                    : pokemonPools.regionalResolved
                      ? null
                      : "Regional dex unavailable; switched to National.")
                }
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
                isLoadingData={!isSelectedGamePoolReady && !selectedGamePoolError}
              />
            </div>

            <div className="flex flex-col gap-4 lg:h-full">
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

              {isDesktopScreen && shouldRenderEmpty && (
                <section
                  className={`panel hidden p-6 text-center lg:block ${isEmptyExiting ? "animate-scale-out" : "animate-fade-in-up"}`}
                  aria-label="Getting started"
                >
                  <div className="mx-auto max-w-md">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    <h3 className="font-display text-base" style={{ color: "var(--text-primary)" }}>
                      Add your first Pokemon
                    </h3>
                    <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      Pick a Pokemon to start building your team. Smart Picks will appear here on desktop once your team has members.
                    </p>
                  </div>
                </section>
              )}

              {isDesktopScreen && shouldRenderAnalysis && (
                <section className={`hidden lg:block ${isAnalysisExiting ? "animate-scale-out" : "animate-section-reveal"}`}>
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
              )}
            </div>
          </div>

          {!isDesktopScreen && shouldRenderEmpty && (
            <section
              className={`panel mt-4 p-6 text-center sm:mt-5 sm:p-8 ${isEmptyExiting ? "animate-scale-out" : "animate-fade-in-up"}`}
              aria-label="Getting started"
            >
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
          )}

          {shouldRenderAnalysis && (
            <Suspense fallback={null}>
              <section
                className={`mt-4 sm:mt-5 ${isAnalysisExiting ? "animate-scale-out" : "animate-section-reveal"}`}
                aria-label="Analysis overview"
              >
                <div className="panel-soft px-3.5 py-3">
                  <h2 className="font-display text-base sm:text-lg" style={{ color: "var(--text-primary)" }}>
                    Step 3: Analyze and Refine
                  </h2>
                  <p className="mt-1 text-[0.7rem] sm:text-[0.74rem]" style={{ color: "var(--text-muted)" }}>
                    Start with Smart Picks, then review defensive and offensive coverage to close remaining gaps.
                  </p>
                </div>
              </section>

              {!isDesktopScreen && (
                <section className={`mt-4 sm:mt-5 ${isAnalysisExiting ? "animate-scale-out" : "animate-section-reveal"}`}>
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
              )}

              <section
                className={`mt-4 sm:mt-5 ${isAnalysisExiting ? "animate-scale-out" : "animate-section-reveal"}`}
                style={{ animationDelay: isAnalysisExiting ? undefined : "100ms" }}
                aria-labelledby="coverage-heading"
              >
                <DefensiveCoverage coverage={defensiveCoverage} generation={generation} />
              </section>

              <section
                className={`mt-4 sm:mt-5 ${isAnalysisExiting ? "animate-scale-out" : "animate-section-reveal"}`}
                style={{ animationDelay: isAnalysisExiting ? undefined : "200ms" }}
                aria-label="Offensive coverage"
              >
                <OffensiveCoverage coverage={offensiveCoverage} generation={generation} />
              </section>
            </Suspense>
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
          onDismiss={dismissUndoToast}
        />
      )}
    </DndContext>
  );
};

export default TeamBuilder;
