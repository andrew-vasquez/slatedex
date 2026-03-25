import { ALL_TYPES, TYPE_EFFECTIVENESS, TYPE_IMMUNITIES, TYPE_INTRO_GENERATION, TYPE_RESISTANCES } from "@/lib/constants";

export type DefensiveMultiplierBucket =
  | "quadWeak"
  | "weak"
  | "neutral"
  | "resist"
  | "strongResist"
  | "immune";

export interface DefensiveMatchupResult {
  byType: Record<string, number>;
  buckets: Record<DefensiveMultiplierBucket, string[]>;
}

export interface TypeChartProfile {
  offensive: {
    strongAgainst: string[];
    resistedBy: string[];
    noEffectAgainst: string[];
    neutralAgainst: string[];
  };
  defensive: {
    weakTo: string[];
    resistTo: string[];
    immuneTo: string[];
    neutralTo: string[];
  };
}

function normalizeMultiplier(value: number): number {
  if (value === 0) return 0;
  if (value <= 0.25) return 0.25;
  if (value <= 0.5) return 0.5;
  if (value < 2) return 1;
  if (value < 4) return 2;
  return 4;
}

export function getDefensiveMatchups(defendingTypes: string[], generation?: number): DefensiveMatchupResult {
  const byType: Record<string, number> = {};
  const buckets: Record<DefensiveMultiplierBucket, string[]> = {
    quadWeak: [],
    weak: [],
    neutral: [],
    resist: [],
    strongResist: [],
    immune: [],
  };

  for (const attackingType of ALL_TYPES) {
    const introGeneration = TYPE_INTRO_GENERATION[attackingType] ?? 1;
    if (generation !== undefined && introGeneration > generation) {
      continue;
    }

    let multiplier = 1;

    for (const defendingType of defendingTypes) {
      const immunities = TYPE_IMMUNITIES[defendingType] ?? [];
      if (immunities.includes(attackingType)) {
        multiplier = 0;
        break;
      }

      const weaknesses = TYPE_EFFECTIVENESS[defendingType] ?? [];
      if (weaknesses.includes(attackingType)) {
        multiplier *= 2;
      }

      const resistances = TYPE_RESISTANCES[defendingType] ?? [];
      if (resistances.includes(attackingType)) {
        multiplier *= 0.5;
      }
    }

    const normalized = normalizeMultiplier(multiplier);
    byType[attackingType] = normalized;

    if (normalized === 4) {
      buckets.quadWeak.push(attackingType);
    } else if (normalized === 2) {
      buckets.weak.push(attackingType);
    } else if (normalized === 0.5) {
      buckets.resist.push(attackingType);
    } else if (normalized === 0.25) {
      buckets.strongResist.push(attackingType);
    } else if (normalized === 0) {
      buckets.immune.push(attackingType);
    } else {
      buckets.neutral.push(attackingType);
    }
  }

  return { byType, buckets };
}

export function getTypeChartProfile(type: string, generation?: number): TypeChartProfile {
  const availableTypes = ALL_TYPES.filter((entry) => {
    const introGeneration = TYPE_INTRO_GENERATION[entry] ?? 1;
    return generation === undefined || introGeneration <= generation;
  });

  const offensive = {
    strongAgainst: [] as string[],
    resistedBy: [] as string[],
    noEffectAgainst: [] as string[],
    neutralAgainst: [] as string[],
  };

  const defensive = {
    weakTo: [] as string[],
    resistTo: [] as string[],
    immuneTo: [] as string[],
    neutralTo: [] as string[],
  };

  for (const defendingType of availableTypes) {
    if ((TYPE_IMMUNITIES[defendingType] ?? []).includes(type)) {
      offensive.noEffectAgainst.push(defendingType);
      continue;
    }

    if ((TYPE_EFFECTIVENESS[defendingType] ?? []).includes(type)) {
      offensive.strongAgainst.push(defendingType);
      continue;
    }

    if ((TYPE_RESISTANCES[defendingType] ?? []).includes(type)) {
      offensive.resistedBy.push(defendingType);
      continue;
    }

    offensive.neutralAgainst.push(defendingType);
  }

  for (const attackingType of availableTypes) {
    if ((TYPE_IMMUNITIES[type] ?? []).includes(attackingType)) {
      defensive.immuneTo.push(attackingType);
      continue;
    }

    if ((TYPE_EFFECTIVENESS[type] ?? []).includes(attackingType)) {
      defensive.weakTo.push(attackingType);
      continue;
    }

    if ((TYPE_RESISTANCES[type] ?? []).includes(attackingType)) {
      defensive.resistTo.push(attackingType);
      continue;
    }

    defensive.neutralTo.push(attackingType);
  }

  return { offensive, defensive };
}
