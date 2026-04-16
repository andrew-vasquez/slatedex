import { useCallback, useEffect, useState } from "react";
import { fetchGenerationPokemonList } from "~/lib/pokemon-data-api";
import type { Pokemon } from "@/lib/types";

const CACHE_KEY_PREFIX = "slatedex:generation-pokemon";

function getCacheKey(generation: number): string {
  return `${CACHE_KEY_PREFIX}:${generation}`;
}

function readCachedPokemon(generation: number): Pokemon[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(getCacheKey(generation));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Pokemon[]) : [];
  } catch {
    return [];
  }
}

function writeCachedPokemon(generation: number, pokemon: Pokemon[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getCacheKey(generation), JSON.stringify(pokemon));
  } catch {
    // Ignore storage write failures.
  }
}

export function useGenerationPokemonList(generation: number) {
  const [pokemon, setPokemon] = useState<Pokemon[]>(() => readCachedPokemon(generation));
  const [isLoading, setIsLoading] = useState(() => pokemon.length === 0);
  const [error, setError] = useState<string | null>(null);

  const loadPokemon = useCallback(async () => {
    const cachedPokemon = readCachedPokemon(generation);
    setIsLoading(cachedPokemon.length === 0);
    setError(null);

    try {
      const nextPokemon = await fetchGenerationPokemonList(generation);
      setPokemon(nextPokemon);
      writeCachedPokemon(generation, nextPokemon);
    } catch (caughtError) {
      if (cachedPokemon.length > 0) {
        setPokemon(cachedPokemon);
        setError("Pokemon search data could not refresh. Showing the last cached roster instead.");
        return;
      }

      setError(caughtError instanceof Error ? caughtError.message : "Pokemon search data could not load.");
    } finally {
      setIsLoading(false);
    }
  }, [generation]);

  useEffect(() => {
    void loadPokemon();
  }, [loadPokemon]);

  return {
    pokemon,
    isLoading,
    error,
    retry: loadPokemon,
  };
}
