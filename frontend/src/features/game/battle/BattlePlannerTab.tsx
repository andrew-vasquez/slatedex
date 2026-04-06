"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "~/components/ui/AppImage";
import { FiPlay, FiSave, FiAlertCircle, FiArrowRight } from "react-icons/fi";
import type { BattleCheckpoint, BattlePlannerResult, BattleRealismMode, BossPreset, Pokemon } from "@/lib/types";
import { ApiError, type SavedOpponentTeam, type TeamStoryCheckpoint } from "@/lib/api";
import {
  fetchBattlePresets,
  analyzeBattleMatchups,
  fetchOpponentTeams,
  createOpponentTeam,
  deleteOpponentTeam,
  updateOpponentTeam,
} from "@/lib/api";
import { useToastContext } from "~/features/game/hooks/useToast";
import { pokemonSpriteSrc } from "@/lib/image";
import { getPokemonFirstGym } from "@/lib/pokemonAvailability";
import {
  getMaxStageForLevel,
  getEvolutionLevelCapForGym,
  getMaxStageForCheckpointWithStones,
} from "@/lib/evolutionLevels";
import InfoTooltip from "@/components/ui/InfoTooltip";
import OpponentSourceSwitch, { type OpponentSourceMode } from "./OpponentSourceSwitch";
import BossPresetPicker from "./BossPresetPicker";
import OpponentTeamEditor from "./OpponentTeamEditor";
import SavedOpponentTeamsPanel from "./SavedOpponentTeamsPanel";
import MatchupMatrix from "./MatchupMatrix";
import MatchupAssignments from "./MatchupAssignments";

const DRAFT_KEY = "battle_planner_draft_v2";
const EMPTY_SLOTS: (Pokemon | null)[] = [null, null, null, null, null, null];
const GYM_ORDERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** Only Emerald, Ruby, and Sapphire have curated gym/Elite Four presets ready. */
const PRESETS_READY_GAME_ID = 3;

type ResultsView = "assignments" | "matrix";
type ManualStage = "none" | "gym" | "elite4" | "champion";

