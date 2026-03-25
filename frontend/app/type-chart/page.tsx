import type { Metadata } from "next";
import WeaknessHeader from "@/app/weaknesses/WeaknessHeader";
import TypeChartClient from "@/app/type-chart/TypeChartClient";
import { getPokemonByGeneration } from "@/lib/pokeapi";

export const metadata: Metadata = {
  title: "Pokemon Type Chart | Slatedex",
  description:
    "Explore every Pokemon type's offensive strengths and defensive weaknesses, then search any Pokemon to inspect its typing with the same fast Slatedex tools.",
};

export const revalidate = 604800;

export default async function TypeChartPage() {
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

      <WeaknessHeader currentTool="type-chart" subtitle="Pokemon type chart" />

      <main className="relative z-[1] mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-10">
        <TypeChartClient pokemon={lightweightPokemon} />
      </main>
    </div>
  );
}
