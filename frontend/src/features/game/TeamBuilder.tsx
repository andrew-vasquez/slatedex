"use client";

import { Suspense, useState, useCallback, useMemo, useEffect, useDeferredValue, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  pointerWithin,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import loadable from "~/lib/loadable";
import { FiCornerDownLeft, FiCornerDownRight, FiMessageCircle, FiRepeat } from "react-icons/fi";
import InfoTooltip from "@/components/ui/InfoTooltip";
import PokemonDragPreview from "~/features/game/PokemonDragPreview";
import AnimatedNumber from "~/features/game/AnimatedNumber";
import GameLoadingSkeleton from "~/features/game/GameLoadingSkeleton";
import TeamBuilderHeader from "./TeamBuilderHeader";
import ClearTeamDialog from "./ClearTeamDialog";
import GameSwitchDialog from "./GameSwitchDialog";
import UnsavedTeamDialog from "./UnsavedTeamDialog";
import PokemonSelection from "./PokemonSelection";
import TeamPanel from "./TeamPanel";
import TeamCaptureGuide from "./TeamCaptureGuide";
import MobileTeamSheet from "./MobileTeamSheet";
import UndoToast from "~/features/game/UndoToast";
import ToastContainer from "~/features/game/ToastContainer";
import OfflineBanner from "~/features/game/OfflineBanner";
import PokemonDetailDrawer from "~/features/game/PokemonDetailDrawer";
import { useAnimatedUnmount } from "~/features/game/hooks/useAnimatedUnmount";
import { useToast, ToastContext } from "~/features/game/hooks/useToast";
import { TYPE_EFFECTIVENESS, TYPE_RESISTANCES, getVersionColor } from "@/lib/constants";
import { triggerHaptic, type HapticTone } from "@/lib/haptics";
import { getTeamDefensiveCoverage, getTeamOffensiveCoverage } from "@/lib/teamAnalysis";
import { useTeamPersistence } from "~/features/game/hooks/useTeamPersistence";
import { useBuilderSettings } from "~/features/game/hooks/useBuilderSettings";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getAiConversationTeamStorageKey,
  getPlayBuilderPreferencesStorageKey,
  getLockedSlotsStorageKey,
  getSelectedGameStorageKey,
  getSelectedVersionStorageKey,
  getVersionFilterStorageKey,
  LAST_VISITED_GENERATION_KEY,
} from "@/lib/storageKeys";
import {
  decodeSharedTeamPayload,
  type SharedTeamPayload,
} from "@/lib/teamShare";
import type { CoverageMap, DexMode, OffensiveCoverageMap, Pokemon, PokemonPools, Game } from "@/lib/types";

const DefensiveCoverage = loadable(() => import("./DefensiveCoverage"), { loading: () => null });
const OffensiveCoverage = loadable(() => import("./OffensiveCoverage"), { loading: () => null });
const TeamRecommendations = loadable(() => import("./TeamRecommendations"), { loading: () => null });
const TeamToolsModal = loadable(() => import("./TeamToolsModal"), { loading: () => null, ssr: false });
const AiCoachPanel = loadable(() => import("./AiCoachPanel"), { loading: () => null, ssr: false });
const CommandPalette = loadable(() => import("~/features/game/CommandPalette"), { loading: () => null, ssr: false });
const OnboardingTour = loadable(() => import("~/features/game/OnboardingTour"), { loading: () => null, ssr: false });

const HISTORY_LIMIT = 40;
const SMART_PICKS_INCLUDE_LEGENDARIES_KEY = "smart_picks_include_legendaries_v1";
const SMART_PICKS_INCLUDE_STARTERS_KEY = "smart_picks_include_starters_v1";
const SMART_PICKS_INCLUDE_POSTGAME_KEY = "smart_picks_include_postgame_v1";
const PLAY_BUILDER_PREFERENCES_KEY = getPlayBuilderPreferencesStorageKey();
const VERSION_THEME_FALLBACK = {
  color: "#da2c43",
  soft: "rgba(218, 44, 67, 0.12)",
  border: "rgba(218, 44, 67, 0.34)",
} as const;

type RecommendationRole = "all" | "bulky" | "fast" | "physical" | "special";
type TeamToolsTab = "saved" | "share";
interface PersistedPlayBuilderPreferences {
  preferredDexMode?: DexMode;
  preferredVersionFilter?: boolean;
  recommendationsEnabled?: boolean;
  recommendationRole?: RecommendationRole;
  typeFilter?: string[];
}

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
  checkpointBossName: string | null;
  checkpointStage: "gym" | "elite4" | "champion" | null;
  checkpointGymOrder: number | null;
}

type PendingUnsavedAction =
  | { type: "switch"; gameId: number }
  | { type: "leave" }
  | null;

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

function getCoverageTypeRisk(entry: CoverageMap[string]): number {
  if (entry.locked) return 0;
  const weak = entry.weakPokemon.length;
  const resist = entry.resistPokemon.length;
  const severeWeaknessCount = entry.weakPokemon.filter((pokemon) => pokemon.effectiveness >= 4).length;
  return Math.max(0, weak - resist) * 1.6 + severeWeaknessCount * 1.3 - Math.max(0, resist - weak) * 0.24;
}

function getDefensiveRiskScore(coverage: CoverageMap): number {
  return Object.values(coverage).reduce((sum, entry) => sum + getCoverageTypeRisk(entry), 0);
}

function getOffensivePressureScore(coverage: OffensiveCoverageMap): number {
  return Object.values(coverage).reduce((sum, entry) => {
    if (entry.locked) return sum;
    const hitterCount = entry.hitters.length;
    if (hitterCount === 0) return sum - 1.45;
    return sum + Math.min(hitterCount, 2) * 1.05 + Math.max(0, hitterCount - 2) * 0.22;
  }, 0);
}

function getPrimaryPokemonRole(pokemon: Pokemon): RecommendationRole {
  const bulkyScore = (pokemon.hp + pokemon.defense + pokemon.specialDefense) / 3;
  const fastScore = pokemon.speed * 1.2;
  const physicalScore = pokemon.attack * 1.08;
  const specialScore = pokemon.specialAttack * 1.08;

  const ranking = [
    { role: "bulky" as const, value: bulkyScore },
    { role: "fast" as const, value: fastScore },
    { role: "physical" as const, value: physicalScore },
    { role: "special" as const, value: specialScore },
  ].sort((a, b) => b.value - a.value);

  return ranking[0]?.role ?? "all";
}

function getRoleFitScore(pokemon: Pokemon, role: RecommendationRole): number {
  const bulk = pokemon.hp + pokemon.defense + pokemon.specialDefense;
  if (role === "bulky") return bulk / 58 + pokemon.speed / 165;
  if (role === "fast") return pokemon.speed / 14 + Math.max(pokemon.attack, pokemon.specialAttack) / 78;
  if (role === "physical") return pokemon.attack / 14 + pokemon.speed / 66 + bulk / 250;
  if (role === "special") return pokemon.specialAttack / 14 + pokemon.speed / 66 + bulk / 250;

  const bst = pokemon.hp + pokemon.attack + pokemon.defense + pokemon.specialAttack + pokemon.specialDefense + pokemon.speed;
  const strongest = Math.max(
    pokemon.attack,
    pokemon.specialAttack,
    pokemon.speed,
    (pokemon.hp + pokemon.defense + pokemon.specialDefense) / 3
  );
  return bst / 90 + strongest / 110;
}

