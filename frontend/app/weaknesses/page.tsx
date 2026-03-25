import type { Metadata } from "next";
import { getPokemonByGeneration } from "@/lib/pokeapi";
import WeaknessLookupClient from "@/app/weaknesses/WeaknessLookupClient";
import WeaknessHeader from "@/app/weaknesses/WeaknessHeader";

export const metadata: Metadata = {
  title: "Pokemon Weakness Lookup | Slatedex",
  description:
    "Quickly tap any Pokemon and see its full defensive type chart, including 4x weaknesses, 2x weaknesses, resists, and immunities.",
};

export const revalidate = 604800;

export default async function WeaknessesPage() {
  const pokemon = await getPokemonByGeneration(9);
  const lightweightPokemon = pokemon.map(({ id, name, generation, sprite, types }) => ({
    id,
    name,
    generation,
    sprite,
    types,
  }));

  return (
    <div className="landing-page-shell min-h-screen">
      <div className="landing-page-blur-layer" aria-hidden="true" />
      <div className="landing-page-atmosphere" aria-hidden="true">
        <div className="landing-page-grid" />
        <div className="landing-hero-orb landing-hero-orb-a" />
        <div className="landing-hero-orb landing-hero-orb-b" />
      </div>

      <WeaknessHeader />

      <main className="relative z-[1] mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-10">
        <WeaknessLookupClient pokemon={lightweightPokemon} />
      </main>
    </div>
  );
}
