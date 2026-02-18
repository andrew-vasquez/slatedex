import { NextResponse } from "next/server";
import { getGamesForGeneration } from "@/lib/pokemon";
import { getPokemonPoolsForGame } from "@/lib/pokeapi";

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const generation = Number(searchParams.get("generation"));
  const gameId = Number(searchParams.get("gameId"));

  if (!Number.isInteger(generation) || !Number.isInteger(gameId)) {
    return NextResponse.json(
      { error: "generation and gameId query params are required integers." },
      { status: 400 }
    );
  }

  const game = getGamesForGeneration(generation).find((entry) => entry.id === gameId);
  if (!game) {
    return NextResponse.json(
      { error: "Game is not available for this generation." },
      { status: 404 }
    );
  }

  try {
    const pools = await getPokemonPoolsForGame(game);
    return NextResponse.json(
      { pools },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to load Pokédex pools." },
      { status: 500 }
    );
  }
}
