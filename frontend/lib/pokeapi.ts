import { cache } from "react";
import Pokedex from "pokedex-promise-v2";
import type { Game, Pokemon, PokemonPools } from "@/lib/types";
import { resolveVersionExclusivity } from "@/lib/versionExclusives";
import { GENERATION_META, NATIONAL_DEX_GAME_ID, getGamesForGeneration } from "@/lib/pokemon";
import { FALLBACK_POKEMON_SPRITE } from "@/lib/image";

const pokedex = new Pokedex({
  cacheLimit: 300 * 1000, // 5-minute cache — covers full build duration
});
const TYPE_INTRO_GENERATION: Partial<Record<string, number>> = {
  dark: 2,
  steel: 2,
  fairy: 6,
};
const GENERATION_NAME_TO_ID: Record<string, number> = {
  "generation-i": 1,
  "generation-ii": 2,
  "generation-iii": 3,
  "generation-iv": 4,
  "generation-v": 5,
  "generation-vi": 6,
  "generation-vii": 7,
  "generation-viii": 8,
  "generation-ix": 9,
};

interface ResolvedRegionalDex {
  dexName: string;
  speciesNames: Set<string>;
  orderBySpecies: Map<string, number>;
}

const pokemonByGenerationCache = new Map<string, Promise<Pokemon[]>>();
const pokemonPoolsByGameCache = new Map<number, Promise<PokemonPools>>();