function isRecommendationRole(value: unknown): value is RecommendationRole {
  return value === "all" || value === "bulky" || value === "fast" || value === "physical" || value === "special";
}

const TeamBuilder = ({ generation, games, initialPoolsByGame }: TeamBuilderProps) => {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const importedTokenRef = useRef<string | null>(null);
  // Guards the localStorage write effect from overwriting the pre-selected game on first mount.
  // Without this, the write effect fires with the initial default game ID before the read effect's
  // state update is applied, causing the pre-selection from GameSelector to be clobbered.
  const isFirstGameWriteRef = useRef(true);

  const [selectedGameId, setSelectedGameId] = useState<number>(games[0].id);
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [draggedPokemon, setDraggedPokemon] = useState<Pokemon | null>(null);
  const [activeDropId, setActiveDropId] = useState<string | null>(null);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [pendingGameSwitch, setPendingGameSwitch] = useState<number | null>(null);
  const [pendingUnsavedAction, setPendingUnsavedAction] = useState<PendingUnsavedAction>(null);
  const [unsavedDialogError, setUnsavedDialogError] = useState<string | null>(null);
  const [recommendationsEnabled, setRecommendationsEnabled] = useState(true);
  const [allowLegendaryMythicalRecommendations, setAllowLegendaryMythicalRecommendations] = useState(false);
  const [allowStarterRecommendations, setAllowStarterRecommendations] = useState(false);
  const [allowPostgameRecommendations, setAllowPostgameRecommendations] = useState(false);
  const [recommendationRole, setRecommendationRole] = useState<RecommendationRole>("all");
  const [dexMode, setDexMode] = useState<DexMode>("national");
  const [preferredDexMode, setPreferredDexMode] = useState<DexMode | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [versionFilterEnabled, setVersionFilterEnabled] = useState(true);
  const [preferredVersionFilter, setPreferredVersionFilter] = useState<boolean | null>(null);
  const [canUsePointerDrag, setCanUsePointerDrag] = useState(false);
  const [isDesktopScreen, setIsDesktopScreen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [playPreferencesReady, setPlayPreferencesReady] = useState(false);
  const [detailPokemon, setDetailPokemon] = useState<Pokemon | null>(null);
  const [lockedSlots, setLockedSlots] = useState<boolean[]>(createEmptyLockedSlots);
  const [replaceMode, setReplaceMode] = useState(false);
  const [replaceTargetSlot, setReplaceTargetSlot] = useState<number | null>(null);
  const [undoToastMessage, setUndoToastMessage] = useState<string | null>(null);
  const dismissUndoToast = useCallback(() => setUndoToastMessage(null), []);
  const toast = useToast();
  const [pendingImport, setPendingImport] = useState<PendingImportState | null>(null);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [poolsByGame, setPoolsByGame] = useState<Record<number, PokemonPools>>(initialPoolsByGame);
  const [poolLoadErrorByGame, setPoolLoadErrorByGame] = useState<Record<number, string>>({});
  const [isTeamToolsOpen, setIsTeamToolsOpen] = useState(false);
  const [hasMountedTeamTools, setHasMountedTeamTools] = useState(false);
  const [teamToolsInitialTab, setTeamToolsInitialTab] = useState<TeamToolsTab>("saved");
  const [isAiCoachOpen, setIsAiCoachOpen] = useState(false);
  const [hasMountedAiCoach, setHasMountedAiCoach] = useState(false);
  const [aiConversationTeamId, setAiConversationTeamId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [hasMountedCommandPalette, setHasMountedCommandPalette] = useState(false);
  const [shouldMountOnboardingTour, setShouldMountOnboardingTour] = useState(false);
  const [headerOffsetPx, setHeaderOffsetPx] = useState(0);
  const [isGameContentTransitioning, setIsGameContentTransitioning] = useState(false);

  const pastTeamsRef = useRef<(Pokemon | null)[][]>([]);
  const futureTeamsRef = useRef<(Pokemon | null)[][]>([]);
  const poolsByGameRef = useRef<Record<number, PokemonPools>>(initialPoolsByGame);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const header = document.getElementById("team-builder-header");
    if (!header) {
      setHeaderOffsetPx(0);
      return;
    }

    let rafId: number | null = null;
    const updateOffset = () => {
      const height = Math.max(0, Math.round(header.getBoundingClientRect().height));
      setHeaderOffsetPx(height);
    };
    const scheduleUpdate = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateOffset);
    };

    updateOffset();

    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("orientationchange", scheduleUpdate);

    let observer: ResizeObserver | null = null;
    if ("ResizeObserver" in window) {
      observer = new ResizeObserver(scheduleUpdate);
      observer.observe(header);
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const mountTour = () => setShouldMountOnboardingTour(true);
    const windowWithIdle = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof windowWithIdle.requestIdleCallback === "function") {
      idleId = windowWithIdle.requestIdleCallback(mountTour, { timeout: 1400 });
    } else {
      timeoutId = window.setTimeout(mountTour, 900);
    }

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (idleId !== null && typeof windowWithIdle.cancelIdleCallback === "function") {
        windowWithIdle.cancelIdleCallback(idleId);
      }
    };
  }, []);
  const poolRequestsRef = useRef<Map<number, Promise<PokemonPools | null>>>(new Map());

  const { settings, updateSetting, resetSettings } = useBuilderSettings();
  const emitHaptic = useCallback(
    (tone: HapticTone = "light") => {
      triggerHaptic(tone, { enabled: settings.mobileHaptics, mobileOnly: true });
    },
    [settings.mobileHaptics]
  );

  const selectedGame = useMemo(() => games.find((g) => g.id === selectedGameId) ?? games[0], [games, selectedGameId]);
  const isSelectedGamePoolReady = Boolean(poolsByGame[selectedGame.id]);
  const selectedGamePoolError = poolLoadErrorByGame[selectedGame.id] ?? null;
  const pokemonPools = useMemo(() => poolsByGame[selectedGame.id] ?? EMPTY_POOLS, [poolsByGame, selectedGame.id]);
  const isSelectedGameLoading = !isSelectedGamePoolReady && !selectedGamePoolError;

  useEffect(() => {
    poolsByGameRef.current = poolsByGame;
  }, [poolsByGame]);

  useEffect(() => {
    try { localStorage.setItem(LAST_VISITED_GENERATION_KEY, String(generation)); } catch {}
  }, [generation]);

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
    teamCheckpoint,
    setTeamCheckpoint,
    savedTeams,
    activeTeamId,
    saveTeamAs,
    overwriteSavedTeam,
    loadSavedTeam,
    deleteSavedTeam,
    renameSavedTeam,
    isAuthenticated,
    isSaving,
    refreshSavedTeams,
    carryTeamToGame,
    discardUnsavedDraft,
  } = useTeamPersistence({ generation, gameId: selectedGame.id, selectedVersionId });

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
    emitHaptic("light");
  }, [emitHaptic, persistTeam, syncHistoryState, team]);

  const handleRedo = useCallback(() => {
    const next = futureTeamsRef.current.pop();
    if (!next) return;

    pastTeamsRef.current.push([...team]);
    persistTeam(next);
    setUndoToastMessage("Redo applied");
    syncHistoryState();
    emitHaptic("light");
  }, [emitHaptic, persistTeam, syncHistoryState, team]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount — generation and games never change during TeamBuilder's lifetime

  useEffect(() => {
    // Skip the first invocation — the reading effect above sets the correct initial game from
    // localStorage. Writing here on the first run (with the default game ID) would overwrite it.
    if (isFirstGameWriteRef.current) {
      isFirstGameWriteRef.current = false;
      return;
    }
    try {
      localStorage.setItem(getSelectedGameStorageKey(generation), String(selectedGameId));
    } catch {
      // ignore
    }
  }, [generation, selectedGameId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PLAY_BUILDER_PREFERENCES_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as PersistedPlayBuilderPreferences;
      const knownTypes = new Set(Object.keys(TYPE_EFFECTIVENESS));

      if (parsed.preferredDexMode === "regional" || parsed.preferredDexMode === "national") {
        setPreferredDexMode(parsed.preferredDexMode);
      }
      if (typeof parsed.preferredVersionFilter === "boolean") {
        setPreferredVersionFilter(parsed.preferredVersionFilter);
      }
      if (typeof parsed.recommendationsEnabled === "boolean") {
        setRecommendationsEnabled(parsed.recommendationsEnabled);
      }
      if (isRecommendationRole(parsed.recommendationRole)) {
        setRecommendationRole(parsed.recommendationRole);
      }
      if (Array.isArray(parsed.typeFilter)) {
        const normalizedTypes = [...new Set(
          parsed.typeFilter.filter((value): value is string => typeof value === "string" && knownTypes.has(value))
        )];
        setTypeFilter(normalizedTypes);
      }
    } catch {
      // ignore invalid persisted preferences
    } finally {
      setPlayPreferencesReady(true);
    }
  }, []);

  useEffect(() => {
    if (!playPreferencesReady) return;

    const payload: PersistedPlayBuilderPreferences = {
      preferredDexMode: preferredDexMode ?? settings.defaultDexMode,
      preferredVersionFilter: preferredVersionFilter ?? settings.defaultVersionFilter,
      recommendationsEnabled,
      recommendationRole,
      typeFilter,
    };

    try {
      localStorage.setItem(PLAY_BUILDER_PREFERENCES_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [
    playPreferencesReady,
    preferredDexMode,
    preferredVersionFilter,
    recommendationRole,
    recommendationsEnabled,
    settings.defaultDexMode,
    settings.defaultVersionFilter,
    typeFilter,
  ]);

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
      void (async () => {
        for (const gameId of pendingGameIds) {
          if (cancelled) break;
          await ensureGamePool(gameId);
        }
      })();
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
      // (hover: hover) AND (pointer: fine) is sufficient — maxTouchPoints === 0 is
      // too strict and breaks Macs (which report maxTouchPoints = 5 via trackpad).
      const canUseFinePointer = pointerQuery.matches;
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
    try {
      setAllowLegendaryMythicalRecommendations(localStorage.getItem(SMART_PICKS_INCLUDE_LEGENDARIES_KEY) === "true");
      setAllowStarterRecommendations(localStorage.getItem(SMART_PICKS_INCLUDE_STARTERS_KEY) === "true");
      setAllowPostgameRecommendations(localStorage.getItem(SMART_PICKS_INCLUDE_POSTGAME_KEY) === "true");
    } catch {
      setAllowLegendaryMythicalRecommendations(false);
      setAllowStarterRecommendations(false);
      setAllowPostgameRecommendations(false);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        SMART_PICKS_INCLUDE_LEGENDARIES_KEY,
        allowLegendaryMythicalRecommendations ? "true" : "false"
      );
    } catch {
      // ignore storage errors
    }
  }, [allowLegendaryMythicalRecommendations]);

  useEffect(() => {
    try {
      localStorage.setItem(
        SMART_PICKS_INCLUDE_STARTERS_KEY,
        allowStarterRecommendations ? "true" : "false"
      );
    } catch {
      // ignore storage errors
    }
  }, [allowStarterRecommendations]);

  useEffect(() => {
    try {
      localStorage.setItem(
        SMART_PICKS_INCLUDE_POSTGAME_KEY,
        allowPostgameRecommendations ? "true" : "false"
      );
    } catch {
      // ignore storage errors
    }
  }, [allowPostgameRecommendations]);

  useEffect(() => {
    if (!isSelectedGamePoolReady) return;
    const preferred = preferredDexMode ?? settings.defaultDexMode;
    if (preferred === "regional" && !pokemonPools.regionalResolved) {
      setDexMode("national");
      return;
    }
    setDexMode(preferred);
  }, [isSelectedGamePoolReady, pokemonPools.regionalResolved, preferredDexMode, selectedGame.id, settings.defaultDexMode]);

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
    if (preferredVersionFilter === null) {
      setVersionFilterEnabled(settings.defaultVersionFilter);
      return;
    }
    setVersionFilterEnabled(preferredVersionFilter);
  }, [preferredVersionFilter, selectedGame.id, settings.defaultVersionFilter]);

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
    setPreferredVersionFilter((previous) => (previous === versionFilterEnabled ? previous : versionFilterEnabled));
  }, [versionFilterEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(getVersionFilterStorageKey(selectedGame.id), versionFilterEnabled ? "true" : "false");
    } catch {
      // ignore storage errors
    }
  }, [selectedGame.id, versionFilterEnabled]);

  useEffect(() => {
    const storageKey = getAiConversationTeamStorageKey(generation, selectedGame.id);
    try {
      const storedTeamId = localStorage.getItem(storageKey);
      setAiConversationTeamId(storedTeamId && storedTeamId.trim() ? storedTeamId : null);
    } catch {
      setAiConversationTeamId(null);
    }
  }, [generation, selectedGame.id]);

  useEffect(() => {
    if (!activeTeamId) return;
    setAiConversationTeamId(activeTeamId);
    try {
      localStorage.setItem(getAiConversationTeamStorageKey(generation, selectedGame.id), activeTeamId);
    } catch {
      // ignore
    }
  }, [activeTeamId, generation, selectedGame.id]);

  const handleAiConversationTeamBound = useCallback((teamId: string | null) => {
    setAiConversationTeamId(teamId);
    try {
      const key = getAiConversationTeamStorageKey(generation, selectedGame.id);
      if (teamId) {
        localStorage.setItem(key, teamId);
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  }, [generation, selectedGame.id]);

  useEffect(() => {
    resetHistory();
    setUndoToastMessage(null);
    setReplaceMode(false);
    setReplaceTargetSlot(null);
  }, [resetHistory, selectedGame.id]);

  useEffect(() => {
    setIsGameContentTransitioning(true);
    const timeoutId = window.setTimeout(() => setIsGameContentTransitioning(false), 220);
    return () => window.clearTimeout(timeoutId);
  }, [selectedGame.id]);

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

  const executeGameSwitch = useCallback((gameId: number) => {
    setSelectedGameId(gameId);
    setSearchTerm("");
    setPendingGameSwitch(null);
    void ensureGamePool(gameId);
  }, [ensureGamePool]);

  const hasPokemonInParty = useMemo(
    () => team.some((slot) => slot !== null),
    [team]
  );
  const hasUnsavedTeam = useMemo(
    () => hasPokemonInParty && !activeTeamId,
    [activeTeamId, hasPokemonInParty]
  );

  const handleGameChange = useCallback((gameId: number) => {
    if (gameId === selectedGameId) return;
    if (hasUnsavedTeam) {
      setUnsavedDialogError(null);
      setPendingUnsavedAction({ type: "switch", gameId });
      return;
    }

    const targetGame = games.find((game) => game.id === gameId);
    const canCarryTeam = Boolean(targetGame && targetGame.region === selectedGame.region);

    if (hasPokemonInParty && canCarryTeam) {
      setPendingGameSwitch(gameId);
      return;
    }
    executeGameSwitch(gameId);
  }, [executeGameSwitch, games, hasPokemonInParty, hasUnsavedTeam, selectedGame.region, selectedGameId]);

  // Intentionally removed auto-execute: if the team empties while the switch dialog is open
  // (e.g. via undo), we keep the dialog up so the user always confirms or cancels explicitly.

  const handleGameSwitchKeepTeam = useCallback(() => {
    if (pendingGameSwitch === null) return;
    carryTeamToGame(pendingGameSwitch);
    executeGameSwitch(pendingGameSwitch);
  }, [carryTeamToGame, executeGameSwitch, pendingGameSwitch]);

  const handleGameSwitchStartFresh = useCallback(() => {
    if (pendingGameSwitch === null) return;
    executeGameSwitch(pendingGameSwitch);
  }, [executeGameSwitch, pendingGameSwitch]);

  const handleGameSwitchCancel = useCallback(() => {
    setPendingGameSwitch(null);
  }, []);

  const continueWithUnsavedAction = useCallback((action: PendingUnsavedAction) => {
    if (!action) return;
    if (action.type === "switch") {
      executeGameSwitch(action.gameId);
      return;
    }
    void navigate({ to: "/play" });
  }, [executeGameSwitch, navigate]);

  const handleBackToGameSelect = useCallback(() => {
    if (hasUnsavedTeam) {
      setUnsavedDialogError(null);
      setPendingUnsavedAction({ type: "leave" });
      return;
    }
    void navigate({ to: "/play" });
  }, [hasUnsavedTeam, navigate]);

  const handleUnsavedDialogCancel = useCallback(() => {
    setUnsavedDialogError(null);
    setPendingUnsavedAction(null);
  }, []);

  const handleUnsavedContinueWithoutSaving = useCallback(() => {
    const pendingAction = pendingUnsavedAction;
    setUnsavedDialogError(null);
    setPendingUnsavedAction(null);
    discardUnsavedDraft();
    continueWithUnsavedAction(pendingAction);
  }, [continueWithUnsavedAction, discardUnsavedDraft, pendingUnsavedAction]);

  const handleUnsavedSaveAndContinue = useCallback(async () => {
    const pendingAction = pendingUnsavedAction;
    if (!pendingAction) return;

    if (!isAuthenticated) {
      setUnsavedDialogError("Sign in to save teams before leaving this page.");
      return;
    }

    try {
      setUnsavedDialogError(null);
      const fallbackName = `${selectedGame.name} Team`;
      await saveTeamAs(
        fallbackName,
        selectedVersionId ? [selectedVersionId] : undefined
      );
      setPendingUnsavedAction(null);
      continueWithUnsavedAction(pendingAction);
    } catch {
      setUnsavedDialogError("Could not save team right now. Try again.");
    }
  }, [
    continueWithUnsavedAction,
    isAuthenticated,
    pendingUnsavedAction,
    saveTeamAs,
    selectedGame.name,
    selectedVersionId,
  ]);

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
      setPreferredDexMode(nextMode);
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
  const selectedVersionLabel = useMemo(
    () =>
      selectedGame.versions.find((version) => version.id === selectedVersionId)?.label
      ?? selectedGame.versions[0]?.label
      ?? selectedVersionId,
    [selectedGame.versions, selectedVersionId]
  );
  const versionColor = useMemo(() => getVersionColor(selectedVersionId), [selectedVersionId]);
  const versionCssVars = useMemo(() => {
    const theme = settings.versionTheming ? versionColor : VERSION_THEME_FALLBACK;
    return {
      "--version-color": theme.color,
      "--version-color-soft": theme.soft,
      "--version-color-border": theme.border,
    } as React.CSSProperties;
  }, [versionColor, settings.versionTheming]);
  const aiAllowedPokemonNames = useMemo(() => {
    if (dexMode !== "regional" && !versionFilterEnabled) return [];
    return versionScopedPokemonPool.map((pokemon) => pokemon.name.toLowerCase());
  }, [dexMode, versionFilterEnabled, versionScopedPokemonPool]);
  const filteredPokemon = useMemo(() => {
    let pool = availablePokemon;
    if (typeFilter.length > 0) {
      const selectedTypes = new Set(typeFilter);
      pool = pool.filter((pokemon) => {
        const pokemonTypes = new Set(pokemon.types);
        return [...selectedTypes].every((type) => pokemonTypes.has(type));
      });
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
        if (commitTeam(newTeam, { message: "Swapped team slots" })) {
          emitHaptic("light");
        }
      } else {
        const newTeam = [...team];
        newTeam[targetSlot] = active.data.current.pokemon;
        if (commitTeam(newTeam, { message: `Added ${active.data.current.pokemon.name}` })) {
          setReplaceTargetSlot(null);
          emitHaptic("light");
        }
      }
    },
    [commitTeam, emitHaptic, lockedSlots, team]
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
      emitHaptic("light");
    },
    [commitTeam, emitHaptic, lockedSlots, replaceTargetSlot, team]
  );

  const openAiCoach = useCallback(() => {
    setHasMountedAiCoach(true);
    setIsAiCoachOpen(true);
    emitHaptic("medium");
  }, [emitHaptic]);

  const closeAiCoach = useCallback(() => {
    setIsAiCoachOpen(false);
  }, []);

  const toggleAiCoach = useCallback(() => {
    setHasMountedAiCoach(true);
    setIsAiCoachOpen((prev) => !prev);
    emitHaptic("light");
  }, [emitHaptic]);

  const closeCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(false);
  }, []);

  const toggleCommandPalette = useCallback(() => {
    setHasMountedCommandPalette(true);
    setIsCommandPaletteOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggleCommandPalette();
        return;
      }

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

        if (typeFilter.length > 0) {
          setTypeFilter([]);
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
  }, [handleRedo, handleUndo, replaceTargetSlot, searchTerm, toggleCommandPalette, typeFilter]);

  const clearableCount = useMemo(
    () => team.filter((slot, index) => slot !== null && !lockedSlots[index]).length,
    [lockedSlots, team]
  );

  const openClearDialog = useCallback(() => {
    if (clearableCount === 0) return;
    setIsClearDialogOpen(true);
    emitHaptic("light");
  }, [clearableCount, emitHaptic]);

  const closeClearDialog = useCallback(() => {
    setIsClearDialogOpen(false);
  }, []);

  const confirmClearTeam = useCallback(() => {
    const newTeam = team.map((slot, index) => (lockedSlots[index] ? slot : null));
    const didCommit = commitTeam(newTeam, { message: "Cleared unlocked slots" });
    setIsClearDialogOpen(false);
    setReplaceTargetSlot(null);
    if (didCommit) {
      emitHaptic("medium");
    }
  }, [commitTeam, emitHaptic, lockedSlots, team]);

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

    if (commitTeam(newTeam, { message: "Shuffled unlocked slots" })) {
      emitHaptic("light");
    }
  }, [commitTeam, emitHaptic, lockedSlots, team]);

  const addPokemonToTeam = useCallback(
    (pokemon: Pokemon) => {
      if (replaceMode && replaceTargetSlot !== null && !lockedSlots[replaceTargetSlot]) {
        const newTeam = [...team];
        newTeam[replaceTargetSlot] = pokemon;
        if (commitTeam(newTeam, { message: `Replaced slot ${replaceTargetSlot + 1} with ${pokemon.name}` })) {
          setReplaceTargetSlot(null);
          emitHaptic("light");
        }
        return;
      }

      const firstEmptyUnlockedSlot = team.findIndex((slot, index) => slot === null && !lockedSlots[index]);
      if (firstEmptyUnlockedSlot === -1) {
        emitHaptic("error");
        return;
      }

      const newTeam = [...team];
      newTeam[firstEmptyUnlockedSlot] = pokemon;
      if (commitTeam(newTeam, { message: `Added ${pokemon.name}` })) {
        emitHaptic("light");
      }
    },
    [commitTeam, emitHaptic, lockedSlots, replaceMode, replaceTargetSlot, team]
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
  const teamHealth = useMemo(() => {
    const typeCounts = new Map<string, number>();
    currentTeam.forEach((pokemon) => {
      pokemon.types.forEach((type) => {
        typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
      });
    });

    const overlappingTypes = Array.from(typeCounts.entries()).filter(([, count]) => count > 1).length;
    const fastCount = currentTeam.filter((pokemon) => pokemon.speed >= 100).length;
    const slowCount = currentTeam.filter((pokemon) => pokemon.speed < 70).length;
    const averageSpeed =
      currentTeam.length > 0
        ? Math.round(currentTeam.reduce((sum, pokemon) => sum + pokemon.speed, 0) / currentTeam.length)
        : 0;
    const speedCurveLabel =
      fastCount >= Math.max(2, Math.ceil(currentTeam.length / 3))
        ? "Aggressive"
        : slowCount >= Math.max(2, Math.ceil(currentTeam.length / 3))
          ? "Bulky"
          : "Balanced";

    const hazardSetterTypes = new Set(["rock", "ground", "steel"]);
    const hazardControlTypes = new Set(["flying", "poison", "ghost", "steel", "ground", "fire"]);
    const hasSetterProfile = currentTeam.some((pokemon) =>
      pokemon.types.some((type) => hazardSetterTypes.has(type))
    );
    const hasControlProfile = currentTeam.some((pokemon) =>
      pokemon.types.some((type) => hazardControlTypes.has(type))
    );
    const hazardPlanLabel = hasSetterProfile
      ? hasControlProfile
        ? "Set + pressure profile"
        : "Set pressure likely"
      : hasControlProfile
        ? "Removal pressure likely"
        : "Plan hazards manually";

    return {
      overlappingTypes,
      fastCount,
      averageSpeed,
      speedCurveLabel,
      hazardPlanLabel,
    };
  }, [currentTeam]);

  const recommendations = useMemo<Recommendation[]>(() => {
    if (!recommendationsEnabled || currentTeam.length === 0 || availablePokemon.length === 0) return [];

    const candidatePool = availablePokemon.filter((pokemon) => {
      if (!pokemon.isFinalEvolution) return false;
      if (!allowLegendaryMythicalRecommendations && (pokemon.isLegendary || pokemon.isMythical)) return false;
      if (!allowStarterRecommendations && pokemon.isStarterLine) return false;
      if (!allowPostgameRecommendations && pokemon.isPostgame) return false;
      return true;
    });
    if (candidatePool.length === 0) return [];

    const roleFilteredPool = candidatePool.filter((pokemon) => {
      if (recommendationRole === "all") return true;
      if (recommendationRole === "bulky") return pokemon.hp + pokemon.defense + pokemon.specialDefense >= 280;
      if (recommendationRole === "fast") return pokemon.speed >= 95;
      if (recommendationRole === "physical") return pokemon.attack >= 95;
      return pokemon.specialAttack >= 95;
    });

    if (roleFilteredPool.length === 0) return [];

    const activeTypeNames = Object.entries(defensiveCoverage)
      .filter(([, entry]) => !entry.locked)
      .map(([type]) => type);
    const baseDefensiveRisk = getDefensiveRiskScore(defensiveCoverage);
    const baseOffensivePressure = getOffensivePressureScore(offensiveCoverage);
    const teamTypeCounts = new Map<string, number>();
    const teamPrimaryRoleCounts = new Map<RecommendationRole, number>();

    currentTeam.forEach((member) => {
      member.types.forEach((type) => {
        teamTypeCounts.set(type, (teamTypeCounts.get(type) ?? 0) + 1);
      });
      const role = getPrimaryPokemonRole(member);
      teamPrimaryRoleCounts.set(role, (teamPrimaryRoleCounts.get(role) ?? 0) + 1);
    });

    const ranked = roleFilteredPool.map((pokemon) => {
      const simulatedTeam = [...currentTeam, pokemon];
      const simulatedDefensiveCoverage = getTeamDefensiveCoverage(simulatedTeam, generation);
      const simulatedOffensiveCoverage = getTeamOffensiveCoverage(simulatedTeam, generation);

      const defensiveDelta = baseDefensiveRisk - getDefensiveRiskScore(simulatedDefensiveCoverage);
      const offensiveDelta = getOffensivePressureScore(simulatedOffensiveCoverage) - baseOffensivePressure;

      const typeImprovements = activeTypeNames.map((type) => {
        const baseEntry = defensiveCoverage[type];
        const simulatedEntry = simulatedDefensiveCoverage[type];
        const riskDelta = getCoverageTypeRisk(baseEntry) - getCoverageTypeRisk(simulatedEntry);
        return { type, riskDelta };
      });

      const covers = typeImprovements
        .filter((entry) => entry.riskDelta > 0.08)
        .sort((a, b) => b.riskDelta - a.riskDelta)
        .map((entry) => entry.type);

      const risky = activeTypeNames
        .map((type) => {
          const simulatedEntry = simulatedDefensiveCoverage[type];
          return {
            type,
            net: simulatedEntry.weakPokemon.length - simulatedEntry.resistPokemon.length,
            effectiveness: getPokemonEffectivenessAgainstType(pokemon, type),
          };
        })
        .filter((entry) => entry.net > 0 && entry.effectiveness > 1)
        .sort((a, b) => b.net - a.net || b.effectiveness - a.effectiveness)
        .map((entry) => entry.type);

      const roleFitScore = getRoleFitScore(pokemon, recommendationRole);
      const primaryRole = getPrimaryPokemonRole(pokemon);
      const duplicateTypePenalty = pokemon.types.reduce((sum, type) => sum + (teamTypeCounts.get(type) ?? 0) * 0.86, 0);
      const dualTypeRepeatPenalty =
        pokemon.types.length > 1 && pokemon.types.every((type) => (teamTypeCounts.get(type) ?? 0) > 0) ? 0.75 : 0;
      const roleOverlapPenalty = (teamPrimaryRoleCounts.get(primaryRole) ?? 0) * 0.38;

      const score =
        defensiveDelta * 3.15 +
        offensiveDelta * 1.95 +
        roleFitScore * 1.05 -
        duplicateTypePenalty -
        dualTypeRepeatPenalty -
        roleOverlapPenalty;

      const reasonParts: string[] = [];
      if (covers.length > 0 && defensiveDelta > 0) {
        reasonParts.push(`Patches ${covers.slice(0, 2).join(" / ")}`);
      }
      if (defensiveDelta > 0.15) {
        reasonParts.push(`Def gain +${defensiveDelta.toFixed(1)}`);
      }
      if (offensiveDelta > 0.15) {
        reasonParts.push(`Off gain +${offensiveDelta.toFixed(1)}`);
      }

      if (recommendationRole === "all") {
        reasonParts.push(`Strong ${getRoleLabel(primaryRole).toLowerCase()} profile`);
      } else {
        reasonParts.push(`${getRoleLabel(recommendationRole)} role fit`);
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
  }, [
    allowLegendaryMythicalRecommendations,
    allowPostgameRecommendations,
    allowStarterRecommendations,
    availablePokemon,
    currentTeam,
    defensiveCoverage,
    generation,
    offensiveCoverage,
    recommendationRole,
    recommendationsEnabled,
  ]);

  const canReplaceWeakest = useMemo(
    () => team.some((slot, index) => slot !== null && !lockedSlots[index]),
    [lockedSlots, team]
  );
  const canReplaceTargeted = useMemo(() => {
    if (!replaceMode || replaceTargetSlot === null) return false;
    return !lockedSlots[replaceTargetSlot] && team[replaceTargetSlot] !== null;
  }, [lockedSlots, replaceMode, replaceTargetSlot, team]);

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
        emitHaptic("light");
      }
    },
    [commitTeam, deficitByType, emitHaptic, lockedSlots, team]
  );
  const handleReplaceTargeted = useCallback(
    (pokemon: Pokemon) => {
      if (!canReplaceTargeted || replaceTargetSlot === null) return;
      const existing = team[replaceTargetSlot];
      if (!existing) return;
      const newTeam = [...team];
      newTeam[replaceTargetSlot] = pokemon;
      if (commitTeam(newTeam, { message: `Replaced ${existing.name} with ${pokemon.name}` })) {
        setReplaceTargetSlot(null);
        emitHaptic("light");
      }
    },
    [canReplaceTargeted, commitTeam, emitHaptic, replaceTargetSlot, team]
  );

  const toggleLockSlot = useCallback((index: number) => {
    setLockedSlots((prev) => {
      const nextLocked = !prev[index];
      emitHaptic(nextLocked ? "medium" : "light");
      return prev.map((value, slotIndex) => (slotIndex === index ? nextLocked : value));
    });
    if (replaceTargetSlot === index) {
      setReplaceTargetSlot(null);
    }
  }, [emitHaptic, replaceTargetSlot]);

  const handleLoadSavedTeam = useCallback(
    (teamId: string) => {
      const selected = savedTeams.find((savedTeam) => savedTeam.id === teamId);
      if (selected && !teamsEqual(team, selected.pokemon)) {
        pushHistory(team);
        setUndoToastMessage(`Loaded ${selected.name}`);
      }

      loadSavedTeam(teamId);
      emitHaptic("success");
    },
    [emitHaptic, loadSavedTeam, pushHistory, savedTeams, team]
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
        checkpointBossName: payload.checkpointBossName ?? null,
        checkpointStage: payload.checkpointStage ?? null,
        checkpointGymOrder: payload.checkpointGymOrder ?? null,
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
        emitHaptic("success");
        return "Imported payload. Applied to current team.";
      }

      void ensureGamePool(targetGame.id).then((loaded) => {
        if (!loaded) return;
        const resolvedImport = buildPendingImportState(payload, targetGame.id);
        if (!resolvedImport) return;
        setPendingImport(resolvedImport);
        setSelectedGameId(targetGame.id);
        emitHaptic("success");
      });

      return "Loading game data for import. It will apply automatically.";
    },
    [buildPendingImportState, emitHaptic, ensureGamePool, games, generation, selectedGame.id]
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
    void setTeamCheckpoint(
      pendingImport.checkpointBossName || pendingImport.checkpointStage || pendingImport.checkpointGymOrder
        ? {
            checkpointBossName: pendingImport.checkpointBossName,
            checkpointStage: pendingImport.checkpointStage,
            checkpointGymOrder: pendingImport.checkpointGymOrder,
          }
        : null
    );

    setLockedSlots(pendingImport.lockedSlots);
    commitTeam(pendingImport.team, { message: "Imported shared team" });
    setPendingImport(null);
    setReplaceMode(false);
    setReplaceTargetSlot(null);
  }, [
    commitTeam,
    handleDexModeChange,
    pendingImport,
    selectedGame.id,
    selectedGame.versions,
    setTeamCheckpoint,
  ]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("team");
    if (!token || token === importedTokenRef.current) return;

    importedTokenRef.current = token;
    const parsed = decodeSharedTeamPayload(token);

    if (parsed) {
      queueImportPayload(parsed);
    }

    void navigate({ to: pathname, replace: true });
  }, [navigate, pathname, queueImportPayload]);

  const sharePayload = useMemo<SharedTeamPayload>(
    () => ({
      v: 1,
      generation,
      gameId: selectedGame.id,
      team: team.map((pokemon) => pokemon?.id ?? null),
      lockedSlots: lockedSlots.map((locked, index) => (locked ? index : -1)).filter((index) => index >= 0),
      selectedVersionId,
      dexMode,
      checkpointBossName: teamCheckpoint?.checkpointBossName ?? null,
      checkpointStage: teamCheckpoint?.checkpointStage ?? null,
      checkpointGymOrder: teamCheckpoint?.checkpointGymOrder ?? null,
    }),
    [dexMode, generation, lockedSlots, selectedGame.id, selectedVersionId, team, teamCheckpoint]
  );

  const openTeamTools = useCallback((tab: TeamToolsTab = "saved") => {
    setTeamToolsInitialTab(tab);
    setHasMountedTeamTools(true);
    setIsTeamToolsOpen(true);
    emitHaptic("medium");
  }, [emitHaptic]);

  return (
    <ToastContext.Provider value={toast}>
    <div style={versionCssVars}>
    <DndContext
      id={`team-builder-dnd-${selectedGame.id}`}
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen" style={{ color: "var(--text-primary)" }}>
        <TeamBuilderHeader
          game={selectedGame}
          generation={generation}
          onBackToGameSelect={handleBackToGameSelect}
          onGameChange={handleGameChange}
          onShuffle={shuffleTeam}
          onClear={openClearDialog}
          teamLength={currentTeam.length}
          settings={settings}
          onSettingsDexModeChange={(value) => updateSetting("defaultDexMode", value)}
          onSettingsVersionFilterDefaultChange={(value) => updateSetting("defaultVersionFilter", value)}
          onSettingsCardDensityChange={(value) => updateSetting("cardDensity", value)}
          onSettingsReduceMotionChange={(value) => updateSetting("reduceMotion", value)}
          onSettingsDragBehaviorChange={(value) => updateSetting("dragBehavior", value)}
          onSettingsVersionThemingChange={(value) => updateSetting("versionTheming", value)}
          onSettingsMobileHapticsChange={(value) => updateSetting("mobileHaptics", value)}
          onSettingsReset={resetSettings}
          isAiCoachOpen={isAiCoachOpen}
          versionCssVars={versionCssVars}
        />

        <main
          id="main-content"
          className="mx-auto max-w-screen-xl px-4 pb-24 pt-4 sm:px-6 sm:pt-5 lg:pb-8"
          role="main"
        >
          <div
            className={isGameContentTransitioning ? "animate-fade-in-up" : undefined}
            style={{
              opacity: isSelectedGameLoading ? 0.72 : 1,
              transition: "opacity 180ms ease",
            }}
          >
          <section className="panel-soft mb-4 border px-3.5 py-3 sm:px-4 sm:py-3.5" style={{ borderColor: "var(--border)" }} aria-label="Team health summary">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div>
                <p className="text-xs sm:text-[0.62rem] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                  Team Health
                </p>
                <p className="text-sm sm:text-[0.76rem]" style={{ color: "var(--text-secondary)" }}>
                  Quick read on overlap, speed curve, and hazard posture.
                </p>
              </div>
              {hasTeam ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <InfoTooltip
                    label={<span className="rounded-full border px-2.5 py-1.5 text-xs sm:text-[0.64rem] font-semibold inline-flex items-center gap-1" style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-secondary)" }}>Type overlap: {teamHealth.overlappingTypes}</span>}
                    description="Number of types shared by multiple team members. High overlap can leave gaps in coverage."
                  />
                  <InfoTooltip
                    label={<span className="rounded-full border px-2.5 py-1.5 text-xs sm:text-[0.64rem] font-semibold inline-flex items-center gap-1" style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-secondary)" }}>Speed: {teamHealth.speedCurveLabel} ({teamHealth.averageSpeed} avg)</span>}
                    description="Your team's speed distribution. Balanced curves help with matchup flexibility."
                  />
                  <InfoTooltip
                    label={<span className="rounded-full border px-2.5 py-1.5 text-xs sm:text-[0.64rem] font-semibold inline-flex items-center gap-1" style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-secondary)" }}>Fast mons: {teamHealth.fastCount}</span>}
                    description="Pokémon with Speed above 100. Useful for outspeeding threats."
                  />
                  <InfoTooltip
                    label={<span className="rounded-full border px-2.5 py-1.5 text-xs sm:text-[0.64rem] font-semibold inline-flex items-center gap-1" style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-secondary)" }}>Hazards: {teamHealth.hazardPlanLabel}</span>}
                    description="Whether your team can set or remove entry hazards (Stealth Rock, Spikes, etc.)."
                  />
                </div>
              ) : (
                <span className="rounded-full border px-2.5 py-1.5 text-xs sm:text-[0.64rem] font-semibold" style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-muted)" }}>
                  Add at least one Pokemon to compute health
                </span>
              )}
            </div>
          </section>

          {/* ── Main layout: list LEFT + sticky team RIGHT ── */}
          <div className="lg:grid lg:grid-cols-[1fr_440px] lg:items-start lg:gap-6">

            {/* ── RIGHT: Sticky team sidebar (desktop only) ───────────── */}
            <div className="hidden lg:order-2 lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pb-4">

              <div data-tour="team-panel">
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
                onOpenTeamTools={() => openTeamTools("saved")}
              />
              </div>

              {/* Controls + Stats (compact) */}
              <div className="panel p-4">
                {/* Progress + quick stats row */}
                <div className="mb-2.5 flex items-center gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline justify-between">
                      <InfoTooltip
                        label={<span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Slots</span>}
                        description="Your 6 team positions. Fill all slots to unlock full coverage analysis and recommendations."
                      />
                      <AnimatedNumber value={`${currentTeam.length}/6`} className="font-display text-base" style={{ color: "var(--accent)" }} />
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--stat-track)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(currentTeam.length / 6) * 100}%`,
                          background: "linear-gradient(90deg, var(--version-color, var(--accent)) 0%, color-mix(in srgb, var(--version-color, var(--accent)) 60%, #ef6f40) 100%)",
                          transition: "width 0.25s ease, background 0.35s ease",
                        }}
                      />
                    </div>
                  </div>
                  {hasTeam && (
                    <>
                      <div className="shrink-0 rounded-lg border px-2 py-1.5 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
                        <InfoTooltip
                          label={<span className="text-[0.6rem] font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Risks</span>}
                          description="Types that hit your team super-effectively. More Pokémon weak to a type than resist it = exposed. Lower is better."
                        />
                        <AnimatedNumber value={exposedTypes} className="font-display text-base leading-none" style={{ color: exposedTypes > 0 ? "#b91c1c" : "#136f3a", transition: "color 0.3s ease" }} />
                      </div>
                      <div className="shrink-0 rounded-lg border px-2 py-1.5 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
                        <InfoTooltip
                          label={<span className="text-[0.6rem] font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Stable</span>}
                          description="Types your team handles well—at least as many resistances as weaknesses. Higher is better for defensive coverage."
                        />
                        <AnimatedNumber value={stableTypes} className="font-display text-base leading-none" style={{ color: "var(--accent-blue)" }} />
                      </div>
                    </>
                  )}
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-1.5">
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
                    onClick={() => { setReplaceMode((prev) => !prev); setReplaceTargetSlot(null); }}
                    className="btn-secondary action-btn w-full"
                    style={{
                      borderColor: replaceMode ? "rgba(59, 130, 246, 0.34)" : "var(--border)",
                      background: replaceMode ? "rgba(59, 130, 246, 0.14)" : undefined,
                      color: replaceMode ? "#93c5fd" : undefined,
                    }}
                  >
                    <FiRepeat size={13} />
                    {replaceMode ? "Replace On" : "Replace"}
                  </button>
                  <button
                    type="button"
                    data-tour="ai-coach"
                    onClick={openAiCoach}
                    className="ai-coach-trigger action-btn w-full"
                  >
                    <FiMessageCircle size={13} />
                    AI Coach
                  </button>
                </div>
                <div
                  className="mt-2 rounded-xl border px-3 py-1.5 text-[0.72rem]"
                  style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-muted)" }}
                >
                  {replaceMode
                    ? replaceTargetSlot !== null
                      ? `Targeting slot ${replaceTargetSlot + 1}`
                      : "Pick a team slot to replace"
                    : dragEnabled
                      ? "Drag from the list to fill slots"
                      : "Tap a Pokémon to add it to a slot"}
                </div>
                {isSaving && (
                  <p className="mt-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
                    Saving…
                  </p>
                )}
              </div>
            </div>

            {/* ── LEFT / MOBILE: selection column ────────────────────── */}
            <div className="flex min-w-0 flex-col gap-4 lg:order-1">

              {/* Mobile-only compact action bar */}
              <div className="lg:hidden">
                <section className="panel p-3 sm:p-4" aria-label="Team controls">
                  <div className="grid grid-cols-2 gap-1.5">
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
                      onClick={() => { setReplaceMode((prev) => !prev); setReplaceTargetSlot(null); }}
                      className="btn-secondary action-btn col-span-2 w-full"
                      style={{
                        borderColor: replaceMode ? "rgba(59, 130, 246, 0.34)" : "var(--border)",
                        background: replaceMode ? "rgba(59, 130, 246, 0.14)" : undefined,
                        color: replaceMode ? "#93c5fd" : undefined,
                      }}
                    >
                      <FiRepeat size={13} />
                      {replaceMode ? "Replace On" : "Replace"}
                    </button>
                    <button
                      type="button"
                      onClick={openAiCoach}
                      className="ai-coach-trigger action-btn col-span-2 w-full"
                    >
                      <FiMessageCircle size={13} />
                      AI Coach
                    </button>
                    <div
                      className="col-span-2 rounded-xl border px-3 py-1.5 text-[0.72rem] sm:py-2 sm:text-[0.78rem]"
                      style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-muted)" }}
                    >
                      {replaceMode
                        ? replaceTargetSlot !== null
                          ? `Targeting slot ${replaceTargetSlot + 1}`
                          : "Pick a team slot to replace"
                        : "Fill empty unlocked slots first"}
                    </div>
                  </div>
                </section>
              </div>

              {/* Pokemon selection */}
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
          </div>

          {/* ── Mobile empty state ──────────────────────────────────── */}
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

          {/* ── Capture guide (desktop, below the grid) ─────────────── */}
          {isDesktopScreen && (
            <section className="mt-4 hidden lg:block">
              <TeamCaptureGuide
                team={team}
                selectedVersionId={selectedVersionId}
                selectedVersionLabel={selectedVersionLabel}
              />
            </section>
          )}

          {/* ── Analysis sections ────────────────────────────────────── */}
          {shouldRenderAnalysis && (
            <Suspense fallback={null}>
              <section
                className={`mt-4 sm:mt-5 ${isAnalysisExiting ? "animate-scale-out" : "animate-section-reveal"}`}
                aria-label="Analysis overview"
              >
                <div className="panel-soft px-3.5 py-3">
                  <h2 className="font-display text-base sm:text-lg" style={{ color: "var(--text-primary)" }}>
                    Coverage Analysis
                  </h2>
                  <p className="mt-1 text-[0.7rem] sm:text-[0.74rem]" style={{ color: "var(--text-muted)" }}>
                    Defensive and offensive type matchups for your current team.
                  </p>
                </div>
              </section>

              <section className={`mt-4 sm:mt-5 ${isAnalysisExiting ? "animate-scale-out" : "animate-section-reveal"}`}>
                <TeamRecommendations
                  recommendations={recommendations}
                  exposedTypes={exposedTypeNames}
                  teamFull={currentTeam.length >= 6}
                  recommendationsEnabled={recommendationsEnabled}
                  onToggleRecommendations={setRecommendationsEnabled}
                  allowLegendaryMythicalRecommendations={allowLegendaryMythicalRecommendations}
                  onAllowLegendaryMythicalRecommendationsChange={setAllowLegendaryMythicalRecommendations}
                  allowStarterRecommendations={allowStarterRecommendations}
                  onAllowStarterRecommendationsChange={setAllowStarterRecommendations}
                  allowPostgameRecommendations={allowPostgameRecommendations}
                  onAllowPostgameRecommendationsChange={setAllowPostgameRecommendations}
                  onAddPokemon={addPokemonToTeam}
                  role={recommendationRole}
                  onRoleChange={setRecommendationRole}
                  onReplaceWeakest={handleReplaceWeakest}
                  canReplaceWeakest={canReplaceWeakest}
                  onReplaceTargeted={handleReplaceTargeted}
                  canReplaceTargeted={canReplaceTargeted}
                  replaceTargetLabel={
                    canReplaceTargeted && replaceTargetSlot !== null ? `slot ${replaceTargetSlot + 1}` : null
                  }
                />
              </section>

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
          </div>

          {isSelectedGameLoading && (
            <GameLoadingSkeleton
              overlay
              compact
              title={`Loading ${selectedGame.name}`}
              subtitle="Swapping game data, dex filters, and version-specific Pokemon pools."
            />
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

      <GameSwitchDialog
        isOpen={pendingGameSwitch !== null && hasPokemonInParty}
        targetGameName={games.find((g) => g.id === pendingGameSwitch)?.name ?? ""}
        onKeepTeam={handleGameSwitchKeepTeam}
        onStartFresh={handleGameSwitchStartFresh}
        onCancel={handleGameSwitchCancel}
      />

      <UnsavedTeamDialog
        isOpen={pendingUnsavedAction !== null}
        targetGameName={
          pendingUnsavedAction?.type === "switch"
            ? games.find((game) => game.id === pendingUnsavedAction.gameId)?.name
            : undefined
        }
        leavingBuilder={pendingUnsavedAction?.type === "leave"}
        canSave={isAuthenticated}
        isSaving={isSaving}
        errorMessage={unsavedDialogError}
        onSaveAndContinue={handleUnsavedSaveAndContinue}
        onContinueWithoutSaving={handleUnsavedContinueWithoutSaving}
        onCancel={handleUnsavedDialogCancel}
      />

      {hasMountedTeamTools && (
        <TeamToolsModal
          isOpen={isTeamToolsOpen}
          onClose={() => setIsTeamToolsOpen(false)}
          initialTab={teamToolsInitialTab}
          teamHasPokemon={currentTeam.length > 0}
          isAuthenticated={isAuthenticated}
          savedTeams={savedTeams}
          activeTeamId={activeTeamId}
          onSaveAs={saveTeamAs}
          onLoadSavedTeam={handleLoadSavedTeam}
          onOverwriteSavedTeam={overwriteSavedTeam}
          onDeleteSavedTeam={deleteSavedTeam}
          onRenameSavedTeam={renameSavedTeam}
          onRefreshSavedTeams={refreshSavedTeams}
          isSaving={isSaving}
          payload={sharePayload}
          onImport={queueImportPayload}
          gameVersions={selectedGame.versions}
          selectedVersionId={selectedVersionId}
          hapticsEnabled={settings.mobileHaptics}
          myTeam={team}
          generation={selectedGame.generation}
          gameId={selectedGame.id}
          pokemonPool={dexMode === "regional" && pokemonPools.regional.length > 0 ? pokemonPools.regional : pokemonPools.national}
          allPokemonPool={pokemonPools.national}
          teamCheckpoint={teamCheckpoint}
          onTeamCheckpointChange={setTeamCheckpoint}
        />
      )}

      {hasMountedAiCoach && (
        <AiCoachPanel
          isOpen={isAiCoachOpen}
          onClose={closeAiCoach}
          headerOffsetPx={headerOffsetPx}
          versionCssVars={versionCssVars}
          isAuthenticated={isAuthenticated}
          teamHasPokemon={currentTeam.length > 0}
          team={team}
          generation={generation}
          gameId={selectedGame.id}
          selectedVersionId={selectedVersionId}
          selectedVersionLabel={selectedVersionLabel}
          dexMode={dexMode}
          versionFilterEnabled={versionFilterEnabled}
          typeFilter={typeFilter}
          regionalDexName={pokemonPools.regionalDexName}
          allowedPokemonNames={aiAllowedPokemonNames}
          versionScopedPokemonPool={versionScopedPokemonPool}
          teamCheckpoint={teamCheckpoint}
          onTeamCheckpointChange={setTeamCheckpoint}
          activeTeamId={activeTeamId}
          boundTeamId={aiConversationTeamId}
          onBindTeamId={handleAiConversationTeamBound}
          hapticsEnabled={settings.mobileHaptics}
        />
      )}

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
          onRedo={handleRedo}
          canRedo={historyState.canRedo}
          onDismiss={dismissUndoToast}
        />
      )}

      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
      <OfflineBanner />
      {hasMountedCommandPalette && (
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={closeCommandPalette}
          allPokemon={activePokemonPool}
          onAddPokemon={addPokemonToTeam}
          currentTeamLength={team.filter(Boolean).length}
          onClearTeam={() => setIsClearDialogOpen(true)}
          onOpenTools={() => openTeamTools("saved")}
          onFocusSearch={() => document.getElementById("pokemon-search")?.focus()}
          onToggleAiCoach={toggleAiCoach}
        />
      )}

      {shouldMountOnboardingTour && <OnboardingTour userId={user?.id} />}

      {!isDesktopScreen && !isAiCoachOpen && (
        <MobileTeamSheet
          team={team}
          currentTeamLength={currentTeam.length}
          activeDropId={activeDropId}
          onRemove={removeFromTeam}
          dragEnabled={false}
          lockedSlots={lockedSlots}
          onToggleLock={toggleLockSlot}
          replaceMode={replaceMode}
          selectedReplaceSlot={replaceTargetSlot}
          onSelectReplaceSlot={setReplaceTargetSlot}
          onOpenTeamTools={() => openTeamTools("saved")}
          selectedVersionId={selectedVersionId}
          selectedVersionLabel={selectedVersionLabel}
          hapticsEnabled={settings.mobileHaptics}
        />
      )}
    </DndContext>
    </div>
    </ToastContext.Provider>
  );
};

export default TeamBuilder;
