import type { BossGuideEntry, BossStage, TeamContextPayload, TeamPokemonContext } from "./types";

const TYPE_INTRO_GENERATION: Record<string, number> = {
  normal: 1,
  fire: 1,
  water: 1,
  electric: 1,
  grass: 1,
  ice: 1,
  fighting: 1,
  poison: 1,
  ground: 1,
  flying: 1,
  psychic: 1,
  bug: 1,
  rock: 1,
  ghost: 1,
  dragon: 1,
  dark: 2,
  steel: 2,
  fairy: 6,
};

const ALL_TYPES = Object.keys(TYPE_INTRO_GENERATION);
const MAX_ALLOWED_POKEMON_CONTEXT = 500;
const MAX_CHECKPOINT_CATCHABLE_CONTEXT = 80;
const MAX_CHECKPOINT_BLOCKED_FINALS_CONTEXT = 200;
const MAX_CHECKPOINT_EVOLUTION_FALLBACKS_CONTEXT = 240;

function normalizeBossToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeSpeciesName(value: string): string {
  return value.trim().toLowerCase();
}

function getCheckpointEvolutionStageCap(checkpoint: BossGuideEntry | null): number {
  if (!checkpoint) return 3;
  if (checkpoint.stage !== "gym") return 3;

  const gymOrder = checkpoint.gymOrder ?? 8;
  if (gymOrder <= 1) return 1;
  if (gymOrder <= 5) return 2;
  return 3;
}

function resolveCheckpoint(params: {
  progression: TeamContextPayload["progression"] | undefined;
  bossGuidance: BossGuideEntry[];
}): BossGuideEntry | null {
  const { progression, bossGuidance } = params;
  if (!progression || bossGuidance.length === 0) return null;

  const normalizedBossName =
    typeof progression.checkpointBossName === "string" && progression.checkpointBossName.trim().length > 0
      ? normalizeBossToken(progression.checkpointBossName)
      : null;
  const stage: BossStage | null =
    progression.checkpointStage === "gym" ||
    progression.checkpointStage === "elite4" ||
    progression.checkpointStage === "champion"
      ? progression.checkpointStage
      : null;
  const gymOrder =
    typeof progression.checkpointGymOrder === "number" &&
    Number.isInteger(progression.checkpointGymOrder) &&
    progression.checkpointGymOrder > 0
      ? progression.checkpointGymOrder
      : null;

  if (stage && gymOrder && stage === "gym") {
    const byOrder = bossGuidance.find((entry) => entry.stage === "gym" && entry.gymOrder === gymOrder);
    if (byOrder) return byOrder;
  }

  if (normalizedBossName) {
    const byName = bossGuidance.find((entry) => normalizeBossToken(entry.name) === normalizedBossName);
    if (byName) return byName;
  }

  if (stage) {
    const byStage = bossGuidance.find((entry) => entry.stage === stage);
    if (byStage) return byStage;
  }

  if (gymOrder) {
    const byGymOrder = bossGuidance.find((entry) => entry.stage === "gym" && entry.gymOrder === gymOrder);
    if (byGymOrder) return byGymOrder;
  }

  return null;
}

function inferStoryPhase(checkpoint: BossGuideEntry | null): "early" | "mid" | "late" | "elite4" | "champion" | null {
  if (!checkpoint) return null;
  if (checkpoint.stage === "elite4") return "elite4";
  if (checkpoint.stage === "champion") return "champion";

  const gymOrder = checkpoint.gymOrder ?? 0;
  if (gymOrder <= 2) return "early";
  if (gymOrder <= 5) return "mid";
  return "late";
}

