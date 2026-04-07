import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchTeams, createTeam, updateTeam, deleteTeam } from "@/lib/api";
import { ALL_GAMES } from "@/lib/pokemon";
import { pokemonSpriteSrc } from "@/lib/image";
import {
  getTeamStorageKey,
  getTeamUpdatedAtStorageKey,
  getTeamCheckpointStorageKey,
  getTeamCheckpointVersionStorageKey,
} from "@/lib/storageKeys";
import type { SavedTeam, TeamStoryCheckpoint } from "@/lib/api";
import type { Pokemon } from "@/lib/types";

const DEBOUNCE_MS = 1000;
const MAX_TEAM_NAME_LENGTH = 80;

function createEmptyTeam(): (Pokemon | null)[] {
  return Array(6).fill(null);
}

function normalizePokemon(raw: unknown): Pokemon | null {
  if (!raw || typeof raw !== "object") return null;

  const candidate = raw as Partial<Pokemon>;
  if (
    typeof candidate.id !== "number" ||
    typeof candidate.name !== "string" ||
    !Array.isArray(candidate.types) ||
    typeof candidate.generation !== "number"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    types: candidate.types,
    generation: candidate.generation,
    isFinalEvolution: !!candidate.isFinalEvolution,
    hp: typeof candidate.hp === "number" ? candidate.hp : 0,
    attack: typeof candidate.attack === "number" ? candidate.attack : 0,
    defense: typeof candidate.defense === "number" ? candidate.defense : 0,
    specialAttack: typeof candidate.specialAttack === "number" ? candidate.specialAttack : 0,
    specialDefense: typeof candidate.specialDefense === "number" ? candidate.specialDefense : 0,
    speed: typeof candidate.speed === "number" ? candidate.speed : 0,
    sprite: pokemonSpriteSrc(candidate.sprite, candidate.id),
    gameIndexVersionIds: candidate.gameIndexVersionIds,
    exclusiveStatus: candidate.exclusiveStatus,
    exclusiveToVersionIds: candidate.exclusiveToVersionIds,
    evolutionStage:
      typeof candidate.evolutionStage === "number" && Number.isInteger(candidate.evolutionStage)
        ? candidate.evolutionStage
        : undefined,
    evolutionLine: Array.isArray(candidate.evolutionLine)
      ? candidate.evolutionLine.filter((name): name is string => typeof name === "string")
      : undefined,
  };
}

function normalizeTeam(raw: unknown): (Pokemon | null)[] {
  if (!Array.isArray(raw)) return createEmptyTeam();
  const normalized = raw.slice(0, 6).map((slot) => normalizePokemon(slot));
  while (normalized.length < 6) normalized.push(null);
  return normalized;
}

function loadLocalTeam(generation: number, gameId: number): (Pokemon | null)[] {
  try {
    const saved = localStorage.getItem(getTeamStorageKey(generation, gameId));
    if (!saved) return createEmptyTeam();
    return normalizeTeam(JSON.parse(saved));
  } catch {
    return createEmptyTeam();
  }
}

function saveLocalTeam(generation: number, gameId: number, team: (Pokemon | null)[]): void {
  try {
    localStorage.setItem(getTeamStorageKey(generation, gameId), JSON.stringify(team));
    localStorage.setItem(getTeamUpdatedAtStorageKey(generation, gameId), String(Date.now()));
  } catch {
    // ignore storage errors
  }
}

function normalizeCheckpoint(raw: unknown): TeamStoryCheckpoint | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<TeamStoryCheckpoint>;
  const bossName =
    typeof candidate.checkpointBossName === "string" && candidate.checkpointBossName.trim().length > 0
      ? candidate.checkpointBossName.trim()
      : null;
  const stage =
    candidate.checkpointStage === "gym" ||
    candidate.checkpointStage === "elite4" ||
    candidate.checkpointStage === "champion"
      ? candidate.checkpointStage
      : null;
  const gymOrder =
    typeof candidate.checkpointGymOrder === "number" && Number.isInteger(candidate.checkpointGymOrder)
      ? candidate.checkpointGymOrder
      : null;

  if (!bossName && !stage && !gymOrder) return null;
  return {
    checkpointBossName: bossName,
    checkpointStage: stage,
    checkpointGymOrder: gymOrder,
  };
}

