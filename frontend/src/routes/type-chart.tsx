import { createFileRoute } from "@tanstack/react-router";
import RoutePageSkeleton from "~/components/ui/RoutePageSkeleton";
import TypeChartClient from "~/features/type-chart/TypeChartClient";
import WeaknessHeader from "~/features/weaknesses/WeaknessHeader";
import { getGenerationPokemonList } from "~/lib/pokemon-data.functions";

export const Route = createFileRoute("/type-chart")({
  loader: async () => {
    return getGenerationPokemonList({ data: { generation: 9 } });
  },
  head: () => ({
    meta: [
      { title: "Pokemon Type Chart | Slatedex" },
      {
        name: "description",
        content:
          "Explore every Pokemon type's offensive strengths and defensive weaknesses, then search any Pokemon to inspect its typing with the same fast Slatedex tools.",
      },
    ],
  }),
  pendingComponent: () => (
    <RoutePageSkeleton
      eyebrow="Loading Type Chart"
      title="Opening type chart"
      description="Loading type matchup matrix and Pokemon search data."
      compact
    />
  ),
  component: TypeChartPage,
});

function TypeChartPage() {
  const pokemon = Route.useLoaderData();

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
        <TypeChartClient pokemon={pokemon} />
      </main>
    </div>
  );
}
