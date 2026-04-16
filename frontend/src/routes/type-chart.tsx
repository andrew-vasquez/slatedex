import { createFileRoute } from "@tanstack/react-router";
import { FiRefreshCw } from "react-icons/fi";
import SiteFooter from "@/components/ui/SiteFooter";
import RoutePageSkeleton from "~/components/ui/RoutePageSkeleton";
import { useGenerationPokemonList } from "~/hooks/useGenerationPokemonList";
import TypeChartClient from "~/features/type-chart/TypeChartClient";
import WeaknessHeader from "~/features/weaknesses/WeaknessHeader";

export const Route = createFileRoute("/type-chart")({
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
  component: TypeChartPage,
});

function TypeChartPage() {
  const { pokemon, isLoading, error, retry } = useGenerationPokemonList(9);

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
        {isLoading && pokemon.length === 0 ? (
          <RoutePageSkeleton
            eyebrow="Loading Type Chart"
            title="Opening type chart"
            description="Loading type matchup matrix and Pokemon search data."
            compact
          />
        ) : (
          <>
            {error ? (
              <div className="panel mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {error}
                </p>
                <button type="button" onClick={() => void retry()} className="auth-submit inline-flex items-center justify-center gap-2 self-start sm:self-auto">
                  <FiRefreshCw size={15} aria-hidden="true" />
                  Refresh roster
                </button>
              </div>
            ) : null}
            <TypeChartClient pokemon={pokemon} />
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
