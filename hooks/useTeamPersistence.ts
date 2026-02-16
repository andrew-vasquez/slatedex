"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchTeams, createTeam, updateTeam, deleteTeam } from "@/lib/api";
import type { SavedTeam } from "@/lib/api";
import type { Pokemon } from "@/lib/types";

const STORAGE_VERSION = 1;
const DEBOUNCE_MS = 1000;

function getStorageKey(generation: number, gameId: number): string {
  return `team_gen_${generation}_game_${gameId}_v${STORAGE_VERSION}`;
}

function createEmptyTeam(): (Pokemon | null)[] {
  return Array(6).fill(null);
}

function loadLocalTeam(generation: number, gameId: number): (Pokemon | null)[] {
  try {
    const saved = localStorage.getItem(getStorageKey(generation, gameId));
    if (!saved) return createEmptyTeam();
    const parsed = JSON.parse(saved) as (Pokemon | null)[];
    if (Array.isArray(parsed) && parsed.length === 6) return parsed;
    return createEmptyTeam();
  } catch {
    return createEmptyTeam();
  }
}

function saveLocalTeam(generation: number, gameId: number, team: (Pokemon | null)[]): void {
  try {
    localStorage.setItem(getStorageKey(generation, gameId), JSON.stringify(team));
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

  // Keep ref in sync
  useEffect(() => {
    activeTeamIdRef.current = activeTeamId;
  }, [activeTeamId]);

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
          setTeamState(mostRecent.pokemon);
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
      setTeamState(found.pokemon);
      setActiveTeamId(found.id);
      saveLocalTeam(generation, gameId, found.pokemon);
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
