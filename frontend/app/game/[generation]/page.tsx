import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GENERATION_META, getGenerationMeta } from "@/lib/pokemon";
import { getPokemonPoolsForGame } from "@/lib/pokeapi";
import TeamBuilder from "@/components/team/TeamBuilder";

export async function generateStaticParams() {
  return GENERATION_META.map((gen) => ({
    generation: String(gen.generation),
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ generation: string }> }): Promise<Metadata> {
  const { generation: genStr } = await params;
  const gen = getGenerationMeta(parseInt(genStr));
  if (!gen) return {};

  return {
    title: `Gen ${gen.generation} ${gen.primaryName} — ${gen.region} | Slatedex`,
    description: `Build your Pokémon team for Generation ${gen.generation} in the ${gen.region} region. Analyze type coverage, defensive matchups, and smart picks — all with Slatedex.`,
  };
}

export default async function GenerationPage({ params }: { params: Promise<{ generation: string }> }) {
  const { generation: genStr } = await params;
  const generation = parseInt(genStr);
  const gen = getGenerationMeta(generation);

  if (!gen) {
    notFound();
  }

  // Load only the default game pool for initial render; other games are fetched on demand.
  const defaultGame = gen.games[0];
  const defaultPools = await getPokemonPoolsForGame(defaultGame);

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-0)" }}>
      <TeamBuilder
        generation={generation}
        games={gen.games}
        initialPoolsByGame={{ [defaultGame.id]: defaultPools }}
      />
    </div>
  );
}
