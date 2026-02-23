/**
 * Matchup Prediction Engine (v1)
 *
 * Deterministic type + stats heuristic. No movesets/items/abilities.
 * Score range: -100..100
 * Thresholds: >= 35 win, 15..34 lean-win, -14..14 even, -34..-15 lean-loss, <= -35 loss
 */

// ── Type chart (mirrors frontend/lib/constants.ts) ───────────────────────────

// What each type is WEAK to (defender → list of effective attacker types)
const TYPE_WEAKNESSES: Record<string, string[]> = {
  normal: ["fighting"],
  fire: ["water", "ground", "rock"],
  water: ["electric", "grass"],
  electric: ["ground"],
  grass: ["fire", "ice", "poison", "flying", "bug"],
  ice: ["fire", "fighting", "rock", "steel"],
  fighting: ["flying", "psychic", "fairy"],
  poison: ["ground", "psychic"],
  ground: ["water", "grass", "ice"],
  flying: ["electric", "ice", "rock"],
  psychic: ["bug", "ghost", "dark"],
  bug: ["fire", "flying", "rock"],
  rock: ["water", "grass", "fighting", "ground", "steel"],
  ghost: ["ghost", "dark"],
  dragon: ["ice", "dragon", "fairy"],
  dark: ["fighting", "bug", "fairy"],
  steel: ["fire", "fighting", "ground"],
  fairy: ["poison", "steel"],
};

// What each type RESISTS (defender → list of resisted attacker types)
const TYPE_RESISTANCES: Record<string, string[]> = {
  normal: [],
  fire: ["fire", "grass", "ice", "bug", "steel", "fairy"],
  water: ["fire", "water", "ice", "steel"],
  electric: ["electric", "flying", "steel"],
  grass: ["water", "electric", "grass", "ground"],
  ice: ["ice"],
  fighting: ["bug", "rock", "dark"],
  poison: ["grass", "fighting", "poison", "bug", "fairy"],
  ground: ["poison", "rock"],
  flying: ["grass", "fighting", "bug"],
  psychic: ["fighting", "psychic"],
  bug: ["grass", "fighting", "ground"],
  rock: ["normal", "fire", "poison", "flying"],
  ghost: ["poison", "bug"],
  dragon: ["fire", "water", "electric", "grass"],
  dark: ["ghost", "dark"],
  steel: [
    "normal",
    "fire",
    "water",
    "electric",
    "grass",
    "ice",
    "flying",
    "psychic",
    "bug",
    "rock",
    "dragon",
    "steel",
    "fairy",
  ],
  fairy: ["fighting", "bug", "dark"],
};

// Types that are immune to certain attackers (defender → list of immune-to attacker types)
const TYPE_IMMUNITIES: Record<string, string[]> = {
  normal: ["ghost"],
  ghost: ["normal", "fighting"],
  ground: ["electric"],
  flying: ["ground"],
  dark: ["psychic"],
  steel: ["poison"],
  fairy: ["dragon"],
};

export type PredictionLabel = "win" | "lean-win" | "even" | "lean-loss" | "loss";

export interface MatchupMatrixCell {
  mySlotIndex: number;
  opponentSlotIndex: number;
  myPokemonId: number;
  opponentPokemonId: number;
  score: number;
  prediction: PredictionLabel;
  reasons: string[];
}

export interface RecommendedAssignment {
  mySlotIndex: number;
  opponentSlotIndex: number;
  myPokemonId: number;
  opponentPokemonId: number;
  score: number;
  prediction: PredictionLabel;
}

export interface BattlePlannerResult {
  matrix: MatchupMatrixCell[];
  assignments: RecommendedAssignment[];
  totalScore: number;
  effectiveTotalScore: number;
  realism: {
    realismScore: number;
    penaltyTotal: number;
    warnings: unknown[];
    violations: unknown[];
    mode: "strict" | "sandbox";
    checkpoint: unknown;
    rules: unknown;
  };
}