interface BattlePlannerTabProps {
  myTeam: (Pokemon | null)[];
  generation: number;
  gameId: number;
  selectedVersionId: string | null;
  isAuthenticated: boolean;
  pokemonPool: Pokemon[];
  allPokemonPool?: Pokemon[];
  teamCheckpoint?: TeamStoryCheckpoint | null;
  onTeamCheckpointChange?: (checkpoint: TeamStoryCheckpoint | null) => Promise<void>;
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function normalizeSpeciesName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function getCheckpointMaxEvolutionStage(checkpoint: BattleCheckpoint | null): number {
  if (!checkpoint?.stage) return 3;
  if (checkpoint.stage === "elite4" || checkpoint.stage === "champion") return 3;
  const order = checkpoint.gymOrder ?? 4;
  if (order <= 1) return 1;  // Gym 1: base forms only
  if (order <= 4) return 2;  // Gyms 2–4: max stage 2 (aligns with backend)
  return 3;                  // Gyms 5–8: final evolutions allowed
}

/**
 * Per-Pokemon max evolution stage at a checkpoint.
 * Uses level-aware evolution data when available; for RSE, also considers stone availability
 * (e.g. Ludicolo/Shiftry only when Water/Leaf Stone is obtainable).
 * Uses conservative level (range min) so we don't assume player has max-level Pokemon.
 */
function getMaxStageForCheckpoint(
  pokemon: Pokemon,
  checkpoint: BattleCheckpoint | null,
  lookupPool: Pokemon[],
  gameId: number
): number {
  const fallback = getCheckpointMaxEvolutionStage(checkpoint);
  if (!checkpoint?.stage || checkpoint.stage === "elite4" || checkpoint.stage === "champion") {
    return fallback;
  }
  const order = checkpoint.gymOrder ?? 4;
  const levelCap = getEvolutionLevelCapForGym(order);
  const line = resolveEvolutionLine(pokemon, lookupPool);
  const baseName = line[0];
  if (!baseName) return fallback;
  // Stone-aware logic for RSE (gameId 3)
  const stoneBased = getMaxStageForCheckpointWithStones(baseName, levelCap, gameId, order);
  if (stoneBased !== null) return stoneBased;
  const levelBased = getMaxStageForLevel(baseName, levelCap);
  return levelBased ?? fallback;
}

function withNormalizedEvolutionStage(pokemon: Pokemon): Pokemon {
  const line = Array.isArray(pokemon.evolutionLine)
    ? pokemon.evolutionLine.map(normalizeSpeciesName).filter(Boolean)
    : [];
  if (line.length === 0) return pokemon;
  const current = normalizeSpeciesName(pokemon.name);
  const index = line.indexOf(current);
  const stage = index >= 0 ? index + 1 : pokemon.evolutionStage ?? line.length;
  return { ...pokemon, evolutionStage: stage, isFinalEvolution: stage >= line.length };
}

/**
 * Resolve the full evolution line for a Pokémon.
 * First checks the Pokémon's own `evolutionLine` field.
 * If missing or empty, cross-references the pool to find any Pokémon whose
 * evolutionLine includes this Pokémon — giving us the full chain.
 */
function resolveEvolutionLine(pokemon: Pokemon, lookupPool: Pokemon[]): string[] {
  const ownLine = Array.isArray(pokemon.evolutionLine)
    ? pokemon.evolutionLine.map(normalizeSpeciesName).filter(Boolean)
    : [];
  if (ownLine.length > 0) return ownLine;

  const currentName = normalizeSpeciesName(pokemon.name);
  for (const candidate of lookupPool) {
    const candLine = Array.isArray(candidate.evolutionLine)
      ? candidate.evolutionLine.map(normalizeSpeciesName).filter(Boolean)
      : [];
    if (candLine.length > 1 && candLine.includes(currentName)) {
      return candLine;
    }
  }
  return [];
}

type CoercedStatus =
  | { status: "ok" }
  | { status: "downgraded"; from: string; to: string }
  | { status: "unavailable"; name: string };

function coercePokemonToCheckpointForm(
  pokemon: Pokemon | null,
  checkpoint: BattleCheckpoint | null,
  lookupPool: Pokemon[],
  gameId: number
): Pokemon | null {
  if (!pokemon) return null;
  const maxStage = getMaxStageForCheckpoint(pokemon, checkpoint, lookupPool, gameId);
  const line = resolveEvolutionLine(pokemon, lookupPool);

  if (line.length === 0) return withNormalizedEvolutionStage(pokemon);

  const currentName = normalizeSpeciesName(pokemon.name);
  const currentIndex = line.indexOf(currentName);
  const currentStage = currentIndex >= 0 ? currentIndex + 1 : pokemon.evolutionStage ?? line.length;
  const stageIndexCap = Math.min(maxStage - 1, line.length - 1);

  // Upgrade: if under-evolved for this checkpoint, show highest allowed form (e.g. Kirlia → Gardevoir at gym 6)
  if (currentStage < stageIndexCap + 1) {
    const targetIndex = stageIndexCap;
    const targetName = line[targetIndex];
    const match = lookupPool.find(
      (candidate) => normalizeSpeciesName(candidate.name) === targetName
    );
    if (match) return withNormalizedEvolutionStage(match);
  }

  if (currentStage <= stageIndexCap + 1) return withNormalizedEvolutionStage(pokemon);

  // Downgrade: try to find an earlier form, from cap down to base
  for (let i = stageIndexCap; i >= 0; i--) {
    const targetName = line[i];
    const match = lookupPool.find(
      (candidate) => normalizeSpeciesName(candidate.name) === targetName
    );
    if (match) return withNormalizedEvolutionStage(match);
  }

  // Earlier form not in pool — return original unchanged
  return withNormalizedEvolutionStage(pokemon);
}

function checkpointLabel(checkpoint: BattleCheckpoint | null): string {
  if (!checkpoint?.stage) return "No checkpoint";
  if (checkpoint.stage === "elite4") return "Elite Four";
  if (checkpoint.stage === "champion") return "Champion";
  return `Gym ${checkpoint.gymOrder ?? "?"}`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function BattlePlannerTab({
  myTeam,
  generation,
  gameId,
  selectedVersionId,
  isAuthenticated,
  pokemonPool,
  allPokemonPool = [],
}: BattlePlannerTabProps) {
  const toastCtx = useToastContext();

  // Source
  const [sourceMode, setSourceMode] = useState<OpponentSourceMode>("preset");

  // Preset
  const [presets, setPresets] = useState<BossPreset[]>([]);
  const [presetsSupported, setPresetsSupported] = useState(true);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<BossPreset | null>(null);

  // Manual mode
  const [opponentSlots, setOpponentSlots] = useState<(Pokemon | null)[]>(EMPTY_SLOTS);
  const [opponentName, setOpponentName] = useState("");
  const [manualStage, setManualStage] = useState<ManualStage>("none");
  const [manualGymOrder, setManualGymOrder] = useState(1);

  // Saved
  const [savedTeams, setSavedTeams] = useState<SavedOpponentTeam[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  // Realism
  const [realismMode, setRealismMode] = useState<BattleRealismMode>("sandbox");

  // Results
  const [result, setResult] = useState<BattlePlannerResult | null>(null);
  const [resultsView, setResultsView] = useState<ResultsView>("assignments");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analysisMyTeam, setAnalysisMyTeam] = useState<(Pokemon | null)[]>(myTeam);
  const [analysisOpponentTeam, setAnalysisOpponentTeam] = useState<(Pokemon | null)[]>(EMPTY_SLOTS);
  const [analysisRealism, setAnalysisRealism] = useState<BattlePlannerResult["realism"] | null>(null);

  // Save
  const [isSaving, setIsSaving] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  const liveRef = useRef<HTMLParagraphElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const announce = (msg: string) => {
    if (liveRef.current) liveRef.current.textContent = msg;
  };

  const scrollToResults = useCallback(() => {
    if (!resultsRef.current) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultsRef.current.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  // ── Lookup pool (all Pokémon, including pre-evolutions) ──────────────────────
  const lookupPool = useMemo(
    () => (allPokemonPool.length > 0 ? allPokemonPool : pokemonPool),
    [allPokemonPool, pokemonPool]
  );

  // ── Derived checkpoint — NEVER touches the parent story checkpoint ───────────
  const activeCheckpoint = useMemo((): BattleCheckpoint | null => {
    if (sourceMode === "preset" && selectedPreset) {
      return {
        bossName: selectedPreset.name,
        stage: selectedPreset.stage,
        gymOrder: selectedPreset.gymOrder ?? null,
      };
    }
    if (sourceMode !== "preset" && manualStage !== "none") {
      return {
        bossName: null,
        stage: manualStage,
        gymOrder: manualStage === "gym" ? manualGymOrder : null,
      };
    }
    return null;
  }, [sourceMode, selectedPreset, manualStage, manualGymOrder]);

  // ── Effective opponent slots ─────────────────────────────────────────────────
  const effectiveOpponentSlots = useMemo((): (Pokemon | null)[] => {
    if (sourceMode === "preset" && selectedPreset) {
      return EMPTY_SLOTS.map((_, i) => {
        const pokemonId = selectedPreset.rosterPokemonIds[i];
        if (!pokemonId) return null;
        return lookupPool.find((p) => p.id === pokemonId) ?? null;
      });
    }
    return opponentSlots;
  }, [sourceMode, selectedPreset, opponentSlots, lookupPool]);

  // ── Coerced my-team preview (what your team looks like at this story point) ──
  const coercedMyTeam = useMemo((): (Pokemon | null)[] => {
    if (!activeCheckpoint) return myTeam;
    return myTeam.map((slot) =>
      coercePokemonToCheckpointForm(slot, activeCheckpoint, lookupPool, gameId)
    );
  }, [myTeam, activeCheckpoint, lookupPool, gameId]);

  // Richer per-slot coercion status: ok / downgraded / unavailable
  const coercedStatuses = useMemo((): (CoercedStatus | null)[] => {
    if (!activeCheckpoint) return myTeam.map(() => null);
    const gymOrder = activeCheckpoint.gymOrder; // null for elite4/champion — skip availability

    return myTeam.map((original, i) => {
      if (!original) return null;
      const maxStage = getMaxStageForCheckpoint(original, activeCheckpoint, lookupPool, gameId);
      const coerced = coercedMyTeam[i];
      const line = resolveEvolutionLine(original, lookupPool);
      const currentName = normalizeSpeciesName(original.name);
      const currentIndex = line.length > 0 ? line.indexOf(currentName) : -1;
      const currentStage =
        currentIndex >= 0 ? currentIndex + 1 : original.evolutionStage ?? 1;
      const stageIndexCap = Math.min(maxStage - 1, Math.max(0, line.length - 1));

      const evolutionOk = line.length === 0 || currentStage <= stageIndexCap + 1;

      // The Pokémon that would actually be used (original if no coercion needed,
      // otherwise the coerced earlier form).
      const effectivePokemon = evolutionOk ? original : coerced;

      // ── Game-specific availability check (gym checkpoints only) ──────────
      if (gymOrder !== null && effectivePokemon) {
        const firstGym = getPokemonFirstGym(selectedVersionId, effectivePokemon.id);
        if (firstGym > gymOrder) {
          return { status: "unavailable", name: original.name };
        }
      }

      if (evolutionOk) return { status: "ok" };

      // Needs evolution coercion — did we find an earlier form?
      if (!coerced || normalizeSpeciesName(coerced.name) === currentName) {
        return { status: "unavailable", name: original.name };
      }
      return { status: "downgraded", from: original.name, to: coerced.name };
    });
  }, [myTeam, coercedMyTeam, activeCheckpoint, lookupPool, selectedVersionId, gameId]);

  const hasAnyCoercion = coercedStatuses.some((s) => s && s.status !== "ok");

  const opponentLabel =
    sourceMode === "preset" && selectedPreset
      ? selectedPreset.name
      : opponentName.trim() || null;

  // ── Preset loading ────────────────────────────────────────────────────────────
  useEffect(() => {
    setPresetsLoading(true);
    fetchBattlePresets(gameId, selectedVersionId)
      .then((data) => {
        setPresets(data.presets);
        setPresetsSupported(data.supported);
      })
      .catch(() => {
        setPresets([]);
        setPresetsSupported(false);
        toastCtx.error("Could not load boss presets. Use Manual mode to build a custom opponent.");
      })
      .finally(() => setPresetsLoading(false));
  }, [gameId, selectedVersionId, toastCtx]);

  // When presets are not supported (or failed to load), auto-switch to Manual so users
  // can still build custom opponent teams instead of seeing "coming soon".
  useEffect(() => {
    if (!presetsLoading && !presetsSupported && sourceMode === "preset") {
      setSourceMode("manual");
    }
  }, [presetsLoading, presetsSupported, sourceMode]);

  // Clear preset selection when switching to a game that doesn't have presets ready yet
  useEffect(() => {
    if (gameId !== PRESETS_READY_GAME_ID && selectedPreset) {
      setSelectedPreset(null);
    }
  }, [gameId, selectedPreset]);

  // ── Saved teams loading ───────────────────────────────────────────────────────
  const loadSavedTeams = useCallback(async () => {
    if (!isAuthenticated) return;
    setSavedLoading(true);
    try {
      const teams = await fetchOpponentTeams(gameId, generation);
      setSavedTeams(teams);
    } catch {
      toastCtx.error("Failed to load saved opponent teams");
    } finally {
      setSavedLoading(false);
    }
  }, [gameId, generation, isAuthenticated, toastCtx]);

  useEffect(() => {
    if (sourceMode === "saved") loadSavedTeams();
  }, [sourceMode, loadSavedTeams]);

  // ── Draft persistence ─────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.gameId === gameId) {
          setOpponentSlots(parsed.slots ?? EMPTY_SLOTS);
          setOpponentName(parsed.name ?? "");
          setRealismMode(parsed.realismMode === "strict" ? "strict" : "sandbox");
        }
      }
    } catch { /* ignore */ }
  }, [gameId]);

  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ gameId, slots: opponentSlots, name: opponentName, realismMode })
      );
    } catch { /* ignore */ }
  }, [gameId, opponentSlots, opponentName, realismMode]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handlePresetSelect = (preset: BossPreset) => {
    setSelectedPreset(preset);
    setResult(null);
    setAnalysisRealism(null);
    setAnalyzeError(null);
  };

  const handleLoadSavedTeam = (team: SavedOpponentTeam) => {
    const raw = team.pokemon as (Record<string, unknown> | null)[];
    const slots: (Pokemon | null)[] = Array.from({ length: 6 }, (_, i) => {
      const p = raw[i];
      if (!p) return null;
      return p as unknown as Pokemon;
    });
    setOpponentSlots(slots);
    setOpponentName(team.name);
    setSourceMode("manual");
    setResult(null);
    setAnalysisRealism(null);
  };

  const handleAnalyze = async () => {
    const hasMyPokemon = myTeam.some((p) => p !== null);
    const hasOppPokemon = effectiveOpponentSlots.some((p) => p !== null);

    if (!hasMyPokemon) {
      toastCtx.error("Add Pokémon to your team first.");
      return;
    }
    if (!hasOppPokemon) {
      toastCtx.error("Add at least one opponent Pokémon.");
      return;
    }

    setAnalyzing(true);
    setAnalyzeError(null);
    setResult(null);
    setAnalysisRealism(null);

    // Strict: downgrade your team to checkpoint-appropriate forms before sending,
    // and null out any Pokémon that aren't obtainable yet at this game point.
    // Sandbox: send your actual team as-is; backend scores realism as a penalty.
    const normalizedMyTeam =
      realismMode === "strict" && activeCheckpoint
        ? myTeam.map((slot) => {
            const coerced = coercePokemonToCheckpointForm(slot, activeCheckpoint, lookupPool, gameId);
            if (!coerced) return null;
            // Exclude Pokémon unavailable at this gym checkpoint for the selected version
            const gymOrder = activeCheckpoint.gymOrder;
            if (gymOrder !== null && selectedVersionId) {
              const firstGym = getPokemonFirstGym(selectedVersionId, coerced.id);
              if (firstGym > gymOrder) return null;
            }
            return coerced;
          })
        : myTeam.map((slot) => (slot ? withNormalizedEvolutionStage(slot) : null));
    const normalizedOpponentTeam = effectiveOpponentSlots.map((slot) =>
      slot ? withNormalizedEvolutionStage(slot) : null
    );
    setAnalysisMyTeam(normalizedMyTeam);
    setAnalysisOpponentTeam(normalizedOpponentTeam);

    try {
      const data = await analyzeBattleMatchups({
        myTeam: normalizedMyTeam,
        opponentTeam: normalizedOpponentTeam,
        checkpoint: activeCheckpoint,
        realismMode,
        gameId,
        selectedVersionId,
        presetBossKey: sourceMode === "preset" && selectedPreset ? selectedPreset.key : null,
      });
      setResult(data);
      setAnalysisRealism(data.realism);
      setResultsView("assignments");
      announce("Analysis complete.");
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToResults()));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed.";
      if (err instanceof ApiError) {
        const data = err.data as { realism?: BattlePlannerResult["realism"] } | null;
        if (data?.realism) setAnalysisRealism(data.realism);
      }
      setAnalyzeError(msg);
      toastCtx.error("Analysis failed");
      announce(`Analysis failed: ${msg}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    const name = saveNameInput.trim() || opponentLabel || "";
    if (!name) {
      toastCtx.error("Enter a name for this opponent team.");
      return;
    }
    if (!effectiveOpponentSlots.some((p) => p !== null)) {
      toastCtx.error("Add at least one opponent Pokémon before saving.");
      return;
    }
    setIsSaving(true);
    try {
      await createOpponentTeam({
        name,
        generation,
        gameId,
        selectedVersionId,
        pokemon: effectiveOpponentSlots,
        source: sourceMode === "preset" ? "PRESET" : "MANUAL",
        presetBossKey: sourceMode === "preset" ? (selectedPreset?.key ?? null) : null,
        checkpoint: activeCheckpoint,
        realismMode,
      });
      toastCtx.success("Opponent team saved!");
      setShowSaveForm(false);
      setSaveNameInput("");
      if (isAuthenticated) loadSavedTeams();
    } catch {
      toastCtx.error("Failed to save opponent team.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    await deleteOpponentTeam(id);
    setSavedTeams((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRenameSaved = async (id: string, name: string) => {
    await updateOpponentTeam(id, { name });
    setSavedTeams((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  };

  const hasOppPokemon = effectiveOpponentSlots.some((p) => p !== null);
  const hasMyPokemon = myTeam.some((p) => p !== null);
  const canAnalyze = hasMyPokemon && hasOppPokemon && !analyzing;

  const cpLabel = checkpointLabel(activeCheckpoint);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 min-w-0">
      <p ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />

      {/* ── 1. Source tabs ── */}
      <OpponentSourceSwitch
        value={sourceMode}
        onChange={(mode) => {
          setSourceMode(mode);
          setResult(null);
          setAnalyzeError(null);
        }}
        isAuthenticated={isAuthenticated}
      />

      {/* ── 2. Opponent builder ── */}
      <div
        className="rounded-xl p-3"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        {sourceMode === "preset" && (
          <BossPresetPicker
            presets={presets}
            supported={presetsSupported && gameId === PRESETS_READY_GAME_ID}
            selectedKey={selectedPreset?.key ?? null}
            onSelect={handlePresetSelect}
            isLoading={presetsLoading}
            onSwitchToManual={() => {
              setSourceMode("manual");
              setResult(null);
              setAnalyzeError(null);
            }}
            comingSoonMessage={
              gameId !== PRESETS_READY_GAME_ID
                ? "Battle planner for this game is in the works and will be added in the future."
                : undefined
            }
          />
        )}

        {sourceMode === "manual" && (
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
                Opponent name (optional)
              </label>
              <input
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder="e.g. Misty, Elite Four Blue..."
                className="auth-input !py-1.5 !text-sm"
                maxLength={80}
              />
            </div>
            <OpponentTeamEditor
              slots={opponentSlots}
              onSlotsChange={(slots) => {
                setOpponentSlots(slots);
                setResult(null);
              }}
              pokemonPool={pokemonPool}
            />

            {/* Manual checkpoint picker */}
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <InfoTooltip
                  label={<span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Story point (optional)</span>}
                  description="When in the game the battle would occur (e.g. Gym 4, Elite Four). Affects level caps and evolution stages in Strict mode."
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(["none", "elite4", "champion"] as ManualStage[]).map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setManualStage(stage)}
                    className="rounded-full px-3 py-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[0.65rem] sm:text-[0.68rem] font-semibold transition-colors duration-150"
                    style={{
                      background: manualStage === stage ? "var(--version-color-soft, var(--accent-soft))" : "var(--surface-3)",
                      border: manualStage === stage ? "1px solid var(--version-color-border, rgba(218,44,67,0.34))" : "1px solid var(--border)",
                      color: manualStage === stage ? "var(--text-primary)" : "var(--text-muted)",
                    }}
                  >
                    {stage === "none" ? "None" : stage === "elite4" ? "Elite Four" : "Champion"}
                  </button>
                ))}
                {GYM_ORDERS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => { setManualStage("gym"); setManualGymOrder(n); }}
                    className="rounded-full px-3 py-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[0.65rem] sm:text-[0.68rem] font-semibold transition-colors duration-150"
                    style={{
                      background: manualStage === "gym" && manualGymOrder === n ? "var(--version-color-soft, var(--accent-soft))" : "var(--surface-3)",
                      border: manualStage === "gym" && manualGymOrder === n ? "1px solid var(--version-color-border, rgba(218,44,67,0.34))" : "1px solid var(--border)",
                      color: manualStage === "gym" && manualGymOrder === n ? "var(--text-primary)" : "var(--text-muted)",
                    }}
                  >
                    Gym {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {sourceMode === "saved" && (
          <SavedOpponentTeamsPanel
            teams={savedTeams}
            onLoad={handleLoadSavedTeam}
            onDelete={handleDeleteSaved}
            onRename={handleRenameSaved}
            onRefresh={loadSavedTeams}
            isLoading={savedLoading}
          />
        )}
      </div>

      {/* ── 3. Battle settings + team preview ── */}
      {sourceMode !== "saved" && (
        <div
          className="rounded-xl p-3 space-y-3"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          {/* Realism mode */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <InfoTooltip
                  label={<span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Realism</span>}
                  description="Sandbox: all forms allowed, no story constraints. Strict: forces your team to match the story checkpoint (level caps, evolution stages)."
                />
              </div>
              <p className="text-[0.65rem] mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.75 }}>
                {realismMode === "strict"
                  ? activeCheckpoint
                    ? `Team coerced to ${cpLabel} forms`
                    : "Set a story point to enable coercion"
                  : "Sandbox — all forms allowed, realism scored"}
              </p>
            </div>
            <div className="inline-flex shrink-0 rounded-xl border p-0.5" style={{ borderColor: "var(--border)" }}>
              {(["sandbox", "strict"] as BattleRealismMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setRealismMode(mode)}
                  className="rounded-lg px-3 py-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[0.68rem] font-semibold capitalize transition-colors duration-150"
                  style={{
                    background: realismMode === mode ? "var(--version-color-soft, var(--accent-soft))" : "transparent",
                    border: realismMode === mode ? "1px solid var(--version-color-border, rgba(218,44,67,0.34))" : "1px solid transparent",
                    color: realismMode === mode ? "var(--text-primary)" : "var(--text-muted)",
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Strict mode team preview — shows your team in checkpoint-appropriate forms */}
          {realismMode === "strict" && activeCheckpoint && (
            <div>
              <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
                Your team · {cpLabel} forms
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {myTeam.map((original, i) => {
                  if (!original) return null;
                  const status = coercedStatuses[i];
                  // Use coerced form when it exists (handles both upgrade and downgrade)
                  const displayPokemon = coercedMyTeam[i] ?? original;
                  if (!displayPokemon) return null;
                  const isDowngraded = status?.status === "downgraded";
                  const isUpgraded =
                    status?.status === "ok" &&
                    coercedMyTeam[i] &&
                    normalizeSpeciesName(coercedMyTeam[i]!.name) !== normalizeSpeciesName(original.name);
                  const isUnavailable = status?.status === "unavailable";
                  return (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center relative"
                        style={{
                          background: isUnavailable ? "rgba(239,68,68,0.1)" : isDowngraded ? "rgba(251,191,36,0.1)" : isUpgraded ? "rgba(34,197,94,0.1)" : "var(--surface-3)",
                          border: isUnavailable ? "1px solid rgba(239,68,68,0.4)" : isDowngraded ? "1px solid rgba(251,191,36,0.35)" : isUpgraded ? "1px solid rgba(34,197,94,0.35)" : "1px solid var(--border)",
                        }}
                      >
                        <Image
                          src={pokemonSpriteSrc(displayPokemon.sprite, displayPokemon.id)}
                          alt={displayPokemon.name}
                          width={36}
                          height={36}
                          unoptimized
                          className={`object-contain ${isUnavailable ? "opacity-40" : ""}`}
                          style={{ imageRendering: "pixelated" }}
                        />
                        {isUnavailable && (
                          <span className="absolute inset-0 flex items-center justify-center text-[0.7rem] font-black" style={{ color: "#f87171" }}>✕</span>
                        )}
                      </div>
                      <span
                        className="text-[0.5rem] font-medium leading-none capitalize truncate max-w-[3rem]"
                        style={{ color: isUnavailable ? "#f87171" : isDowngraded ? "#fbbf24" : isUpgraded ? "#22c55e" : "var(--text-muted)" }}
                      >
                        {displayPokemon.name}
                      </span>
                    </div>
                  );
                })}
              </div>
              {hasAnyCoercion && (
                <div className="mt-2 space-y-0.5">
                  {coercedStatuses.map((status, i) => {
                    if (!status || status.status === "ok") return null;
                    if (status.status === "downgraded") {
                      return (
                        <div key={i} className="flex items-center gap-1 text-[0.65rem]" style={{ color: "#fbbf24" }}>
                          <FiArrowRight size={9} />
                          <span className="capitalize">{status.from}</span>
                          <span style={{ opacity: 0.5 }}>→</span>
                          <span className="capitalize font-semibold">{status.to}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="flex items-center gap-1 text-[0.65rem]" style={{ color: "#f87171" }}>
                        <FiAlertCircle size={9} />
                        <span className="capitalize font-semibold">{status.name}</span>
                        <span style={{ opacity: 0.75 }}>not obtainable before {cpLabel}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {!hasAnyCoercion && (
                <p className="mt-1.5 text-[0.65rem]" style={{ color: "var(--text-muted)" }}>
                  All your Pokémon are already {cpLabel}-legal.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 4. Run Matchups (sticky footer) ── */}
      {sourceMode !== "saved" && (
        <div
          className="sticky bottom-0 z-10 rounded-xl p-2 pb-3 -m-2 space-y-2"
          style={{ background: "color-mix(in srgb, var(--surface-1) 90%, transparent)" }}
        >
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze || analyzing}
              className="btn-secondary !py-2 !px-4 flex-1 !justify-center min-h-[44px] font-semibold disabled:opacity-70"
              aria-label={analyzing ? "Analyzing matchups" : "Run battle analysis"}
              style={canAnalyze && !analyzing ? { background: "var(--version-color-soft, var(--accent-soft))", borderColor: "var(--version-color-border, rgba(218,44,67,0.34))" } : {}}
            >
              <FiPlay size={13} />
              {analyzing ? "Analyzing…" : "Run Matchups"}
            </button>

            {isAuthenticated && hasOppPokemon && (
              <button
                type="button"
                onClick={() => setShowSaveForm((v) => !v)}
                className="btn-secondary !py-2 !px-3 min-h-[44px]"
                aria-expanded={showSaveForm}
              >
                <FiSave size={13} />
                <span className="hidden sm:inline">Save</span>
              </button>
            )}
          </div>

          {showSaveForm && (
            <div
              className="rounded-xl p-3 space-y-2"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Save opponent team
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saveNameInput}
                  onChange={(e) => setSaveNameInput(e.target.value)}
                  placeholder={opponentLabel ?? "Team name…"}
                  className="auth-input !py-1.5 !text-sm flex-1"
                  maxLength={80}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                />
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-secondary !py-2 !px-4 min-h-[44px]"
                >
                  {isSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 5. Analysis error ── */}
      {analyzeError && (
        <div
          className="rounded-xl p-3 flex items-start gap-2"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
        >
          <FiAlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: "#f87171" }} />
          <p className="text-sm" style={{ color: "#f87171" }}>
            {analyzeError}
          </p>
        </div>
      )}

      {/* ── 6. Realism summary — strict only shows violation details ── */}
      {analysisRealism && analysisRealism.mode === "strict" && (
        <div
          className="rounded-xl p-3 space-y-1.5"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
              Realism check
            </p>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              {analysisRealism.realismScore}/100
            </span>
          </div>
          {analysisRealism.rules && (
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Target: Lv {analysisRealism.rules.levelMin}–{analysisRealism.rules.levelMax} · max evo stage {analysisRealism.rules.maxEvolutionStage}
            </p>
          )}
          {analysisRealism.violations.slice(0, 3).map((issue) => (
            <p key={`${issue.team}-${issue.slotIndex}-${issue.code}`} className="text-xs" style={{ color: "#f87171" }}>
              {issue.message}
            </p>
          ))}
          {analysisRealism.warnings.slice(0, 2).map((issue) => (
            <p key={`${issue.team}-${issue.slotIndex}-${issue.code}`} className="text-xs" style={{ color: "var(--text-muted)" }}>
              {issue.message}
            </p>
          ))}
        </div>
      )}

      <div ref={resultsRef} />

      {/* ── 7. Results ── */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
              Results
            </p>
            <div
              className="inline-flex rounded-xl border p-0.5"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
              role="tablist"
              aria-label="Results view"
            >
              {(["assignments", "matrix"] as ResultsView[]).map((view) => (
                <button
                  key={view}
                  type="button"
                  role="tab"
                  aria-selected={resultsView === view}
                  onClick={() => setResultsView(view)}
                  className="rounded-lg px-2.5 py-1 text-[0.72rem] font-semibold capitalize transition-colors duration-150"
                  style={{
                    background: resultsView === view ? "var(--version-color-soft, var(--accent-soft))" : "transparent",
                    border: resultsView === view ? "1px solid var(--version-color-border, rgba(218,44,67,0.34))" : "1px solid transparent",
                    color: resultsView === view ? "var(--text-primary)" : "var(--text-muted)",
                  }}
                >
                  {view === "assignments" ? "Assignments" : "Matrix"}
                </button>
              ))}
            </div>
          </div>

          {resultsView === "assignments" ? (
            <MatchupAssignments
              assignments={result.assignments}
              myTeam={analysisMyTeam}
              opponentTeam={analysisOpponentTeam}
              totalScore={result.totalScore}
              effectiveTotalScore={result.effectiveTotalScore}
              realism={result.realism}
            />
          ) : (
            <MatchupMatrix
              matrix={result.matrix}
              myTeam={analysisMyTeam}
              opponentTeam={analysisOpponentTeam}
              realism={result.realism}
            />
          )}
        </div>
      )}
    </div>
  );
}
