import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { fetchAiBossGuidance, type AiBossGuidanceEntry, type TeamStoryCheckpoint } from "@/lib/api";
import {
  checkpointKey,
  checkpointLabel,
  normalizeSpeciesName,
  estimateCheckpointCatchables,
  type CheckpointLegality,
} from "./aiMessageParser";
import type { Pokemon } from "@/lib/types";

export const AUTO_CHECKPOINT_KEY = "auto";

export interface CheckpointOption {
  key: string;
  entry: AiBossGuidanceEntry;
  label: string;
}

interface UseAiCheckpointOptions {
  isOpen: boolean;
  isAuthenticated: boolean;
  selectedVersionId: string;
  teamCheckpoint: TeamStoryCheckpoint | null;
  onTeamCheckpointChange: (checkpoint: TeamStoryCheckpoint | null) => Promise<void>;
  versionScopedPokemonPool: Pokemon[];
  onError: (message: string) => void;
  /** When false, do not clear checkpoint when no boss-guidance match (e.g. Battle Planner local-only mode) */
  persistCheckpoint?: boolean;
}

export interface UseAiCheckpointReturn {
  bossGuidance: AiBossGuidanceEntry[];
  bossGuidanceLoading: boolean;
  checkpointOptions: CheckpointOption[];
  selectedCheckpoint: AiBossGuidanceEntry | null;
  checkpointPendingLabel: string | null;
  checkpointCatchables: CheckpointLegality;
  checkpointKeySelection: string;
  checkpointDropdownOpen: boolean;
  checkpointDropdownRef: React.RefObject<HTMLDivElement | null>;
  setCheckpointDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleCheckpointSelection: (nextKey: string) => Promise<void>;
}

