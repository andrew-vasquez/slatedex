import { createFileRoute } from "@tanstack/react-router";
import RoutePageSkeleton from "~/components/ui/RoutePageSkeleton";
import WeaknessHeader from "~/features/weaknesses/WeaknessHeader";
import WeaknessLookupClient from "~/features/weaknesses/WeaknessLookupClient";
import { fetchGenerationPokemonList } from "~/lib/pokemon-data-api";

export const Route = createFileRoute("/weaknesses")({
  loader: async () => {
    return fetchGenerationPokemonList(9);
  },
  head: () => ({
    meta: [
      { title: "Pokemon Weakness Lookup | Slatedex" },
      {
        name: "description",
        content:
          "Quickly tap any Pokemon and see its full defensive type chart, including 4x weaknesses, 2x weaknesses, resists, and immunities.",
      },
    ],
  }),
  pendingComponent: () => (
    <RoutePageSkeleton
      eyebrow="Loading Weaknesses"
      title="Opening weakness lookup"
      description="Loading Pokemon roster and defensive matchup data."
      compact
    />
  ),
  component: WeaknessesPage,
});

function WeaknessesPage() {
  const pokemon = Route.useLoaderData();

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
        <WeaknessLookupClient pokemon={pokemon} />
      </main>
    </div>
  );
}
