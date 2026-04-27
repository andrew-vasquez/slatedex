import { Hono } from "hono";
import { getPokemonByGeneration, getPokemonPoolsForGame } from "../lib/pokemon-data/pokeapi";
import { getGamesForGeneration, isNationalDexGame, NATIONAL_DEX_GAME } from "../lib/pokemon-data/pokemon";

const pokemonData = new Hono();
const CACHE_CONTROL_HEADER = "public, s-maxage=3600, stale-while-revalidate=86400";

pokemonData.get("/pokemon/generation", async (c) => {
  const generation = Number(new URL(c.req.url).searchParams.get("generation"));
  if (!Number.isInteger(generation) || generation < 1 || generation > 9) {
    return c.json({ error: "generation query param must be an integer from 1 to 9." }, 400);
  }

  try {
    const pokemon = await getPokemonByGeneration(generation);
    const lightweightPokemon = pokemon.map(({ id, name, generation: pokemonGeneration, sprite, types }) => ({
      id,
      name,
      generation: pokemonGeneration,
      sprite,
      types,
    }));

    c.header("Cache-Control", CACHE_CONTROL_HEADER);
    return c.json({ pokemon: lightweightPokemon });
  } catch {
    return c.json({ error: "Failed to load Pokemon list." }, 500);
  }
});

pokemonData.get("/pokemon/pools", async (c) => {
  const searchParams = new URL(c.req.url).searchParams;
  const generation = Number(searchParams.get("generation"));
  const gameId = Number(searchParams.get("gameId"));

  if (!Number.isInteger(generation) || !Number.isInteger(gameId)) {
    return c.json({ error: "generation and gameId query params are required integers." }, 400);
  }

  const game = isNationalDexGame(generation, gameId)
    ? NATIONAL_DEX_GAME
    : getGamesForGeneration(generation).find((entry) => entry.id === gameId);
  if (!game) {
    return c.json({ error: "Game is not available for this generation." }, 404);
  }

  try {
    const pools = await getPokemonPoolsForGame(game);
    c.header("Cache-Control", CACHE_CONTROL_HEADER);
    return c.json({ pools });
  } catch {
    return c.json({ error: "Failed to load Pokedex pools." }, 500);
  }
});

export default pokemonData;