export function useAiCheckpoint({
  isOpen,
  isAuthenticated,
  selectedVersionId,
  teamCheckpoint,
  onTeamCheckpointChange,
  versionScopedPokemonPool,
  onError,
  persistCheckpoint = true,
}: UseAiCheckpointOptions): UseAiCheckpointReturn {
  const [bossGuidance, setBossGuidance] = useState<AiBossGuidanceEntry[]>([]);
  const [bossGuidanceLoading, setBossGuidanceLoading] = useState(false);
  const [checkpointKeySelection, setCheckpointKeySelection] = useState<string>(AUTO_CHECKPOINT_KEY);
  const [checkpointDropdownOpen, setCheckpointDropdownOpen] = useState(false);
  const checkpointDropdownRef = useRef<HTMLDivElement | null>(null);

  // Fetch boss guidance when panel opens or version changes
  useEffect(() => {
    if (!isOpen || !isAuthenticated || !selectedVersionId) {
      setBossGuidance([]);
      setBossGuidanceLoading(false);
      return;
    }

    // Clear immediately so stale data from the previous version never lingers
    setBossGuidance([]);
    let cancelled = false;
    setBossGuidanceLoading(true);

    fetchAiBossGuidance(selectedVersionId)
      .then((result) => {
        if (cancelled) return;
        setBossGuidance(Array.isArray(result.bossGuidance) ? result.bossGuidance : []);
      })
      .catch(() => {
        if (cancelled) return;
        setBossGuidance([]);
      })
      .finally(() => {
        if (!cancelled) setBossGuidanceLoading(false);
      });

    return () => { cancelled = true; };
  }, [isAuthenticated, isOpen, selectedVersionId]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!checkpointDropdownOpen) return;
    const onClick = (e: MouseEvent) => {
      if (checkpointDropdownRef.current && !checkpointDropdownRef.current.contains(e.target as Node)) {
        setCheckpointDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [checkpointDropdownOpen]);

  const checkpointOptions = useMemo(
    () =>
      bossGuidance.map((entry) => ({
        key: checkpointKey(entry),
        entry,
        label: checkpointLabel(entry),
      })),
    [bossGuidance]
  );

  const selectedCheckpoint = useMemo(() => {
    if (checkpointKeySelection === AUTO_CHECKPOINT_KEY) return null;
    const match = checkpointOptions.find((option) => option.key === checkpointKeySelection);
    return match?.entry ?? null;
  }, [checkpointKeySelection, checkpointOptions]);

  // While boss guidance hasn't loaded yet, derive a display label directly from
  // the stored teamCheckpoint so the button never flashes "Auto" between renders.
  const checkpointPendingLabel = useMemo(() => {
    if (!teamCheckpoint || checkpointOptions.length > 0) return null;
    const { checkpointStage: stage, checkpointBossName: name, checkpointGymOrder: gymOrder } = teamCheckpoint;
    if (!stage || !name) return null;
    if (stage === "gym") return `Gym ${gymOrder ?? "?"} · ${name}`;
    if (stage === "elite4") return `Elite Four · ${name}`;
    return `Champion · ${name}`;
  }, [teamCheckpoint, checkpointOptions]);

  const checkpointCatchables = useMemo(
    () =>
      estimateCheckpointCatchables({
        checkpoint: selectedCheckpoint,
        orderedPokemonPool: versionScopedPokemonPool,
      }),
    [selectedCheckpoint, versionScopedPokemonPool]
  );

  // Sync checkpointKeySelection with stored teamCheckpoint whenever options or version change
  useEffect(() => {
    if (!teamCheckpoint) {
      setCheckpointKeySelection(AUTO_CHECKPOINT_KEY);
      return;
    }

    // Wait until boss guidance has loaded before trying to match
    if (bossGuidanceLoading) return;

    const normalizedBossName = normalizeSpeciesName(teamCheckpoint.checkpointBossName ?? "");
    const matchingOption = checkpointOptions.find((option) => {
      const sameStage = option.entry.stage === teamCheckpoint.checkpointStage;
      const sameGymOrder = (option.entry.gymOrder ?? null) === (teamCheckpoint.checkpointGymOrder ?? null);
      const sameName = normalizeSpeciesName(option.entry.name) === normalizedBossName;
      return sameStage && sameGymOrder && sameName;
    });

    if (matchingOption) {
      setCheckpointKeySelection(matchingOption.key);
      return;
    }

    // No match — clear stale checkpoint. Only clear when we actually have boss data
    // loaded; if checkpointOptions is empty the panel is closed/unfetched and calling
    // onTeamCheckpointChange(null) would destroy a valid checkpoint in localStorage.
    // When persistCheckpoint is false (e.g. Battle Planner), do not clear so local preset stays.
    setCheckpointKeySelection(AUTO_CHECKPOINT_KEY);
    if (checkpointOptions.length > 0 && persistCheckpoint) {
      void onTeamCheckpointChange(null);
    }
  }, [checkpointOptions, selectedVersionId, teamCheckpoint, bossGuidanceLoading, onTeamCheckpointChange, persistCheckpoint]);

  const handleCheckpointSelection = useCallback(
    async (nextKey: string) => {
      try {
        setCheckpointKeySelection(nextKey);
        if (nextKey === AUTO_CHECKPOINT_KEY) {
          await onTeamCheckpointChange(null);
          return;
        }
        const selected = checkpointOptions.find((option) => option.key === nextKey);
        if (!selected) {
          await onTeamCheckpointChange(null);
          return;
        }
        await onTeamCheckpointChange({
          checkpointBossName: selected.entry.name,
          checkpointStage: selected.entry.stage,
          checkpointGymOrder: selected.entry.gymOrder ?? null,
        });
      } catch {
        onError("Could not save checkpoint right now.");
      }
    },
    [checkpointOptions, onTeamCheckpointChange, onError]
  );

  return {
    bossGuidance,
    bossGuidanceLoading,
    checkpointOptions,
    selectedCheckpoint,
    checkpointPendingLabel,
    checkpointCatchables,
    checkpointKeySelection,
    checkpointDropdownOpen,
    checkpointDropdownRef,
    setCheckpointDropdownOpen,
    handleCheckpointSelection,
  };
}
