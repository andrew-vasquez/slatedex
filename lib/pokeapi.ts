import Pokedex from "pokedex-promise-v2";
import type { Game, Pokemon, PokemonPools } from "@/lib/types";

const pokedex = new Pokedex();
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

/**
 * Fetch all Pokémon for generations up to and including the given generation.
 * Uses Promise.all() for parallel fetching (Vercel best practice §1.4).
 */
export async function getPokemonByGeneration(maxGeneration: number): Promise<Pokemon[]> {
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
  const BATCH_SIZE = 50;
  const pokemonWithSpeciesData: Array<{
    pokemon: Omit<Pokemon, "isFinalEvolution">;
    speciesName: string;
    evolvesFrom: string | null;
  }> = [];

  for (let i = 0; i < speciesList.length; i += BATCH_SIZE) {
    const batch = speciesList.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (species): Promise<{
        pokemon: Omit<Pokemon, "isFinalEvolution">;
        speciesName: string;
        evolvesFrom: string | null;
      } | null> => {
        try {
          const [pokemonData, speciesData]: any[] = await Promise.all([
            pokedex.getPokemonByName(species.name),
            pokedex.getPokemonSpeciesByName(species.name),
          ]);
          return {
            pokemon: mapPokemonData(pokemonData, species.generation, maxGeneration),
            speciesName: species.name,
            evolvesFrom: speciesData.evolves_from_species?.name ?? null,
          };
        } catch {
          return null;
        }
      })
    );
    pokemonWithSpeciesData.push(
      ...(results.filter(Boolean) as Array<{
        pokemon: Omit<Pokemon, "isFinalEvolution">;
        speciesName: string;
        evolvesFrom: string | null;
      }>)
    );
  }

  const speciesWithEvolutions = new Set(
    pokemonWithSpeciesData
      .map((entry) => entry.evolvesFrom)
      .filter((value): value is string => value !== null)
  );

  const allPokemon: Pokemon[] = pokemonWithSpeciesData.map((entry) => ({
    ...entry.pokemon,
    isFinalEvolution: !speciesWithEvolutions.has(entry.speciesName),
  }));

  return allPokemon.sort((a, b) => a.id - b.id);
}

function getOrderedSpeciesFromDexEntries(entries: any[]): string[] {
  return [...entries]
    .sort((a, b) => a.entry_number - b.entry_number)
    .map((entry: any) => entry.pokemon_species.name);
}

function createSpeciesOrderMap(species: string[]): Map<string, number> {
  return new Map(species.map((name, index) => [name, index]));
}

async function resolveRegionalDexSpecies(candidates: string[]): Promise<ResolvedRegionalDex | null> {
  for (const dexName of candidates) {
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
      // try next candidate
    }
  }

  return null;
}