function titleCasePokemonName(rawName: string): string {
  return rawName
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getPokemonFormKind(rawPokemonName: string, isDefaultForm: boolean): Pokemon["formKind"] {
  if (isDefaultForm) return "base";
  const name = rawPokemonName.toLowerCase();
  if (name.includes("-mega")) return "mega";
  if (name.includes("-primal")) return "primal";
  if (name.includes("-gmax")) return "gigantamax";
  if (
    name.includes("-alola") ||
    name.includes("-galar") ||
    name.includes("-hisui") ||
    name.includes("-paldea")
  ) {
    return "regional";
  }
  return "alternate";
}

function getBestPokemonSprite(sprites: any): string {
  return (
    sprites?.front_default ||
    sprites?.other?.home?.front_default ||
    sprites?.other?.["official-artwork"]?.front_default ||
    sprites?.versions?.["generation-vii"]?.icons?.front_default ||
    sprites?.versions?.["generation-viii"]?.icons?.front_default ||
    FALLBACK_POKEMON_SPRITE
  );
}

function shouldIncludeFormVariety(speciesName: string, variety: any, includeForms: boolean): boolean {
  if (!includeForms) return variety.is_default === true;
  const varietyName = typeof variety?.pokemon?.name === "string" ? variety.pokemon.name : "";
  if (varietyName === "pikachu-starter" || varietyName === "eevee-starter") return false;
  if (speciesName === "koraidon" || speciesName === "miraidon") {
    return variety.is_default === true;
  }
  return true;
}

/**
 * Fetch all Pokémon for generations up to and including the given generation.
 * Uses Promise.all() for parallel fetching (Vercel best practice §1.4).
 */
async function fetchPokemonByGeneration(maxGeneration: number, includeForms = false): Promise<Pokemon[]> {
  const generationIds: number[] = Array.from(
    { length: maxGeneration },
    (_, i) => i + 1
  );

  // Fetch all generation data in parallel
  const generations: any[] = await Promise.all(
    generationIds.map((genId) => pokedex.getGenerationByName(genId))
  );

  // Collect all species URLs from each generation
  const speciesList: { name: string; generation: number }[] = generations.flatMap((gen: any, i: number) =>
    gen.pokemon_species.map((species: any) => ({
      name: species.name,
      generation: i + 1,
    }))
  );

  // Fetch all Pokémon details in parallel (batched to avoid rate limits)
  const BATCH_SIZE = 100;
  const pokemonWithSpeciesData: Array<{
    pokemon: Omit<Pokemon, "isFinalEvolution">;
    speciesName: string;
    evolvesFrom: string | null;
    isLegendary: boolean;
    isMythical: boolean;
  }> = [];

  for (let i = 0; i < speciesList.length; i += BATCH_SIZE) {
    const batch = speciesList.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (species): Promise<Array<{
        pokemon: Omit<Pokemon, "isFinalEvolution">;
        speciesName: string;
        evolvesFrom: string | null;
        isLegendary: boolean;
        isMythical: boolean;
      }> | null> => {
        try {
          const speciesData: any = await pokedex.getPokemonSpeciesByName(species.name);
          const speciesVarieties = Array.isArray(speciesData.varieties) ? speciesData.varieties : [];
          const varietyRefs = speciesVarieties.filter((variety: any) =>
            shouldIncludeFormVariety(species.name, variety, includeForms)
          );
          const normalizedVarietyRefs =
            varietyRefs.length > 0
              ? varietyRefs
              : [{ is_default: true, pokemon: { name: species.name } }];

          return Promise.all(
            normalizedVarietyRefs.map(async (variety: any) => {
              const pokemonData: any = await pokedex.getPokemonByName(variety.pokemon.name);
              return {
                pokemon: mapPokemonData(
                  pokemonData,
                  species.generation,
                  maxGeneration,
                  Boolean(speciesData?.is_legendary),
                  Boolean(speciesData?.is_mythical),
                  {
                    speciesName: species.name,
                    isDefaultForm: variety.is_default === true,
                  }
                ),
                speciesName: species.name,
                evolvesFrom: speciesData.evolves_from_species?.name ?? null,
                isLegendary: Boolean(speciesData?.is_legendary),
                isMythical: Boolean(speciesData?.is_mythical),
              };
            })
          );
        } catch {
          return null;
        }
      })
    );
    pokemonWithSpeciesData.push(
      ...(results.filter(Boolean).flat() as Array<{
        pokemon: Omit<Pokemon, "isFinalEvolution">;
        speciesName: string;
        evolvesFrom: string | null;
        isLegendary: boolean;
        isMythical: boolean;
      }>)
    );
  }

  const evolvesFromBySpecies = new Map<string, string | null>(
    pokemonWithSpeciesData.map((entry) => [entry.speciesName.toLowerCase(), entry.evolvesFrom?.toLowerCase() ?? null])
  );
  const rootSpeciesCache = new Map<string, string>();
  const evolutionLineCache = new Map<string, string[]>();
  const starterRoots = new Set(
    GENERATION_META
      .filter((meta) => meta.generation <= maxGeneration)
      .flatMap((meta) => meta.games.flatMap((game) => game.starters))
      .map((name) => name.toLowerCase())
  );

  const getRootSpecies = (speciesName: string): string => {
    const normalized = speciesName.toLowerCase();
    const cachedRoot = rootSpeciesCache.get(normalized);
    if (cachedRoot) return cachedRoot;

    let current = normalized;
    const seen = new Set<string>();

    while (!seen.has(current)) {
      seen.add(current);
      const evolvesFrom = evolvesFromBySpecies.get(current);
      if (!evolvesFrom) break;
      current = evolvesFrom;
    }

    rootSpeciesCache.set(normalized, current);
    return current;
  };

  const getEvolutionLine = (speciesName: string): string[] => {
    const normalized = speciesName.toLowerCase();
    const cached = evolutionLineCache.get(normalized);
    if (cached) return cached;

    const lineage: string[] = [];
    let current: string | null = normalized;
    const seen = new Set<string>();

    while (current && !seen.has(current)) {
      seen.add(current);
      lineage.push(current);
      current = evolvesFromBySpecies.get(current) ?? null;
    }

    const ordered = lineage.reverse();
    evolutionLineCache.set(normalized, ordered);
    return ordered;
  };

  const speciesWithEvolutions = new Set(
    pokemonWithSpeciesData
      .map((entry) => entry.evolvesFrom)
      .filter((value): value is string => value !== null)
  );

  const allPokemon: Pokemon[] = pokemonWithSpeciesData.map((entry) => {
    const evolutionLine = getEvolutionLine(entry.speciesName);
    return {
      ...entry.pokemon,
      isFinalEvolution: !speciesWithEvolutions.has(entry.speciesName),
      isLegendary: entry.isLegendary,
      isMythical: entry.isMythical,
      isStarterLine: starterRoots.has(getRootSpecies(entry.speciesName)),
      evolutionLine: evolutionLine.map(
        (speciesName) => speciesName.charAt(0).toUpperCase() + speciesName.slice(1)
      ),
      evolutionStage: evolutionLine.length,
    };
  });

  return allPokemon.sort((a, b) => a.id - b.id);
}

