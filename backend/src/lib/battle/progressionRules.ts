import type { BossStage } from "./presetRosters";
import { getBossesForGame } from "./presetRosters";

export type BattleRealismMode = "strict" | "sandbox";

export interface BattleCheckpoint {
  bossName: string | null;
  stage: BossStage | null;
  gymOrder: number | null;
}

export interface CheckpointRules {
  label: string;
  levelMin: number;
  levelMax: number;
  maxEvolutionStage: number;
}

export interface BattleSlotInput {
  name: string;
  isFinalEvolution: boolean;
  evolutionStage: number | null;
}

export interface BattleRealismIssue {
  team: "myTeam" | "opponentTeam";
  slotIndex: number;
  pokemonName: string;
  code:
    | "evolution_too_advanced"
    | "likely_level_too_high"
    | "likely_level_too_low"
    | "unknown_evolution_stage";
  message: string;
  penalty: number;
  severity: "warning" | "violation";
}

export interface BattleRealismSummary {
  mode: BattleRealismMode;
  checkpoint: BattleCheckpoint | null;
  rules: CheckpointRules | null;
  warnings: BattleRealismIssue[];
  violations: BattleRealismIssue[];
  penaltyTotal: number;
  realismScore: number;
}

interface PresetContext {
  gameId: number | null;
  selectedVersionId: string | null;
  presetBossKey: string | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Level range for player team at each gym. Must match presetRosters withLevels
 * so strict-mode realism checks align with boss roster levels.
 */
function getGymLevelRange(gymOrder: number): { min: number; max: number } {
  if (gymOrder <= 1) return { min: 12, max: 14 };
  if (gymOrder === 2) return { min: 18, max: 21 };
  if (gymOrder === 3) return { min: 22, max: 26 };
  if (gymOrder === 4) return { min: 28, max: 32 };
  if (gymOrder === 5) return { min: 31, max: 36 };
  if (gymOrder === 6) return { min: 35, max: 40 };
  if (gymOrder === 7) return { min: 40, max: 45 };
  return { min: 43, max: 48 };
}

function getAllowedEvolutionStage(stage: BossStage, gymOrder: number | null): number {
  if (stage === "elite4" || stage === "champion") return 3;
  if (!gymOrder) return 2;
  if (gymOrder <= 1) return 2;
  if (gymOrder <= 4) return 2; // Gyms 1–4: max stage 2
  return 3; // Gyms 5–8: max stage 3 (aligns with level ranges 31–48)
}

/**
 * Estimate Pokemon level from evolution stage. When rules exist, use the checkpoint's
 * level range so coerced teams pass validation (e.g. stage 3 at gym 5 → level 36, not 52).
 */
function estimateLevel(slot: BattleSlotInput, rules?: CheckpointRules | null): number {
  const min = rules?.levelMin ?? 12;
  const max = rules?.levelMax ?? 52;
  const mid = Math.round((min + max) / 2);

  if (slot.evolutionStage && slot.evolutionStage >= 3) return max;
  if (slot.evolutionStage === 2) return mid;
  if (slot.evolutionStage === 1) return min;
  if (slot.isFinalEvolution) return max;
  return mid;
}

function resolveBossLevelBand(
  checkpoint: BattleCheckpoint | null,
  presetContext: PresetContext | null
): { min: number; max: number } | null {
  if (!presetContext?.gameId) return null;
  const bosses = getBossesForGame(presetContext.gameId, presetContext.selectedVersionId);
  if (bosses.length === 0) return null;

  const byKey = presetContext.presetBossKey
    ? bosses.find((boss) => boss.key === presetContext.presetBossKey)
    : null;
  const byCheckpoint =
    !byKey && checkpoint?.stage
      ? bosses.find(
          (boss) =>
            boss.stage === checkpoint.stage &&
            (checkpoint.gymOrder == null || boss.gymOrder === checkpoint.gymOrder) &&
            (checkpoint.bossName == null ||
              boss.name.toLowerCase() === checkpoint.bossName.toLowerCase())
        )
      : null;
  const boss = byKey ?? byCheckpoint;
  if (!boss?.rosterLevels || boss.rosterLevels.length === 0) return null;

  return {
    min: Math.min(...boss.rosterLevels),
    max: Math.max(...boss.rosterLevels),
  };
}

export function deriveCheckpointRules(checkpoint: BattleCheckpoint | null): CheckpointRules | null {
  if (!checkpoint?.stage) return null;
  if (checkpoint.stage === "gym") {
    const gymOrder = checkpoint.gymOrder ?? 3;
    const levelRange = getGymLevelRange(gymOrder);
    return {
      label: `Gym ${gymOrder}`,
      levelMin: levelRange.min,
      levelMax: levelRange.max,
      maxEvolutionStage: getAllowedEvolutionStage("gym", gymOrder),
    };
  }

  if (checkpoint.stage === "elite4") {
    return {
      label: "Elite Four",
      levelMin: 50,
      levelMax: 65,
      maxEvolutionStage: 3,
    };
  }

  return {
    label: "Champion",
    levelMin: 58,
    levelMax: 70,
    maxEvolutionStage: 3,
  };
}

function evaluateSlot(
  slot: BattleSlotInput,
  team: "myTeam" | "opponentTeam",
  slotIndex: number,
  rules: CheckpointRules,
  levelBandOverride?: { min: number; max: number } | null
): BattleRealismIssue[] {
  const issues: BattleRealismIssue[] = [];
  const stage = slot.evolutionStage;
  const inferredStage = stage ?? (slot.isFinalEvolution ? 3 : null);

  if (inferredStage === null) {
    issues.push({
      team,
      slotIndex,
      pokemonName: slot.name,
      code: "unknown_evolution_stage",
      message: `${slot.name} has unknown evolution stage; realism confidence is lower.`,
      penalty: 4,
      severity: "warning",
    });
  } else if (inferredStage > rules.maxEvolutionStage) {
    issues.push({
      team,
      slotIndex,
      pokemonName: slot.name,
      code: "evolution_too_advanced",
      message: `${slot.name} appears over-evolved for ${rules.label}.`,
      penalty: 20,
      severity: "violation",
    });
  }

  // Skip level checks for opponent when we have boss preset levels — the boss roster is canonical.
  // estimateLevel() uses evolution stage and often returns 52 for final evos, which would falsely
  // flag boss Pokemon (e.g. gym 6 Winona's Swellow) as "too high level" for their own roster band.
  const skipLevelChecks = team === "opponentTeam" && levelBandOverride != null;

  if (!skipLevelChecks) {
    const estimatedLevel = estimateLevel(slot, rules);
    const levelMin = levelBandOverride?.min ?? rules.levelMin;
    const levelMax = levelBandOverride?.max ?? rules.levelMax;
    if (estimatedLevel > levelMax + 6) {
      issues.push({
        team,
        slotIndex,
        pokemonName: slot.name,
        code: "likely_level_too_high",
        message: `${slot.name} is likely too high level for expected ${rules.label} pacing.`,
        penalty: 12,
        severity: "violation",
      });
    } else if (estimatedLevel < levelMin - 8) {
      issues.push({
        team,
        slotIndex,
        pokemonName: slot.name,
        code: "likely_level_too_low",
        message: `${slot.name} is likely underleveled for expected ${rules.label} pacing.`,
        penalty: 8,
        severity: "warning",
      });
    }
  }

  return issues;
}

function evaluateTeam(
  slots: (BattleSlotInput | null)[],
  team: "myTeam" | "opponentTeam",
  rules: CheckpointRules,
  levelBandOverride?: { min: number; max: number } | null
): BattleRealismIssue[] {
  const issues: BattleRealismIssue[] = [];
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (!slot) continue;
    issues.push(...evaluateSlot(slot, team, i, rules, levelBandOverride));
  }
  return issues;
}