function inferAssumedTeamForm(
  pokemon: TeamPokemonContext,
  evolutionStageCap: number
): { sourceSpeciesName: string; assumedSpeciesName: string; reason: string } | null {
  const source = normalizeSpeciesName(pokemon.name);
  const line = Array.isArray(pokemon.evolutionLine)
    ? pokemon.evolutionLine.map((name) => normalizeSpeciesName(name)).filter(Boolean)
    : [];

  if (line.length === 0) return null;
  const sourceStage =
    typeof pokemon.evolutionStage === "number" && Number.isInteger(pokemon.evolutionStage) && pokemon.evolutionStage > 0
      ? pokemon.evolutionStage
      : line.length;
  if (sourceStage <= evolutionStageCap) return null;

  const index = Math.max(0, Math.min(evolutionStageCap, line.length) - 1);
  const assumed = line[index] ?? source;
  if (!assumed || assumed === source) return null;

  return {
    sourceSpeciesName: source,
    assumedSpeciesName: assumed,
    reason: `Checkpoint cap allows evolution stage ${evolutionStageCap} at this point.`,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function summarizeTypeDistribution(team: TeamPokemonContext[]): Array<{ type: string; count: number }> {
  const counts = new Map<string, number>();

  for (const pokemon of team) {
    for (const type of pokemon.types) {
      const normalized = type.trim().toLowerCase();
      if (!normalized) continue;
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
}

function summarizeStatProfile(team: TeamPokemonContext[]) {
  const hp = average(team.map((pokemon) => pokemon.hp));
  const attack = average(team.map((pokemon) => pokemon.attack));
  const defense = average(team.map((pokemon) => pokemon.defense));
  const specialAttack = average(team.map((pokemon) => pokemon.specialAttack));
  const specialDefense = average(team.map((pokemon) => pokemon.specialDefense));
  const speed = average(team.map((pokemon) => pokemon.speed));

  const fastCount = team.filter((pokemon) => pokemon.speed >= 100).length;
  const bulkyCount = team.filter(
    (pokemon) => pokemon.hp + pokemon.defense + pokemon.specialDefense >= 300
  ).length;
  const physicalCount = team.filter((pokemon) => pokemon.attack >= pokemon.specialAttack).length;
  const specialCount = team.length - physicalCount;

  return {
    averageStats: {
      hp,
      attack,
      defense,
      specialAttack,
      specialDefense,
      speed,
    },
    shape: {
      fastCount,
      bulkyCount,
      physicalCount,
      specialCount,
    },
  };
}

export function buildTeamContext(payload: TeamContextPayload, bossGuidance: BossGuideEntry[]) {
  const team = payload.team;
  const availableTypes = ALL_TYPES.filter((type) => (TYPE_INTRO_GENERATION[type] ?? 1) <= payload.generation);
  const unavailableTypes = ALL_TYPES.filter((type) => (TYPE_INTRO_GENERATION[type] ?? 1) > payload.generation);
  const allowedPokemonNames = Array.from(
    new Set((payload.allowedPokemonNames ?? []).map((name) => name.trim().toLowerCase()).filter(Boolean))
  )
    .sort((a, b) => a.localeCompare(b))
    .slice(0, MAX_ALLOWED_POKEMON_CONTEXT);
  const typeDistribution = summarizeTypeDistribution(team);
  const stats = summarizeStatProfile(team);
  const dexMode = payload.filters?.dexMode ?? "national";
  const versionFilterEnabled = Boolean(payload.filters?.versionFilterEnabled);
  const typeFilter = payload.filters?.typeFilter ?? [];
  const enforcePool = dexMode === "regional" || dexMode === "all" || versionFilterEnabled;
  const checkpoint = resolveCheckpoint({
    progression: payload.progression,
    bossGuidance,
  });
  const storyPhase = inferStoryPhase(checkpoint);
  const checkpointCatchablePokemonNames = Array.from(
    new Set(
      (payload.progression?.checkpointCatchableNames ?? [])
        .map((name) => normalizeSpeciesName(name))
        .filter(Boolean)
    )
  )
    .sort((a, b) => a.localeCompare(b))
    .slice(0, MAX_CHECKPOINT_CATCHABLE_CONTEXT);
  const checkpointCatchablePoolSize =
    typeof payload.progression?.checkpointCatchablePoolSize === "number" &&
    Number.isInteger(payload.progression.checkpointCatchablePoolSize) &&
    payload.progression.checkpointCatchablePoolSize > 0
      ? payload.progression.checkpointCatchablePoolSize
      : checkpointCatchablePokemonNames.length;
  const checkpointBlockedFinalNames = Array.from(
    new Set(
      (payload.progression?.checkpointBlockedFinalNames ?? [])
        .map((name) => normalizeSpeciesName(name))
        .filter(Boolean)
    )
  )
    .sort((a, b) => a.localeCompare(b))
    .slice(0, MAX_CHECKPOINT_BLOCKED_FINALS_CONTEXT);
  const checkpointEvolutionFallbacks = Array.from(
    new Map(
      (payload.progression?.checkpointEvolutionFallbacks ?? [])
        .map((entry) => {
          const fromName = normalizeSpeciesName(entry.fromName);
          const toName = normalizeSpeciesName(entry.toName);
          if (!fromName || !toName || fromName === toName) return null;
          return [fromName, { fromName, toName }] as const;
        })
        .filter((entry): entry is readonly [string, { fromName: string; toName: string }] => entry !== null)
    ).values()
  ).slice(0, MAX_CHECKPOINT_EVOLUTION_FALLBACKS_CONTEXT);
  const checkpointEvolutionStageCap = getCheckpointEvolutionStageCap(checkpoint);
  const assumedTeamForms = team
    .map((pokemon) => inferAssumedTeamForm(pokemon, checkpointEvolutionStageCap))
    .filter(
      (
        entry
      ): entry is { sourceSpeciesName: string; assumedSpeciesName: string; reason: string } =>
        entry !== null
    );

  return {
    generation: payload.generation,
    gameId: payload.gameId,
    selectedVersionId: payload.selectedVersionId,
    filters: {
      dexMode,
      versionFilterEnabled,
      regionalDexName: payload.filters?.regionalDexName ?? null,
      typeFilter,
    },
    constraints: {
      enforceSuggestionPool: enforcePool,
      allowedPokemonNames,
      allowedPokemonCount: allowedPokemonNames.length,
      availableTypes,
      unavailableTypes,
      notes: {
        noFairyType: payload.generation < 6,
        noDarkOrSteelType: payload.generation === 1,
      },
    },
    teamSize: team.length,
    team: team.map((pokemon) => ({
      id: pokemon.id,
      name: pokemon.name,
      types: pokemon.types,
      evolutionStage:
        typeof pokemon.evolutionStage === "number" && Number.isInteger(pokemon.evolutionStage)
          ? pokemon.evolutionStage
          : null,
      evolutionLine: Array.isArray(pokemon.evolutionLine) ? pokemon.evolutionLine : [],
      stats: {
        hp: pokemon.hp,
        attack: pokemon.attack,
        defense: pokemon.defense,
        specialAttack: pokemon.specialAttack,
        specialDefense: pokemon.specialDefense,
        speed: pokemon.speed,
      },
    })),
    summary: {
      typeDistribution,
      averageStats: stats.averageStats,
      shape: stats.shape,
    },
    progression: {
      checkpoint:
        checkpoint === null
          ? null
          : {
              name: checkpoint.name,
              stage: checkpoint.stage,
              gymOrder: checkpoint.gymOrder ?? null,
              primaryTypes: checkpoint.primaryTypes,
              notes: checkpoint.notes ?? null,
              recommendedPlayerLevelRange: checkpoint.recommendedPlayerLevelRange ?? null,
              expectedEvolutionBand: checkpoint.expectedEvolutionBand ?? null,
            },
      storyPhase,
      checkpointEvolutionStageCap,
      checkpointCatchablePokemonNames,
      checkpointCatchablePoolSize,
      checkpointBlockedFinalNames,
      checkpointEvolutionFallbacks,
      assumedTeamForms,
    },
    bossGuidance,
  };
}