export const getPokemonByGeneration = cache(async (
  maxGeneration: number,
  options?: { includeForms?: boolean }
): Promise<Pokemon[]> => {
  const cacheKey = `${maxGeneration}:${options?.includeForms ? "forms" : "base"}`;
  const cached = pokemonByGenerationCache.get(cacheKey);
  if (cached) return cached;

  const request = fetchPokemonByGeneration(maxGeneration, options?.includeForms === true);
  pokemonByGenerationCache.set(cacheKey, request);

  try {
    return await request;
  } catch (error) {
    pokemonByGenerationCache.delete(cacheKey);
    throw error;
  }
});

function getOrderedSpeciesFromDexEntries(entries: any[]): string[] {
  return [...entries]
    .sort((a, b) => a.entry_number - b.entry_number)
    .map((entry: any) => entry.pokemon_species.name);
}

function createSpeciesOrderMap(species: string[]): Map<string, number> {
  return new Map(species.map((name, index) => [name, index]));
}

async function resolveRegionalDexSpecies(candidates: string[]): Promise<ResolvedRegionalDex | null> {
  const results = await Promise.all(
    candidates.map(async (dexName): Promise<ResolvedRegionalDex | null> => {
      try {
        const dexData: any = await pokedex.getPokedexByName(dexName);
        const orderedSpecies = getOrderedSpeciesFromDexEntries(dexData.pokemon_entries);
        const speciesNames = new Set<string>(orderedSpecies);

        if (speciesNames.size > 0) {
          return {
            dexName,
            speciesNames,
            orderBySpecies: createSpeciesOrderMap(orderedSpecies),
          };
        }
      } catch {
        // skip failed candidate
      }
      return null;
    })
  );
  return results.find((r) => r !== null) ?? null;
}

async function resolveRegionalDexSpeciesUnion(
  candidates: string[]
): Promise<ResolvedRegionalDex | null> {
  const uniqueCandidates = [...new Set(candidates)];

  // Fetch all dexes in parallel
  const dexResults = await Promise.all(
    uniqueCandidates.map(async (dexName) => {
      try {
        const dexData: any = await pokedex.getPokedexByName(dexName);
        const dexSpecies = getOrderedSpeciesFromDexEntries(dexData.pokemon_entries);
        return dexSpecies.length > 0 ? { dexName, dexSpecies } : null;
      } catch {
        return null;
      }
    })
  );

  const mergedSpecies = new Set<string>();
  const orderedSpecies: string[] = [];
  const resolvedDexNames: string[] = [];

  for (const result of dexResults) {
    if (!result) continue;
    result.dexSpecies.forEach((name: string) => {
      if (mergedSpecies.has(name)) return;
      mergedSpecies.add(name);
      orderedSpecies.push(name);
    });
    resolvedDexNames.push(result.dexName);
  }

  if (mergedSpecies.size === 0) return null;

  return {
    dexName: resolvedDexNames.join(" + "),
    speciesNames: mergedSpecies,
    orderBySpecies: createSpeciesOrderMap(orderedSpecies),
  };
}

