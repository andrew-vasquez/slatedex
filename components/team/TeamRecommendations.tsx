"use client";

import Image from "next/image";
import type { Pokemon } from "@/lib/types";

interface Recommendation {
  pokemon: Pokemon;
  score: number;
  covers: string[];
  risky: string[];
}

interface TeamRecommendationsProps {
  recommendations: Recommendation[];
  exposedTypes: string[];
  teamFull: boolean;
  finalEvolutionOnly: boolean;
  onToggleFinalEvolutionOnly: (enabled: boolean) => void;
  onAddPokemon: (pokemon: Pokemon) => void;
}

const TeamRecommendations = ({
  recommendations,
  exposedTypes,
  teamFull,
  finalEvolutionOnly,
  onToggleFinalEvolutionOnly,
  onAddPokemon,
}: TeamRecommendationsProps) => {
  return (
    <section className="panel mb-4 p-4 sm:mb-5 sm:p-5" aria-labelledby="smart-picks-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="smart-picks-heading" className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
            Smart Picks
          </h2>
          <p className="mt-0.5 text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
            Ranked by how well each Pokémon patches your current exposed matchups.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 text-[0.7rem] font-semibold" style={{ color: "var(--text-secondary)" }}>
          <button
            type="button"
            role="switch"
            aria-checked={finalEvolutionOnly}
            onClick={() => onToggleFinalEvolutionOnly(!finalEvolutionOnly)}
            className="relative inline-flex h-6 w-11 items-center rounded-full p-1"
            style={{
              background: finalEvolutionOnly ? "rgba(19, 111, 58, 0.25)" : "rgba(69, 51, 34, 0.2)",
              border: `1px solid ${finalEvolutionOnly ? "rgba(19, 111, 58, 0.4)" : "rgba(69, 51, 34, 0.3)"}`,
              transition: "background 0.2s ease, border-color 0.2s ease",
            }}
          >
            <span
              className="h-4 w-4 rounded-full"
              style={{
                background: finalEvolutionOnly ? "#136f3a" : "#6f6558",
                transform: finalEvolutionOnly ? "translateX(20px)" : "translateX(0)",
                transition: "transform 0.2s ease, background 0.2s ease",
              }}
            />
          </button>
          Final evolutions only
        </label>
      </div>

      {exposedTypes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {exposedTypes.slice(0, 5).map((type) => (
            <span
              key={type}
              className="rounded-full px-2 py-0.5 text-[0.58rem] font-semibold uppercase"
              style={{
                background: "rgba(248, 113, 113, 0.14)",
                border: "1px solid rgba(248, 113, 113, 0.28)",
                color: "#fca5a5",
              }}
            >
              {type}
            </span>
          ))}
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className="panel-soft mt-3 p-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          No recommendation found with the current filter. Try turning off final-evolution-only.
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-2.5 lg:grid-cols-3">
          {recommendations.map(({ pokemon, score, covers, risky }, index) => (
            <article key={pokemon.id} className="panel-soft animate-fade-in-up p-3" style={{ animationDelay: `${index * 70}ms` }}>
              <div className="flex items-start gap-2.5">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
                >
                  <Image src={pokemon.sprite} alt={pokemon.name} width={40} height={40} className="h-9 w-9 object-contain" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {pokemon.name}
                    </h3>
                    <span className="font-mono text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
                      #{pokemon.id}
                    </span>
                  </div>

                  <p className="mt-0.5 text-[0.66rem]" style={{ color: "var(--text-secondary)" }}>
                    Fit score: <span className="font-semibold">{score.toFixed(1)}</span>
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {covers.map((type) => (
                      <span
                        key={`${pokemon.id}-cover-${type}`}
                        className="rounded-full px-2 py-0.5 text-[0.56rem] font-semibold uppercase"
                        style={{
                          background: "rgba(74, 222, 128, 0.14)",
                          border: "1px solid rgba(74, 222, 128, 0.28)",
                          color: "#86efac",
                        }}
                      >
                        covers {type}
                      </span>
                    ))}

                    {risky.slice(0, 1).map((type) => (
                      <span
                        key={`${pokemon.id}-risk-${type}`}
                        className="rounded-full px-2 py-0.5 text-[0.56rem] font-semibold uppercase"
                        style={{
                          background: "rgba(248, 113, 113, 0.12)",
                          border: "1px solid rgba(248, 113, 113, 0.24)",
                          color: "#fca5a5",
                        }}
                      >
                        weak to {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onAddPokemon(pokemon)}
                disabled={teamFull}
                className="btn-secondary mt-3 w-full disabled:pointer-events-none disabled:opacity-50"
              >
                Add to team
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default TeamRecommendations;
