import type { Pokemon, PokemonPools } from "@/lib/types";
import { getClientSafeApiBaseUrl } from "@/lib/backend-url";

function getPokemonDataApiBaseUrl() {
  return getClientSafeApiBaseUrl();
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getPokemonDataApiBaseUrl()}${path}`, {
    method: "GET",
    cache: "force-cache",
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function shouldShowAllFormsPokemon(pokemon: Pokemon): boolean {
  const pokemonName = pokemon.name.toLowerCase().replace(/\s+/g, "-");
  if (pokemonName === "pikachu-starter" || pokemonName === "eevee-starter") return false;

  const speciesName = (pokemon.baseSpeciesName ?? pokemon.name).toLowerCase();
  if (speciesName !== "koraidon" && speciesName !== "miraidon") return true;
  return pokemon.isDefaultForm !== false;
}

export async function fetchGenerationPokemonList(generation: number): Promise<Pokemon[]> {
  const data = await fetchJson<{ pokemon: Pokemon[] }>(`/api/pokemon/generation?generation=${generation}`);
  return data.pokemon;
}

export async function fetchGamePokemonPools(generation: number, gameId: number): Promise<PokemonPools> {
  const data = await fetchJson<{ pools: PokemonPools }>(
    `/api/pokemon/pools?generation=${generation}&gameId=${gameId}`
  );
  return {
    ...data.pools,
    allForms: (data.pools.allForms ?? []).filter(shouldShowAllFormsPokemon),
    allFormsResolved: data.pools.allFormsResolved ?? false,
  };
}
