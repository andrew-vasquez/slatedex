import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GENERATION_META, getGenerationMeta, getGenerationSlug, parseGenerationSlug } from "@/lib/pokemon";
import { getPokemonPoolsForGame } from "@/lib/pokeapi";
import TeamBuilder from "@/app/game/TeamBuilder";

export async function generateStaticParams() {
  return GENERATION_META.map((gen) => ({
    generation: getGenerationSlug(gen.generation),
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ generation: string }> }): Promise<Metadata> {
  const { generation: slug } = await params;
  const generation = parseGenerationSlug(slug);
  if (generation === null) return {};
  const gen = getGenerationMeta(generation);
  if (!gen) return {};

  return {
    title: `Gen ${gen.generation} ${gen.primaryName} — ${gen.region} | Slatedex`,
    description: `Build your Pokémon team for Generation ${gen.generation} in the ${gen.region} region. Analyze type coverage, defensive matchups, and smart picks — all with Slatedex.`,
  };
}

export default async function GenerationPage({ params }: { params: Promise<{ generation: string }> }) {
  const { generation: slug } = await params;
  const generation = parseGenerationSlug(slug);
  if (generation === null) {
    notFound();
  }
  const gen = getGenerationMeta(generation);

  if (!gen) {
    notFound();
  }
  const initialGame = gen.games[0];
  if (!initialGame) {
    notFound();
  }
  const initialPool = await getPokemonPoolsForGame(initialGame);
  const initialPoolsByGame = {
    [initialGame.id]: initialPool,
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-0)" }}>
      <TeamBuilder
        generation={generation}
        games={gen.games}
        initialPoolsByGame={initialPoolsByGame}
      />
    </div>
  );
}