export function evaluateBattleRealism(params: {
  mode: BattleRealismMode;
  checkpoint: BattleCheckpoint | null;
  myTeam: (BattleSlotInput | null)[];
  opponentTeam: (BattleSlotInput | null)[];
  presetContext?: PresetContext | null;
}): BattleRealismSummary {
  const baseRules = deriveCheckpointRules(params.checkpoint);
  if (!baseRules) {
    return {
      mode: params.mode,
      checkpoint: params.checkpoint,
      rules: null,
      warnings: [],
      violations: [],
      penaltyTotal: 0,
      realismScore: 100,
    };
  }

  const bossLevelBand = resolveBossLevelBand(params.checkpoint, params.presetContext ?? null);
  // Player expected levels come from checkpoint rules (getGymLevelRange); boss levels are for the opponent.
  // Using boss levels for the player caused gym 6/7 to reject valid final-evolution teams (estimated 52 > boss max 40–45).
  const rulesForPlayer = baseRules;
  const rulesForOpponent =
    bossLevelBand && baseRules
      ? { ...baseRules, levelMin: bossLevelBand.min, levelMax: bossLevelBand.max }
      : baseRules;
  const allIssues = [
    ...evaluateTeam(params.myTeam, "myTeam", rulesForPlayer, null),
    ...evaluateTeam(params.opponentTeam, "opponentTeam", rulesForOpponent, bossLevelBand),
  ];

  const warnings = allIssues.filter((issue) => issue.severity === "warning");
  const violations = allIssues.filter((issue) => issue.severity === "violation");
  const penaltyTotal = allIssues.reduce((sum, issue) => sum + issue.penalty, 0);
  const realismScore = clamp(100 - penaltyTotal, 0, 100);

  return {
    mode: params.mode,
    checkpoint: params.checkpoint,
    rules: baseRules,
    warnings,
    violations,
    penaltyTotal,
    realismScore,
  };
}
