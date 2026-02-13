import Pokedex from "pokedex-promise-v2";
import type { Pokemon } from "@/lib/types";

const pokedex = new Pokedex();

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
  const allPokemon: Pokemon[] = [];

  for (let i = 0; i < speciesList.length; i += BATCH_SIZE) {
    const batch = speciesList.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (species): Promise<Pokemon | null> => {
        try {
          const pokemon: any = await pokedex.getPokemonByName(species.name);
          return mapPokemonData(pokemon, species.generation);
        } catch {
          return null;
        }
      })
    );
    allPokemon.push(...(results.filter(Boolean) as Pokemon[]));
  }

  return allPokemon.sort((a, b) => a.id - b.id);
}

function mapPokemonData(pokemon: any, generation: number): Pokemon {
  const stats: { hp?: number; attack?: number; defense?: number } = {};
  for (const stat of pokemon.stats) {
    const name: string = stat.stat.name;
    if (name === "hp") stats.hp = stat.base_stat;
    else if (name === "attack") stats.attack = stat.base_stat;
    else if (name === "defense") stats.defense = stat.base_stat;
  }

  return {
    id: pokemon.id,
    name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
    types: pokemon.types.map((t: any) => t.type.name),
    generation,
    hp: stats.hp || 0,
    attack: stats.attack || 0,
    defense: stats.defense || 0,
    sprite: pokemon.sprites.front_default || "",
  };
}