async function resolveRegionalDexFromVersionGroups(
  versionGroupCandidates: string[]
): Promise<ResolvedRegionalDex | null> {
  const dexNameArrays = await Promise.all(
    versionGroupCandidates.map(async (versionGroupName) => {
      try {
        const versionGroup: any = await pokedex.getVersionGroupByName(versionGroupName);
        return (versionGroup.pokedexes as Array<{ name: string }>)
          .map((dex) => dex.name)
          .filter((name) => name !== "national");
      } catch {
        return [];
      }
    })
  );

  const uniqueDexNames = [...new Set(dexNameArrays.flat())];
  if (uniqueDexNames.length === 0) return null;

  return resolveRegionalDexSpeciesUnion(uniqueDexNames);
}

async function resolveRegionalDexFromRegions(
  regionCandidates: string[]
): Promise<ResolvedRegionalDex | null> {
  const dexNameArrays = await Promise.all(
    regionCandidates.map(async (rawRegionName) => {
      const regionName = rawRegionName.toLowerCase().replace(/\s+/g, "-");
      try {
        const region: any = await pokedex.getRegionByName(regionName);
        return (region.pokedexes as Array<{ name: string }>)
          .map((dex) => dex.name)
          .filter((name) => name !== "national");
      } catch {
        return [];
      }
    })
  );

  const uniqueDexNames = [...new Set(dexNameArrays.flat())];
  if (uniqueDexNames.length === 0) return null;

  return resolveRegionalDexSpeciesUnion(uniqueDexNames);
}

async function resolveRegionalDexFromVersionGroupRegions(
  versionGroupCandidates: string[]
): Promise<ResolvedRegionalDex | null> {
  const regionNameArrays = await Promise.all(
    versionGroupCandidates.map(async (versionGroupName) => {
      try {
        const versionGroup: any = await pokedex.getVersionGroupByName(versionGroupName);
        return (versionGroup.regions as Array<{ name: string }>).map((region) => region.name);
      } catch {
        return [];
      }
    })
  );

  const uniqueRegionNames = [...new Set(regionNameArrays.flat())];
  if (uniqueRegionNames.length === 0) return null;

  return resolveRegionalDexFromRegions(uniqueRegionNames);
}

async function resolveRegionalDexForGame(game: Game): Promise<ResolvedRegionalDex | null> {
  // Fire all strategies in parallel, then pick the first successful result by priority order.
  const [fromSpecies, fromVersionGroups, fromVersionGroupRegions, fromRegions] = await Promise.all([
    resolveRegionalDexSpecies(game.regionalDexCandidates),
    resolveRegionalDexFromVersionGroups(game.versionGroupCandidates),
    resolveRegionalDexFromVersionGroupRegions(game.versionGroupCandidates),
    resolveRegionalDexFromRegions([game.region]),
  ]);

  return fromSpecies ?? fromVersionGroups ?? fromVersionGroupRegions ?? fromRegions ?? null;
}

async function resolvePreMainStoryDexForGame(game: Game): Promise<ResolvedRegionalDex | null> {
  const curatedCandidates =
    game.preMainStoryDexCandidates?.filter((candidate) => candidate.trim().length > 0) ?? [];
  if (curatedCandidates.length === 0) return null;
  return resolveRegionalDexSpeciesUnion(curatedCandidates);
}

async function resolvePostgameDexForGame(game: Game): Promise<ResolvedRegionalDex | null> {
  const candidates = game.postgameDexCandidates?.filter((candidate) => candidate.trim().length > 0) ?? [];
  if (candidates.length === 0) return null;
  return resolveRegionalDexSpeciesUnion(candidates);
}

