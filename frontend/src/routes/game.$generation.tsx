import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import TeamBuilder from "~/features/game/TeamBuilder";
import {
  NATIONAL_DEX_GAME,
  NATIONAL_DEX_GAME_ID,
  NATIONAL_DEX_GENERATION,
  getGenerationMeta,
  isNationalDexSlug,
  parseGenerationSlug,
} from "@/lib/pokemon";
import { fetchGamePokemonPools } from "~/lib/pokemon-data-api";

export const Route = createFileRoute("/game/$generation")({
  loader: async ({ params }) => {
    if (/^\d+$/.test(params.generation)) {
      throw redirect({
        to: "/game/$generation",
        params: { generation: `gen${params.generation}` },
      });
    }

    if (isNationalDexSlug(params.generation)) {
      const initialPool = await fetchGamePokemonPools(NATIONAL_DEX_GENERATION, NATIONAL_DEX_GAME_ID);

      return {
        generation: NATIONAL_DEX_GENERATION,
        gen: null,
        isNationalDex: true,
        initialPoolsByGame: {
          [NATIONAL_DEX_GAME_ID]: initialPool,
        },
      };
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
      isNationalDex: false,
      initialPoolsByGame: {
        [initialGame.id]: initialPool,
      },
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };

    if (loaderData.isNationalDex) {
      return {
        meta: [
          {
            title: "National Dex Sandbox Team Builder | Slatedex",
          },
          {
            name: "description",
            content: "Build a sandbox Pokemon team with every Pokemon and supported form in Slatedex. Analyze coverage, defensive matchups, and smart picks.",
          },
        ],
      };
    }

    const gen = loaderData.gen;
    if (!gen) return { meta: [] };

    return {
      meta: [
        {
          title: `Gen ${gen.generation} ${gen.primaryName} Team Builder | Slatedex`,
        },
        {
          name: "description",
          content: `Build your Pokemon team for Generation ${gen.generation} in the ${gen.region} region with Slatedex. Analyze type coverage, defensive matchups, and smart picks.`,
        },
      ],
    };
  },
  component: GenerationPage,
});

function GenerationPage() {
  const { generation, gen, isNationalDex, initialPoolsByGame } = Route.useLoaderData();
  const games = isNationalDex ? [NATIONAL_DEX_GAME] : (gen?.games ?? []);

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-0)" }}>
      <TeamBuilder
        key={isNationalDex ? "national-dex" : `generation-${generation}`}
        generation={generation}
        games={games}
        initialPoolsByGame={initialPoolsByGame}
        builderMode={isNationalDex ? "national" : "game"}
      />
    </div>
  );
}
