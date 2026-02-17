"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchTeams, createTeam, updateTeam, deleteTeam } from "@/lib/api";
import { getTeamStorageKey, getTeamUpdatedAtStorageKey } from "@/lib/storageKeys";
import type { SavedTeam } from "@/lib/api";
import type { Pokemon } from "@/lib/types";

const DEBOUNCE_MS = 1000;

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
    sprite: typeof candidate.sprite === "string" ? candidate.sprite : "",
    gameIndexVersionIds: candidate.gameIndexVersionIds,
    exclusiveStatus: candidate.exclusiveStatus,
    exclusiveToVersionIds: candidate.exclusiveToVersionIds,
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

interface UseTeamPersistenceOptions {
  generation: number;
  gameId: number;
}

interface UseTeamPersistenceReturn {
  team: (Pokemon | null)[];
  setTeam: (team: (Pokemon | null)[]) => void;
  savedTeams: SavedTeam[];
  activeTeamId: string | null;
  saveTeamAs: (name: string) => Promise<void>;
  loadSavedTeam: (teamId: string) => void;
  deleteSavedTeam: (teamId: string) => Promise<void>;
  renameSavedTeam: (teamId: string, name: string) => Promise<void>;
  isAuthenticated: boolean;
  isSaving: boolean;
  refreshSavedTeams: () => Promise<void>;
}

export function useTeamPersistence({
  generation,
  gameId,
}: UseTeamPersistenceOptions): UseTeamPersistenceReturn {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [team, setTeamState] = useState<(Pokemon | null)[]>(createEmptyTeam);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTeamIdRef = useRef<string | null>(null);
  const userModifiedRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    activeTeamIdRef.current = activeTeamId;
  }, [activeTeamId]);

  // Reset user-modified flag when game changes so the load effect can run normally
  useEffect(() => {
    userModifiedRef.current = false;
  }, [generation, gameId]);

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

  // Load initial team data
  useEffect(() => {
    if (authLoading) return;

    // If the user already modified the team while auth was loading,
    // don't overwrite their changes with stale data
    if (userModifiedRef.current) {
      userModifiedRef.current = false;
      if (!isAuthenticated) {
        setSavedTeams([]);
      } else {
        // Still fetch saved teams list for the sidebar, but don't overwrite the active team
        fetchTeams(generation, gameId).then(setSavedTeams).catch(() => {});
      }
      return;
    }

    if (!isAuthenticated) {
      // Guest: load from localStorage
      setTeamState(loadLocalTeam(generation, gameId));
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

        if (teams.length > 0) {
          const mostRecent = teams[0]; // already sorted by updatedAt desc
          setTeamState(normalizeTeam(mostRecent.pokemon));
          setActiveTeamId(mostRecent.id);
        } else {
          setTeamState(createEmptyTeam());
          setActiveTeamId(null);
        }
      } catch {
        if (cancelled) return;
        // Fall back to localStorage if API fails
        setTeamState(loadLocalTeam(generation, gameId));
        setActiveTeamId(null);
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
      userModifiedRef.current = true;
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

  const saveTeamAs = useCallback(
    async (name: string) => {
      if (!isAuthenticated) return;

      setIsSaving(true);
      try {
        const saved = await createTeam({
          name,
          generation,
          gameId,
          pokemon: team,
        });
        setActiveTeamId(saved.id);
        await refreshSavedTeams();
      } finally {
        setIsSaving(false);
      }
    },
    [isAuthenticated, generation, gameId, team, refreshSavedTeams]
  );

  const loadSavedTeam = useCallback(
    (teamId: string) => {
      const found = savedTeams.find((t) => t.id === teamId);
      if (!found) return;
      setTeamState(normalizeTeam(found.pokemon));
      setActiveTeamId(found.id);
      saveLocalTeam(generation, gameId, normalizeTeam(found.pokemon));
    },
    [savedTeams, generation, gameId]
  );

  const deleteSavedTeam = useCallback(
    async (teamId: string) => {
      if (!isAuthenticated) return;

      try {
        await deleteTeam(teamId);
        if (activeTeamId === teamId) {
          setActiveTeamId(null);
          setTeamState(createEmptyTeam());
        }
        await refreshSavedTeams();
      } catch {
        // silent fail
      }
    },
    [isAuthenticated, activeTeamId, refreshSavedTeams]
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

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    team,
    setTeam,
    savedTeams,
    activeTeamId,
    saveTeamAs,
    loadSavedTeam,
    deleteSavedTeam,
    renameSavedTeam,
    isAuthenticated,
    isSaving,
    refreshSavedTeams,
  };
}