async function fetchPokemonPoolsForGame(game: Game): Promise<PokemonPools> {
  const includeAllForms = game.id === NATIONAL_DEX_GAME_ID;
  const [baseNational, allFormsBase, regionalDex, preMainStoryDex, postgameDex] = await Promise.all([
    getPokemonByGeneration(game.generation),
    includeAllForms ? getPokemonByGeneration(game.generation, { includeForms: true }) : Promise.resolve(null),
    resolveRegionalDexForGame(game),
    resolvePreMainStoryDexForGame(game),
    resolvePostgameDexForGame(game),
  ]);

  const preMainStorySpecies = preMainStoryDex?.speciesNames ?? null;
  const explicitPostgameSpecies = postgameDex?.speciesNames ?? null;
  const gameVersionIds = game.versions.map((version) => version.id.toLowerCase());
  const national = baseNational.map((pokemon) => {
    const { gameIndexVersionIds, ...pokemonWithoutGameIndexVersionIds } = pokemon;
    const exclusivity = resolveVersionExclusivity({
      gameId: game.id,
      speciesName: pokemon.name.toLowerCase(),
      gameVersionIds,
      gameIndexVersionIds,
    });
    const speciesName = (pokemon.baseSpeciesName ?? pokemon.name).toLowerCase();
    const isOutsidePreMainStoryDex = preMainStorySpecies ? !preMainStorySpecies.has(speciesName) : false;
    const isExplicitPostgameDex = explicitPostgameSpecies?.has(speciesName) ?? false;

    return {
      ...pokemonWithoutGameIndexVersionIds,
      // gameIndexVersionIds is used only for server-side exclusivity inference and is omitted from the client payload.
      ...exclusivity,
      isPostgame: isOutsidePreMainStoryDex || isExplicitPostgameDex,
    };
  });

  const allForms = (allFormsBase ?? []).map((pokemon) => {
    const { gameIndexVersionIds, ...pokemonWithoutGameIndexVersionIds } = pokemon;
    return pokemonWithoutGameIndexVersionIds;
  });

  if (!regionalDex) {
    return {
      national,
      regional: [],
      allForms,
      regionalResolved: false,
      regionalDexName: null,
      allFormsResolved: allForms.length > 0,
    };
  }

  const starterOrder = new Map(game.starters.map((speciesName, index) => [speciesName.toLowerCase(), index]));
  const regional = national
    .filter((pokemon) => regionalDex.speciesNames.has((pokemon.baseSpeciesName ?? pokemon.name).toLowerCase()))
    .sort((a, b) => {
      const aSpeciesName = (a.baseSpeciesName ?? a.name).toLowerCase();
      const bSpeciesName = (b.baseSpeciesName ?? b.name).toLowerCase();
      const aStarterIndex = starterOrder.get(aSpeciesName);
      const bStarterIndex = starterOrder.get(bSpeciesName);
      const aIsStarter = aStarterIndex !== undefined;
      const bIsStarter = bStarterIndex !== undefined;

      if (aIsStarter || bIsStarter) {
        if (aIsStarter && bIsStarter) return aStarterIndex - bStarterIndex;
        return aIsStarter ? -1 : 1;
      }

      const aIndex = regionalDex.orderBySpecies.get(aSpeciesName) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = regionalDex.orderBySpecies.get(bSpeciesName) ?? Number.MAX_SAFE_INTEGER;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.id - b.id;
    });
  const regionalResolved = regional.length > 0;

  return {
    national,
    regional,
    allForms,
    regionalResolved,
    regionalDexName: regionalResolved ? regionalDex.dexName : null,
    allFormsResolved: allForms.length > 0,
  };
}

export async function getPokemonPoolsForGame(game: Game): Promise<PokemonPools> {
  const cached = pokemonPoolsByGameCache.get(game.id);
  if (cached) return cached;

  const request = fetchPokemonPoolsForGame(game);
  pokemonPoolsByGameCache.set(game.id, request);

  try {
    return await request;
  } catch (error) {
    pokemonPoolsByGameCache.delete(game.id);
    throw error;
  }
}

