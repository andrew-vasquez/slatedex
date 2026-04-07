import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import TeamBuilder from "~/features/game/TeamBuilder";
import GameLoadingSkeleton from "~/features/game/GameLoadingSkeleton";
import { getGenerationMeta, parseGenerationSlug } from "@/lib/pokemon";
import { fetchGamePokemonPools } from "~/lib/pokemon-data-api";

export const Route = createFileRoute("/game/$generation")({
  loader: async ({ params }) => {
    if (/^\d+$/.test(params.generation)) {
      throw redirect({
        to: "/game/$generation",
        params: { generation: `gen${params.generation}` },
      });
    }

    const generation = parseGenerationSlug(params.generation);
    if (generation === null) {
      throw notFound();
    }

    const gen = getGenerationMeta(generation);
    if (!gen) {
      throw notFound();
    }

    const initialGame = gen.games[0];
    if (!initialGame) {
      throw notFound();
    }

    const initialPool = await fetchGamePokemonPools(generation, initialGame.id);

    return {
      generation,
      gen,
      initialPoolsByGame: {
        [initialGame.id]: initialPool,
      },
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };

    return {
      meta: [
        {
          title: `Gen ${loaderData.gen.generation} ${loaderData.gen.primaryName} Team Builder | Slatedex`,
        },
        {
          name: "description",
          content: `Build your Pokemon team for Generation ${loaderData.gen.generation} in the ${loaderData.gen.region} region with Slatedex. Analyze type coverage, defensive matchups, and smart picks.`,
        },
      ],
    };
  },
  pendingComponent: GenerationRoutePending,
  component: GenerationPage,
});

function GenerationPage() {
  const { generation, gen, initialPoolsByGame } = Route.useLoaderData();

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-0)" }}>
      <TeamBuilder generation={generation} games={gen.games} initialPoolsByGame={initialPoolsByGame} />
    </div>
  );
}

function GenerationRoutePending() {
  return (
    <div className="min-h-screen" style={{ background: "var(--surface-0)" }}>
      <GameLoadingSkeleton
        title="Loading this generation."
        subtitle="Loading the next builder, regional dex data, and generation-specific game roster."
      />
    </div>
  );
}
