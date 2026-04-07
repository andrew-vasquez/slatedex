import type { Pokemon, PokemonPools } from "@/lib/types";
import { BACKEND_PROXY_PATH, getExternalApiBaseUrl } from "@/lib/backend-url";

function getPokemonDataApiBaseUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${BACKEND_PROXY_PATH}`;
  }

  return getExternalApiBaseUrl();
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

export async function fetchGenerationPokemonList(generation: number): Promise<Pokemon[]> {
  const data = await fetchJson<{ pokemon: Pokemon[] }>(`/api/pokemon/generation?generation=${generation}`);
  return data.pokemon;
}

export async function fetchGamePokemonPools(generation: number, gameId: number): Promise<PokemonPools> {
  const data = await fetchJson<{ pools: PokemonPools }>(
    `/api/pokemon/pools?generation=${generation}&gameId=${gameId}`
  );
  return data.pools;
}