function checkpointFromTeam(team: SavedTeam): TeamStoryCheckpoint | null {
  return normalizeCheckpoint({
    checkpointBossName: team.checkpointBossName ?? null,
    checkpointStage: team.checkpointStage ?? null,
    checkpointGymOrder: team.checkpointGymOrder ?? null,
  });
}

function loadLocalCheckpoint(
  generation: number,
  gameId: number,
  versionId?: string
): TeamStoryCheckpoint | null {
  try {
    // Prefer version-specific key; fall back to legacy game-level key
    const key = versionId
      ? getTeamCheckpointVersionStorageKey(generation, gameId, versionId)
      : getTeamCheckpointStorageKey(generation, gameId);
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    return normalizeCheckpoint(JSON.parse(saved));
  } catch {
    return null;
  }
}

function saveLocalCheckpoint(
  generation: number,
  gameId: number,
  checkpoint: TeamStoryCheckpoint | null,
  versionId?: string
): void {
  try {
    const key = versionId
      ? getTeamCheckpointVersionStorageKey(generation, gameId, versionId)
      : getTeamCheckpointStorageKey(generation, gameId);
    if (!checkpoint) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(checkpoint));
  } catch {
    // ignore storage errors
  }
}

function formatCombinedVersionTeamName(baseName: string, gameId: number, versionIds: string[]): string {
  const game = ALL_GAMES.find((entry) => entry.id === gameId);
  if (!game || versionIds.length <= 1) return baseName;

  const labels = versionIds
    .map((id) => game.versions.find((version) => version.id === id)?.label)
    .filter((label): label is string => Boolean(label));

  if (labels.length <= 1) return baseName;

  const suffix = ` (${labels.join("/")})`;
  const availableBaseLength = MAX_TEAM_NAME_LENGTH - suffix.length;
  if (availableBaseLength <= 0) {
    return suffix.slice(0, MAX_TEAM_NAME_LENGTH);
  }

  const trimmedBase = baseName.slice(0, availableBaseLength).trim();
  return `${trimmedBase}${suffix}`;
}

interface UseTeamPersistenceOptions {
  generation: number;
  gameId: number;
  selectedVersionId: string;
}

interface UseTeamPersistenceReturn {
  team: (Pokemon | null)[];
  setTeam: (team: (Pokemon | null)[]) => void;
  teamCheckpoint: TeamStoryCheckpoint | null;
  setTeamCheckpoint: (checkpoint: TeamStoryCheckpoint | null) => Promise<void>;
  savedTeams: SavedTeam[];
  activeTeamId: string | null;
  saveTeamAs: (name: string, versionIds?: string[]) => Promise<void>;
  overwriteSavedTeam: (teamId: string) => Promise<void>;
  loadSavedTeam: (teamId: string) => void;
  deleteSavedTeam: (teamId: string) => Promise<void>;
  renameSavedTeam: (teamId: string, name: string) => Promise<void>;
  isAuthenticated: boolean;
  isSaving: boolean;
  refreshSavedTeams: () => Promise<void>;
  carryTeamToGame: (targetGameId: number) => void;
  discardUnsavedDraft: () => void;
}