/**
 * Fetch Pokemon pools for all games in a generation.
 * Wrapped with React.cache() for per-request deduplication (e.g., generateMetadata + page).
 * Returns a Record keyed by game ID.
 */
export const getPokemonPoolsForGeneration = cache(async (
  generation: number
): Promise<Record<number, PokemonPools>> => {
  const games = getGamesForGeneration(generation);
  const poolEntries = await Promise.all(
    games.map(async (game) => {
      const pools = await getPokemonPoolsForGame(game);
      return [game.id, pools] as const;
    })
  );
  return Object.fromEntries(poolEntries);
});

function mapPokemonData(
  pokemon: any,
  generation: number,
  rulesGeneration: number,
  isLegendary: boolean,
  isMythical: boolean,
  formMetadata?: {
    speciesName: string;
    isDefaultForm: boolean;
  }
): Omit<Pokemon, "isFinalEvolution"> {
  const stats: {
    hp?: number;
    attack?: number;
    defense?: number;
    specialAttack?: number;
    specialDefense?: number;
    speed?: number;
  } = {};
  for (const stat of pokemon.stats) {
    const name: string = stat.stat.name;
    if (name === "hp") stats.hp = stat.base_stat;
    else if (name === "attack") stats.attack = stat.base_stat;
    else if (name === "defense") stats.defense = stat.base_stat;
    else if (name === "special-attack") stats.specialAttack = stat.base_stat;
    else if (name === "special-defense") stats.specialDefense = stat.base_stat;
    else if (name === "speed") stats.speed = stat.base_stat;
  }

  const currentTypes: string[] = pokemon.types.map((t: any) => t.type.name);
  const pastTypes: Array<{ generation?: { name?: string }; types?: Array<{ type: { name: string } }> }> =
    Array.isArray(pokemon.past_types) ? pokemon.past_types : [];

  const matchingPastType = pastTypes
    .map((entry) => ({
      types: (entry.types ?? []).map((item) => item.type.name),
      lastGenerationWithTypes: GENERATION_NAME_TO_ID[entry.generation?.name ?? ""],
    }))
    .filter((entry) => Number.isFinite(entry.lastGenerationWithTypes) && rulesGeneration <= entry.lastGenerationWithTypes)
    .sort((a, b) => a.lastGenerationWithTypes - b.lastGenerationWithTypes)[0];

  const generationTypes = matchingPastType?.types.length ? matchingPastType.types : currentTypes;
  const generationFilteredTypes: string[] = generationTypes.filter((type: string) => {
    const introducedIn = TYPE_INTRO_GENERATION[type] ?? 1;
    return introducedIn <= rulesGeneration;
  });
  const finalTypes = generationFilteredTypes.length > 0 ? generationFilteredTypes : generationTypes;
  const rawPokemonName = typeof pokemon.name === "string" ? pokemon.name : "";
  const baseSpeciesName = formMetadata?.speciesName ?? rawPokemonName;
  const isDefaultForm = formMetadata?.isDefaultForm ?? true;

  return {
    id: pokemon.id,
    name: titleCasePokemonName(rawPokemonName || baseSpeciesName),
    types: finalTypes,
    generation,
    baseSpeciesName,
    formName: isDefaultForm ? undefined : titleCasePokemonName(rawPokemonName),
    formKind: getPokemonFormKind(rawPokemonName, isDefaultForm),
    isDefaultForm,
    hp: stats.hp || 0,
    attack: stats.attack || 0,
    defense: stats.defense || 0,
    specialAttack: stats.specialAttack || 0,
    specialDefense: stats.specialDefense || 0,
    speed: stats.speed || 0,
    sprite: getBestPokemonSprite(pokemon.sprites),
    isLegendary,
    isMythical,
    gameIndexVersionIds: ((pokemon.game_indices ?? []) as Array<{ version?: { name?: string } }>)
      .map((entry) => entry.version?.name)
      .filter((name): name is string => typeof name === "string"),
  };
}