async function resolveRegionalDexSpeciesUnion(
  candidates: string[]
): Promise<ResolvedRegionalDex | null> {
  const uniqueCandidates = [...new Set(candidates)];
  const mergedSpecies = new Set<string>();
  const orderedSpecies: string[] = [];
  const resolvedDexNames: string[] = [];

  for (const dexName of uniqueCandidates) {
    try {
      const dexData: any = await pokedex.getPokedexByName(dexName);
      const dexSpecies = getOrderedSpeciesFromDexEntries(dexData.pokemon_entries);

      if (dexSpecies.length === 0) continue;

      dexSpecies.forEach((name: string) => {
        if (mergedSpecies.has(name)) return;
        mergedSpecies.add(name);
        orderedSpecies.push(name);
      });
      resolvedDexNames.push(dexName);
    } catch {
      // try next candidate
    }
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
  const regionalDexNames: string[] = [];

  for (const versionGroupName of versionGroupCandidates) {
    try {
      const versionGroup: any = await pokedex.getVersionGroupByName(versionGroupName);
      const dexNames = (versionGroup.pokedexes as Array<{ name: string }>)
        .map((dex) => dex.name)
        .filter((name) => name !== "national");
      regionalDexNames.push(...dexNames);
    } catch {
      // try next version group
    }
  }

  const uniqueDexNames = [...new Set(regionalDexNames)];
  if (uniqueDexNames.length === 0) return null;

  return resolveRegionalDexSpeciesUnion(uniqueDexNames);
}

async function resolveRegionalDexFromRegions(
  regionCandidates: string[]
): Promise<ResolvedRegionalDex | null> {
  const regionalDexNames: string[] = [];

  for (const rawRegionName of regionCandidates) {
    const regionName = rawRegionName.toLowerCase().replace(/\s+/g, "-");

    try {
      const region: any = await pokedex.getRegionByName(regionName);
      const dexNames = (region.pokedexes as Array<{ name: string }>)
        .map((dex) => dex.name)
        .filter((name) => name !== "national");

      regionalDexNames.push(...dexNames);
    } catch {
      // try next region
    }
  }

  const uniqueDexNames = [...new Set(regionalDexNames)];
  if (uniqueDexNames.length === 0) return null;

  return resolveRegionalDexSpeciesUnion(uniqueDexNames);
}

async function resolveRegionalDexFromVersionGroupRegions(
  versionGroupCandidates: string[]
): Promise<ResolvedRegionalDex | null> {
  const regionNames: string[] = [];

  for (const versionGroupName of versionGroupCandidates) {
    try {
      const versionGroup: any = await pokedex.getVersionGroupByName(versionGroupName);
      const names = (versionGroup.regions as Array<{ name: string }>).map((region) => region.name);
      regionNames.push(...names);
    } catch {
      // try next version group
    }
  }

  const uniqueRegionNames = [...new Set(regionNames)];
  if (uniqueRegionNames.length === 0) return null;

  return resolveRegionalDexFromRegions(uniqueRegionNames);
}

export async function getPokemonPoolsForGame(game: Game): Promise<PokemonPools> {
  const national = await getPokemonByGeneration(game.generation);
  const regionalDexCandidates = [
    () => resolveRegionalDexSpecies(game.regionalDexCandidates),
    () => resolveRegionalDexFromVersionGroups(game.versionGroupCandidates),
    () => resolveRegionalDexFromVersionGroupRegions(game.versionGroupCandidates),
    () => resolveRegionalDexFromRegions([game.region]),
  ];

  let regionalDex: ResolvedRegionalDex | null = null;
  for (const resolveCandidate of regionalDexCandidates) {
    regionalDex = await resolveCandidate();
    if (regionalDex) break;
  }

  if (!regionalDex) {
    return {
      national,
      regional: [],
      regionalResolved: false,
      regionalDexName: null,
    };
  }

  const regional = national
    .filter((pokemon) => regionalDex.speciesNames.has(pokemon.name.toLowerCase()))
    .sort((a, b) => {
      const aIndex = regionalDex.orderBySpecies.get(a.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = regionalDex.orderBySpecies.get(b.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.id - b.id;
    });
  const regionalResolved = regional.length > 0;

  return {
    national,
    regional,
    regionalResolved,
    regionalDexName: regionalResolved ? regionalDex.dexName : null,
  };
}

function mapPokemonData(pokemon: any, generation: number, rulesGeneration: number): Omit<Pokemon, "isFinalEvolution"> {
  const stats: { hp?: number; attack?: number; defense?: number } = {};
  for (const stat of pokemon.stats) {
    const name: string = stat.stat.name;
    if (name === "hp") stats.hp = stat.base_stat;
    else if (name === "attack") stats.attack = stat.base_stat;
    else if (name === "defense") stats.defense = stat.base_stat;
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

  return {
    id: pokemon.id,
    name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
    types: finalTypes,
    generation,
    hp: stats.hp || 0,
    attack: stats.attack || 0,
    defense: stats.defense || 0,
    sprite: pokemon.sprites.front_default || "",
  };
}
