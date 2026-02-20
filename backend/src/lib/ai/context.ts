import type { BossGuideEntry, TeamContextPayload, TeamPokemonContext } from "./types";

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
  const enforcePool = dexMode === "regional" || versionFilterEnabled;

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
    bossGuidance,
  };
}