interface PokemonInput {
  id: number;
  types: string[];
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function scoreToLabel(score: number): PredictionLabel {
  if (score >= 35) return "win";
  if (score >= 15) return "lean-win";
  if (score > -15) return "even";
  if (score > -35) return "lean-loss";
  return "loss";
}

/**
 * Returns true if attackType hits defenderType for 0 damage (immune).
 */
function isImmune(attackType: string, defenderType: string): boolean {
  const immuneList = TYPE_IMMUNITIES[defenderType];
  return Boolean(immuneList && immuneList.includes(attackType));
}

/**
 * Returns true if attackType is resisted by defenderType.
 */
function isResisted(attackType: string, defenderType: string): boolean {
  const resistList = TYPE_RESISTANCES[defenderType];
  return Boolean(resistList && resistList.includes(attackType));
}

/**
 * Returns true if attackType is super effective against defenderType.
 */
function isSuperEffective(attackType: string, defenderType: string): boolean {
  const weakList = TYPE_WEAKNESSES[defenderType];
  return Boolean(weakList && weakList.includes(attackType));
}

/**
 * Compute the overall type matchup multiplier for attacker's STAB types against defender's types.
 * Returns a multiplier: 0 (immune), 0.25, 0.5, 1, 2, or 4.
 * Takes the best (highest) STAB type the attacker can use.
 */
function bestAttackMultiplier(
  attackerTypes: string[],
  defenderTypes: string[]
): number {
  let best = 0; // will pick max

  for (const atkType of attackerTypes) {
    let multiplier = 1;
    for (const defType of defenderTypes) {
      if (isImmune(atkType, defType)) {
        multiplier = 0;
        break;
      }
      if (isSuperEffective(atkType, defType)) {
        multiplier *= 2;
      } else if (isResisted(atkType, defType)) {
        multiplier *= 0.5;
      }
    }
    if (multiplier > best) best = multiplier;
  }

  return best;
}

function offenseMultiplierScore(multiplier: number): number {
  if (multiplier === 0) return -24;
  if (multiplier >= 4) return 24;
  if (multiplier >= 2) return 14;
  if (multiplier === 1) return 0;
  if (multiplier <= 0.25) return -20;
  return -10;
}

/**
 * Compute matchup score between myPokemon and opponentPokemon.
 * Returns a score in -100..100.
 */
function computeMatchup(my: PokemonInput, opp: PokemonInput): MatchupMatrixCell {
  const reasons: string[] = [];
  let score = 0;

  // ── 1. Offensive type pressure (weight: ~45 pts max) ─────────────────────
  const myOffMult = bestAttackMultiplier(my.types, opp.types);
  const oppOffMult = bestAttackMultiplier(opp.types, my.types);

  const typeScore = clamp(
    offenseMultiplierScore(myOffMult) - offenseMultiplierScore(oppOffMult),
    -45,
    45
  );
  score += typeScore;

  // Reasons for type
  if (myOffMult === 4) {
    reasons.push("4× STAB pressure");
  } else if (myOffMult === 2) {
    reasons.push("STAB super-effective");
  } else if (myOffMult === 0) {
    reasons.push("No damage (immune)");
  } else if (myOffMult <= 0.5) {
    reasons.push("Resisted by opponent");
  }

  if (oppOffMult === 4) {
    reasons.push("4× weakness risk");
  } else if (oppOffMult === 2) {
    reasons.push("Opponent hits super-effectively");
  } else if (oppOffMult === 0) {
    reasons.push("Immune to opponent STAB");
  } else if (oppOffMult <= 0.5) {
    reasons.push("Resists opponent STAB");
  }

  // ── 2. Speed tempo (weight: 12 pts max) ──────────────────────────────────
  const speedDiff = my.speed - opp.speed;
  const speedRatio = opp.speed > 0 ? my.speed / opp.speed : 2;
  const speedScore = clamp(speedDiff * 0.1, -12, 12);
  score += speedScore;

  if (speedRatio >= 1.5) {
    reasons.push("Significantly faster");
  } else if (speedRatio <= 0.67) {
    reasons.push("Opponent outspeeds significantly");
  }

  // ── 3. Offensive stat bias (weight: 10 pts max) ───────────────────────────
  // Compare my attacking stat vs opponent's defending stat, picking best combo
  const myBestAtk = Math.max(my.attack, my.specialAttack);
  const oppBestDef = Math.max(opp.defense, opp.specialDefense);
  const atkBias = clamp((myBestAtk - oppBestDef) * 0.06, -10, 10);
  score += atkBias;

  if (atkBias >= 8) reasons.push("Strong offensive pressure");
  else if (atkBias <= -8) reasons.push("Poor damage profile into target");

  // ── 4. Bulk survivability (weight: 10 pts max) ───────────────────────────
  const myBulk = (my.hp * (my.defense + my.specialDefense)) / 200;
  const oppBulk = (opp.hp * (opp.defense + opp.specialDefense)) / 200;
  const bulkDiff = myBulk - oppBulk;
  const bulkScore = clamp(bulkDiff * 0.035, -10, 10);
  score += bulkScore;

  if (bulkScore >= 8) reasons.push("High overall bulk edge");
  else if (bulkScore <= -8) reasons.push("Outclassed in bulk");

  // ── 5. Final clamping ────────────────────────────────────────────────────
  score = clamp(Math.round(score), -100, 100);

  // Trim reasons to most impactful 4
  const finalReasons = reasons.slice(0, 4);

  return {
    mySlotIndex: -1,
    opponentSlotIndex: -1,
    myPokemonId: my.id,
    opponentPokemonId: opp.id,
    score,
    prediction: scoreToLabel(score),
    reasons: finalReasons,
  };
}

/**
 * Build the full matchup matrix for all filled player slots vs all filled opponent slots.
 */
function buildMatrix(
  myTeam: (PokemonInput | null)[],
  oppTeam: (PokemonInput | null)[]
): MatchupMatrixCell[] {
  const cells: MatchupMatrixCell[] = [];

  for (let i = 0; i < myTeam.length; i++) {
    const myPokemon = myTeam[i];
    if (!myPokemon) continue;

    for (let j = 0; j < oppTeam.length; j++) {
      const oppPokemon = oppTeam[j];
      if (!oppPokemon) continue;

      const cell = computeMatchup(myPokemon, oppPokemon);
      cell.mySlotIndex = i;
      cell.opponentSlotIndex = j;
      cells.push(cell);
    }
  }

  return cells;
}

function buildCombinations(values: number[], size: number): number[][] {
  if (size <= 0) return [[]];
  if (size > values.length) return [];

  const combos: number[][] = [];
  const current: number[] = [];

  function walk(start: number) {
    if (current.length === size) {
      combos.push(current.slice());
      return;
    }

    const remainingNeeded = size - current.length;
    for (let i = start; i <= values.length - remainingNeeded; i++) {
      current.push(values[i]);
      walk(i + 1);
      current.pop();
    }
  }

  walk(0);
  return combos;
}

function forEachPermutation(values: number[], onPermutation: (perm: number[]) => void) {
  function permute(start: number) {
    if (start === values.length) {
      onPermutation(values.slice());
      return;
    }
    for (let i = start; i < values.length; i++) {
      [values[start], values[i]] = [values[i], values[start]];
      permute(start + 1);
      [values[start], values[i]] = [values[i], values[start]];
    }
  }

  permute(0);
}

/**
 * Brute-force permutation assignment (max 6! = 720 permutations).
 * Finds the assignment of player slots to opponent slots that maximizes total score.
 * Only considers filled slots.
 */
function findBestAssignment(
  myFilledIndices: number[],
  oppFilledIndices: number[],
  matrix: MatchupMatrixCell[]
): RecommendedAssignment[] {
  // Build a lookup for fast score access
  const scoreMap = new Map<string, MatchupMatrixCell>();
  for (const cell of matrix) {
    scoreMap.set(`${cell.mySlotIndex},${cell.opponentSlotIndex}`, cell);
  }

  const myCount = myFilledIndices.length;
  const oppCount = oppFilledIndices.length;

  if (myCount === 0 || oppCount === 0) return [];

  // We assign each my-slot to at most one opp-slot and vice versa.
  // When team sizes differ, evaluate all slot subsets on the larger side.
  const assignCount = Math.min(myCount, oppCount);
  const myCombinations = buildCombinations(myFilledIndices, assignCount);
  const oppCombinations = buildCombinations(oppFilledIndices, assignCount);
  let bestScore = -Infinity;
  let bestAssignments: RecommendedAssignment[] = [];

  for (const myCombo of myCombinations) {
    for (const oppCombo of oppCombinations) {
      forEachPermutation(oppCombo.slice(), (oppPermutation) => {
        let total = 0;
        const candidateAssignments: RecommendedAssignment[] = [];

        for (let k = 0; k < assignCount; k++) {
          const myIndex = myCombo[k];
          const oppIndex = oppPermutation[k];
          const cell = scoreMap.get(`${myIndex},${oppIndex}`);
          if (!cell) return;

          total += cell.score;
          candidateAssignments.push({
            mySlotIndex: cell.mySlotIndex,
            opponentSlotIndex: cell.opponentSlotIndex,
            myPokemonId: cell.myPokemonId,
            opponentPokemonId: cell.opponentPokemonId,
            score: cell.score,
            prediction: cell.prediction,
          });
        }

        if (total > bestScore) {
          bestScore = total;
          bestAssignments = candidateAssignments;
        }
      });
    }
  }

  return bestAssignments.sort((a, b) => a.mySlotIndex - b.mySlotIndex);
}

/**
 * Main analysis entry point.
 */
export function analyzeBattle(
  myTeam: (PokemonInput | null)[],
  opponentTeam: (PokemonInput | null)[],
  realism?: {
    realismScore: number;
    penaltyTotal: number;
    warnings: unknown[];
    violations: unknown[];
    mode: "strict" | "sandbox";
    checkpoint: unknown;
    rules: unknown;
  }
): BattlePlannerResult {
  const matrix = buildMatrix(myTeam, opponentTeam);

  const myFilledIndices = myTeam
    .map((p, i) => (p ? i : -1))
    .filter((i) => i >= 0);
  const oppFilledIndices = opponentTeam
    .map((p, i) => (p ? i : -1))
    .filter((i) => i >= 0);

  const assignments = findBestAssignment(myFilledIndices, oppFilledIndices, matrix);
  const totalScore =
    assignments.length > 0
      ? Math.round(
          assignments.reduce((sum, a) => sum + a.score, 0) / assignments.length
        )
      : 0;

  const realismFallback = {
    realismScore: 100,
    penaltyTotal: 0,
    warnings: [],
    violations: [],
    mode: "sandbox" as const,
    checkpoint: null,
    rules: null,
  };

  const realismSummary = realism ?? realismFallback;
  const effectiveTotalScore =
    realismSummary.mode === "sandbox"
      ? clamp(Math.round(totalScore - realismSummary.penaltyTotal / 4), -100, 100)
      : totalScore;

  return { matrix, assignments, totalScore, effectiveTotalScore, realism: realismSummary };
}
