import { getPokemonPoolsForGame, getPokemonByGeneration } from "@/lib/pokeapi";

export async function getLightweightPokemonByGeneration(generation: number) {
  const pokemon = await getPokemonByGeneration(generation);
  return pokemon.map(({ id, name, generation: pokemonGeneration, sprite, types }) => ({
    id,
    name,
    generation: pokemonGeneration,
    sprite,
    types,
  }));
}

export async function getInitialPoolForGame(game: Parameters<typeof getPokemonPoolsForGame>[0]) {
  return getPokemonPoolsForGame(game);
}