export function useTeamPersistence({
  generation,
  gameId,
  selectedVersionId,
}: UseTeamPersistenceOptions): UseTeamPersistenceReturn {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Keep initial state deterministic between SSR and client hydration.
  // Local data is loaded in an effect after mount.
  const [team, setTeamState] = useState<(Pokemon | null)[]>(createEmptyTeam);
  const [teamCheckpointState, setTeamCheckpointState] = useState<TeamStoryCheckpoint | null>(null);

  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTeamIdRef = useRef<string | null>(null);
  const initialLoadDoneRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    activeTeamIdRef.current = activeTeamId;
  }, [activeTeamId]);

  // When gameId changes, reload team from localStorage immediately
  useEffect(() => {
    setTeamState(loadLocalTeam(generation, gameId));
    setTeamCheckpointState(null); // cleared until selectedVersionId resolves
    initialLoadDoneRef.current = false;
  }, [generation, gameId]);

  // When selectedVersionId resolves or changes, load the version-specific checkpoint
  useEffect(() => {
    if (!selectedVersionId) return;
    setTeamCheckpointState(loadLocalCheckpoint(generation, gameId, selectedVersionId));
  }, [generation, gameId, selectedVersionId]);

  const refreshSavedTeams = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedTeams([]);
      return;
    }
    try {
      const teams = await fetchTeams(generation, gameId);
      setSavedTeams(teams);
    } catch {
      // silent fail
    }
  }, [isAuthenticated, generation, gameId]);

  // Load team data once auth resolves (for authenticated users, fetch from server)
  useEffect(() => {
    if (authLoading) return;

    // Only run the initial auth-based load once per game
    if (initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;

    if (!isAuthenticated) {
      // Guest: local team is handled by the gameId effect.
      // Just clear server-side state.
      setActiveTeamId(null);
      setSavedTeams([]);
      return;
    }

    // Authenticated: fetch saved teams and load the most recent
    let cancelled = false;
    (async () => {
      try {
        const teams = await fetchTeams(generation, gameId);
        if (cancelled) return;
        setSavedTeams(teams);

        const localDraft = loadLocalTeam(generation, gameId);
        const hasLocalDraft = localDraft.some((slot) => slot !== null);
        if (hasLocalDraft) {
          setTeamState(localDraft);
          setTeamCheckpointState(loadLocalCheckpoint(generation, gameId));
          setActiveTeamId(teams[0]?.id ?? null);
          return;
        }

        if (teams.length > 0) {
          const mostRecent = teams[0]; // already sorted by updatedAt desc
          setTeamState(normalizeTeam(mostRecent.pokemon));
          setTeamCheckpointState(checkpointFromTeam(mostRecent));
          setActiveTeamId(mostRecent.id);
        } else {
          setActiveTeamId(null);
          setTeamCheckpointState(null);
        }
      } catch {
        if (cancelled) return;
        setActiveTeamId(null);
        setTeamCheckpointState(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading, generation, gameId]);

  // Auto-save with debounce
  const debouncedSave = useCallback(
    (newTeam: (Pokemon | null)[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        const currentId = activeTeamIdRef.current;
        if (!isAuthenticated || !currentId) return;

        setIsSaving(true);
        try {
          await updateTeam(currentId, { pokemon: newTeam });
        } catch {
          // silent fail
        } finally {
          setIsSaving(false);
        }
      }, DEBOUNCE_MS);
    },
    [isAuthenticated]
  );

  const setTeam = useCallback(
    (newTeam: (Pokemon | null)[]) => {
      setTeamState(newTeam);

      if (!isAuthenticated) {
        saveLocalTeam(generation, gameId, newTeam);
        return;
      }

      // Always save to localStorage as backup
      saveLocalTeam(generation, gameId, newTeam);
      debouncedSave(newTeam);
    },
    [isAuthenticated, generation, gameId, debouncedSave]
  );

  const setTeamCheckpoint = useCallback(
    async (checkpoint: TeamStoryCheckpoint | null) => {
      setTeamCheckpointState(checkpoint);
      saveLocalCheckpoint(generation, gameId, checkpoint, selectedVersionId || undefined);

      if (!isAuthenticated) return;
      const currentId = activeTeamIdRef.current;
      if (!currentId) return;

      try {
        await updateTeam(currentId, {
          checkpointBossName: checkpoint?.checkpointBossName ?? null,
          checkpointStage: checkpoint?.checkpointStage ?? null,
          checkpointGymOrder: checkpoint?.checkpointGymOrder ?? null,
        });
        await refreshSavedTeams();
      } catch {
        // silent fail
      }
    },
    [generation, gameId, selectedVersionId, isAuthenticated, refreshSavedTeams]
  );

  const saveTeamAs = useCallback(
    async (name: string, versionIds?: string[]) => {
      if (!isAuthenticated) return;
      if (!team.some((slot) => slot !== null)) {
        throw new Error("Add at least one Pokemon before saving a team.");
      }

      setIsSaving(true);
      try {
        if (versionIds && versionIds.length > 1) {
          const saved = await createTeam({
            name: formatCombinedVersionTeamName(name, gameId, versionIds),
            generation,
            gameId,
            pokemon: team,
            selectedVersionId: null,
            checkpointBossName: teamCheckpointState?.checkpointBossName ?? null,
            checkpointStage: teamCheckpointState?.checkpointStage ?? null,
            checkpointGymOrder: teamCheckpointState?.checkpointGymOrder ?? null,
          });
          setActiveTeamId(saved.id);
          setTeamCheckpointState(checkpointFromTeam(saved));
        } else {
          const saved = await createTeam({
            name,
            generation,
            gameId,
            pokemon: team,
            selectedVersionId: versionIds?.[0],
            checkpointBossName: teamCheckpointState?.checkpointBossName ?? null,
            checkpointStage: teamCheckpointState?.checkpointStage ?? null,
            checkpointGymOrder: teamCheckpointState?.checkpointGymOrder ?? null,
          });
          setActiveTeamId(saved.id);
          setTeamCheckpointState(checkpointFromTeam(saved));
        }
        await refreshSavedTeams();
      } finally {
        setIsSaving(false);
      }
    },
    [isAuthenticated, generation, gameId, team, teamCheckpointState, refreshSavedTeams]
  );

  const overwriteSavedTeam = useCallback(
    async (teamId: string) => {
      if (!isAuthenticated) return;
      if (!team.some((slot) => slot !== null)) {
        throw new Error("Add at least one Pokemon before overwriting.");
      }

      setIsSaving(true);
      try {
        await updateTeam(teamId, {
          pokemon: team,
          checkpointBossName: teamCheckpointState?.checkpointBossName ?? null,
          checkpointStage: teamCheckpointState?.checkpointStage ?? null,
          checkpointGymOrder: teamCheckpointState?.checkpointGymOrder ?? null,
        });
        setActiveTeamId(teamId);
        await refreshSavedTeams();
      } finally {
        setIsSaving(false);
      }
    },
    [isAuthenticated, team, teamCheckpointState, refreshSavedTeams]
  );

  const loadSavedTeam = useCallback(
    (teamId: string) => {
      const found = savedTeams.find((t) => t.id === teamId);
      if (!found) return;
      setTeamState(normalizeTeam(found.pokemon));
      const checkpoint = checkpointFromTeam(found);
      setTeamCheckpointState(checkpoint);
      setActiveTeamId(found.id);
      saveLocalTeam(generation, gameId, normalizeTeam(found.pokemon));
      saveLocalCheckpoint(generation, gameId, checkpoint, selectedVersionId || undefined);
    },
    [savedTeams, generation, gameId, selectedVersionId]
  );

  const deleteSavedTeam = useCallback(
    async (teamId: string) => {
      if (!isAuthenticated) return;

      try {
        await deleteTeam(teamId);
        if (activeTeamId === teamId) {
          setActiveTeamId(null);
          setTeamState(createEmptyTeam());
          setTeamCheckpointState(null);
          saveLocalCheckpoint(generation, gameId, null, selectedVersionId || undefined);
        }
        await refreshSavedTeams();
      } catch {
        // silent fail
      }
    },
    [isAuthenticated, activeTeamId, generation, gameId, selectedVersionId, refreshSavedTeams]
  );

  const renameSavedTeam = useCallback(
    async (teamId: string, name: string) => {
      if (!isAuthenticated) return;

      setIsSaving(true);
      try {
        await updateTeam(teamId, { name });
        await refreshSavedTeams();
      } finally {
        setIsSaving(false);
      }
    },
    [isAuthenticated, refreshSavedTeams]
  );

  const carryTeamToGame = useCallback(
    (targetGameId: number) => {
      saveLocalTeam(generation, targetGameId, team);
    },
    [generation, team]
  );

  const discardUnsavedDraft = useCallback(() => {
    if (activeTeamIdRef.current) return;
    setTeamState(createEmptyTeam());
    setTeamCheckpointState(null);
    try {
      localStorage.removeItem(getTeamStorageKey(generation, gameId));
      localStorage.removeItem(getTeamUpdatedAtStorageKey(generation, gameId));
      localStorage.removeItem(getTeamCheckpointStorageKey(generation, gameId));
    } catch {
      // ignore storage errors
    }
  }, [gameId, generation]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    team,
    setTeam,
    teamCheckpoint: teamCheckpointState,
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
  };
}
