import { createFileRoute } from "@tanstack/react-router";
import { FiRefreshCw } from "react-icons/fi";
import SiteFooter from "@/components/ui/SiteFooter";
import RoutePageSkeleton from "~/components/ui/RoutePageSkeleton";
import { useGenerationPokemonList } from "~/hooks/useGenerationPokemonList";
import WeaknessHeader from "~/features/weaknesses/WeaknessHeader";
import WeaknessLookupClient from "~/features/weaknesses/WeaknessLookupClient";

export const Route = createFileRoute("/weaknesses")({
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
  component: WeaknessesPage,
});

function WeaknessesPage() {
  const { pokemon, isLoading, error, retry } = useGenerationPokemonList(9);

  return (
    <div className="landing-page-shell min-h-screen">
      <WeaknessHeader />

      <main className="relative z-[1] mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-10">
        {isLoading && pokemon.length === 0 ? (
          <RoutePageSkeleton
            eyebrow="Loading Weaknesses"
            title="Opening weakness lookup"
            description="Loading Pokemon roster and defensive matchup data."
            compact
          />
        ) : pokemon.length > 0 ? (
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
            <WeaknessLookupClient pokemon={pokemon} />
          </>
        ) : (
          <div className="panel flex flex-col gap-4 text-left">
            <div>
              <p className="weakness-kicker">Roster unavailable</p>
              <h2 className="font-display text-2xl" style={{ color: "var(--text-primary)" }}>
                The weakness tool could not load Pokemon data right now.
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Retry the roster fetch. If this keeps failing, the production API URL is likely misconfigured.
              </p>
            </div>
            <div>
              <button type="button" onClick={() => void retry()} className="auth-submit inline-flex items-center justify-center gap-2">
                <FiRefreshCw size={15} aria-hidden="true" />
                Retry loading
              </button>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
