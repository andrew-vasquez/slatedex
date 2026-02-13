import type { Metadata } from "next";
import type { Game } from "@/lib/types";
import { notFound } from "next/navigation";
import { MAINLINE_GAMES } from "@/lib/pokemon";
import { getPokemonByGeneration } from "@/lib/pokeapi";
import TeamBuilder from "@/components/team/TeamBuilder";

export async function generateStaticParams() {
  return MAINLINE_GAMES.map((game: Game) => ({
    gameId: String(game.id),
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ gameId: string }> }): Promise<Metadata> {
  const { gameId } = await params;
  const game = MAINLINE_GAMES.find((g: Game) => g.id === parseInt(gameId));
  if (!game) return {};

  return {
    title: `Build Team — ${game.name} | Pokémon Team Builder`,
    description: `Build your ultimate Pokémon team for ${game.name} set in the ${game.region} region.`,
  };
}

export default async function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const game = MAINLINE_GAMES.find((g: Game) => g.id === parseInt(gameId));

  if (!game) {
    notFound();
  }

  // Server-side data fetching — no waterfalls (§1.4)
  const pokemonData = await getPokemonByGeneration(game.generation);

  return (
    <div className="min-h-screen bg-gray-900">
      <TeamBuilder selectedGame={game} pokemonData={pokemonData} />
    </div>
  );
}
