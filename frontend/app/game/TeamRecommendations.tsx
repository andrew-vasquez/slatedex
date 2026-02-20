"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import type { Dispatch, KeyboardEvent, SetStateAction } from "react";
import { FiChevronDown, FiSliders } from "react-icons/fi";
import { pokemonSpriteSrc } from "@/lib/image";
import type { Pokemon } from "@/lib/types";

type RecommendationRole = "all" | "bulky" | "fast" | "physical" | "special";

interface Recommendation {
  pokemon: Pokemon;
  score: number;
  covers: string[];
  risky: string[];
  reason: string;
}

interface TeamRecommendationsProps {
  recommendations: Recommendation[];
  exposedTypes: string[];
  teamFull: boolean;
  recommendationsEnabled: boolean;
  onToggleRecommendations: Dispatch<SetStateAction<boolean>>;
  allowLegendaryMythicalRecommendations: boolean;
  onAllowLegendaryMythicalRecommendationsChange: Dispatch<SetStateAction<boolean>>;
  allowStarterRecommendations: boolean;
  onAllowStarterRecommendationsChange: Dispatch<SetStateAction<boolean>>;
  onAddPokemon: (pokemon: Pokemon) => void;
  role: RecommendationRole;
  onRoleChange: (role: RecommendationRole) => void;
  onReplaceWeakest: (pokemon: Pokemon) => void;
  canReplaceWeakest: boolean;
}

const TeamRecommendations = ({
  recommendations,
  exposedTypes,
  teamFull,
  recommendationsEnabled,
  onToggleRecommendations,
  allowLegendaryMythicalRecommendations,
  onAllowLegendaryMythicalRecommendationsChange,
  allowStarterRecommendations,
  onAllowStarterRecommendationsChange,
  onAddPokemon,
  role,
  onRoleChange,
  onReplaceWeakest,
  canReplaceWeakest,
}: TeamRecommendationsProps) => {
  const isSmartPicksOn = recommendationsEnabled;
  const [isRecommendationSettingsOpen, setIsRecommendationSettingsOpen] = useState(false);

  const toggleRecommendations = useCallback(() => {
    onToggleRecommendations((prev) => !prev);
  }, [onToggleRecommendations]);

  const handleToggleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      toggleRecommendations();
    },
    [toggleRecommendations]
  );

  const handleToggleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleRecommendations();
    },
    [toggleRecommendations]
  );

  return (
    <section className="animate-section-reveal panel mb-4 p-4 sm:mb-5 sm:p-5" aria-labelledby="smart-picks-heading">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="smart-picks-heading" className="font-display text-base sm:text-lg" style={{ color: "var(--text-primary)" }}>
            Smart Picks
          </h2>
          <p className="mt-1 text-xs leading-tight sm:mt-0.5 sm:text-sm" style={{ color: "var(--text-muted)" }}>
            Suggestions ranked by how well each option patches your current weaknesses.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={recommendationsEnabled}
          aria-label="Toggle smart picks"
          onClick={handleToggleClick}
          onKeyDown={handleToggleKeyDown}
          className="inline-flex w-full items-center justify-between gap-2 rounded-full border px-3 py-1.5 text-left transition-all duration-300 sm:w-auto"
          style={{
            borderColor: isSmartPicksOn ? "rgba(74, 222, 128, 0.42)" : "var(--border)",
            background: isSmartPicksOn
              ? "linear-gradient(145deg, rgba(15, 58, 39, 0.9), rgba(13, 30, 27, 0.95))"
              : "linear-gradient(145deg, rgba(20, 30, 52, 0.86), rgba(12, 18, 34, 0.94))",
            boxShadow: isSmartPicksOn
              ? "inset 0 1px 0 rgba(134, 239, 172, 0.16), 0 8px 18px rgba(2, 6, 20, 0.32)"
              : "inset 0 1px 0 rgba(148, 163, 184, 0.1), 0 6px 16px rgba(2, 6, 20, 0.26)",
          }}
        >
          <span
            className="text-[0.75rem] font-semibold tracking-[0.02em]"
            style={{ color: "var(--text-secondary)" }}
          >
            Smart picks
          </span>
          <span
            className="relative inline-flex h-6 w-12 shrink-0 items-center overflow-hidden rounded-full border transition-all duration-300"
            style={{
              borderColor: isSmartPicksOn ? "rgba(74, 222, 128, 0.45)" : "rgba(148, 163, 184, 0.34)",
              background: isSmartPicksOn
                ? "linear-gradient(155deg, rgba(25, 95, 56, 0.56), rgba(16, 79, 43, 0.74))"
                : "linear-gradient(160deg, rgba(65, 76, 102, 0.32), rgba(42, 50, 72, 0.64))",
              boxShadow: isSmartPicksOn
                ? "inset 0 0 0 1px rgba(134, 239, 172, 0.14), 0 0 0 1px rgba(74, 222, 128, 0.16)"
                : "inset 0 0 0 1px rgba(148, 163, 184, 0.08)",
            }}
            aria-hidden="true"
          >
            <span
              className="absolute left-0.5 top-0.5 h-[1.1rem] w-[1.1rem] rounded-full transition-all duration-300"
              style={{
                transform: isSmartPicksOn ? "translateX(1.35rem)" : "translateX(0)",
                background: isSmartPicksOn
                  ? "linear-gradient(180deg, #8ff5bd 0%, #32b56d 100%)"
                  : "linear-gradient(180deg, #b8c3dd 0%, #8492b6 100%)",
                boxShadow: isSmartPicksOn
                  ? "0 2px 9px rgba(6, 95, 70, 0.5), inset 0 1px 1px rgba(230, 255, 244, 0.52)"
                  : "0 2px 8px rgba(2, 6, 20, 0.42), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
              }}
            />
          </span>
          <span
            className="w-8 text-right text-[0.72rem] font-semibold uppercase tracking-[0.06em]"
            style={{
              color: isSmartPicksOn ? "#86efac" : "var(--text-muted)",
              textShadow: isSmartPicksOn ? "0 0 14px rgba(74, 222, 128, 0.28)" : "none",
            }}
          >
            {recommendationsEnabled ? "On" : "Off"}
          </span>
        </button>
      </div>

      <div className="mt-2">
        <button
          type="button"
          onClick={() => setIsRecommendationSettingsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.06em] transition-colors"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-secondary)" }}
          aria-expanded={isRecommendationSettingsOpen}
          aria-controls="smart-picks-settings-panel"
        >
          <FiSliders size={12} aria-hidden="true" />
          Recommendation settings
          <FiChevronDown
            size={12}
            aria-hidden="true"
            style={{ transform: isRecommendationSettingsOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
          />
        </button>

        <div
          id="smart-picks-settings-panel"
          className={`overflow-hidden transition-[max-height,opacity,margin-top] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isRecommendationSettingsOpen ? "mt-2 max-h-64 opacity-100" : "mt-0 max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="space-y-2 rounded-xl border p-2.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            <p className="rounded-lg border px-2.5 py-2 text-xs leading-relaxed" style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-secondary)" }}>
              Smart Picks excludes <span className="font-semibold">legendaries/mythicals and starter lines</span> by default.
            </p>
            <label
              className="inline-flex w-full items-center justify-between gap-3 rounded-lg border px-2.5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.06em]"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-secondary)" }}
            >
              Include Legendaries & Mythicals
              <input
                type="checkbox"
                checked={allowLegendaryMythicalRecommendations}
                onChange={(event) => onAllowLegendaryMythicalRecommendationsChange(event.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                aria-label="Include legendary and mythical Pokemon in smart picks"
              />
            </label>
            <label
              className="inline-flex w-full items-center justify-between gap-3 rounded-lg border px-2.5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.06em]"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-secondary)" }}
            >
              Include Starter Lines
              <input
                type="checkbox"
                checked={allowStarterRecommendations}
                onChange={(event) => onAllowStarterRecommendationsChange(event.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                aria-label="Include starter evolution lines in smart picks"
              />
            </label>
          </div>
        </div>
      </div>

      {exposedTypes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {exposedTypes.slice(0, 5).map((type) => (
            <span
              key={type}
              className="rounded-full px-2 py-0.5 text-[0.68rem] font-semibold uppercase"
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

      <div className="mt-3">
        <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
          Role Filter
        </p>
        <div className="flex flex-wrap gap-1.5">
          {([
            { id: "all", label: "All" },
            { id: "bulky", label: "Bulky" },
            { id: "fast", label: "Fast" },
            { id: "physical", label: "Physical" },
            { id: "special", label: "Special" },
          ] as const).map((entry) => {
            const isActive = role === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onRoleChange(entry.id)}
                className="rounded-full px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.06em]"
                style={{
                  border: isActive ? "1px solid rgba(218, 44, 67, 0.36)" : "1px solid var(--border)",
                  background: isActive ? "var(--accent-soft)" : "var(--surface-2)",
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                {entry.label}
              </button>
            );
          })}
        </div>
      </div>

      {!recommendationsEnabled ? (
        <div className="panel-soft mt-3 p-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          Smart picks are currently turned off.
        </div>
      ) : recommendations.length === 0 ? (
        <div className="panel-soft mt-3 p-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          No final-evolution recommendations fit your current team right now.
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-2.5 lg:grid-cols-3">
          {recommendations.map(({ pokemon, score, covers, risky, reason }, index) => (
            <article
              key={pokemon.id}
              className="panel-soft animate-fade-in-up flex min-h-[18rem] flex-col p-3"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
                >
                  <Image src={pokemonSpriteSrc(pokemon.sprite, pokemon.id)} alt={pokemon.name} width={40} height={40} className="h-9 w-9 object-contain" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {pokemon.name}
                    </h3>
                    <span className="font-mono text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
                      #{pokemon.id}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                    Fit score: <span className="font-semibold">{score.toFixed(1)}</span>
                  </p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {reason}
                  </p>

                  <div className="mt-2 flex flex-wrap content-start gap-1">
                    {covers.slice(0, 3).map((type) => (
                      <span
                        key={`${pokemon.id}-cover-${type}`}
                        className="rounded-full px-2 py-0.5 text-[0.66rem] font-semibold uppercase"
                        style={{
                          background: "rgba(74, 222, 128, 0.14)",
                          border: "1px solid rgba(74, 222, 128, 0.28)",
                          color: "#86efac",
                        }}
                      >
                        covers {type}
                      </span>
                    ))}
                    {covers.length > 3 && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[0.66rem] font-semibold uppercase"
                        style={{
                          background: "rgba(148, 163, 184, 0.16)",
                          border: "1px solid rgba(148, 163, 184, 0.3)",
                          color: "var(--text-muted)",
                        }}
                      >
                        +{covers.length - 3} more
                      </span>
                    )}

                    {risky.slice(0, 1).map((type) => (
                      <span
                        key={`${pokemon.id}-risk-${type}`}
                        className="rounded-full px-2 py-0.5 text-[0.66rem] font-semibold uppercase"
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

              <div className="mt-auto pt-3">
                <button
                  type="button"
                  onClick={() => onAddPokemon(pokemon)}
                  disabled={teamFull}
                  className="btn-secondary w-full disabled:pointer-events-none disabled:opacity-50"
                >
                  Add to team
                </button>

                <button
                  type="button"
                  onClick={() => onReplaceWeakest(pokemon)}
                  disabled={!canReplaceWeakest}
                  className="btn-secondary mt-2 w-full !border-[rgba(59,130,246,0.32)] !bg-[rgba(59,130,246,0.14)] !text-[#93c5fd] disabled:pointer-events-none disabled:opacity-50"
                >
                  Replace weakest fit
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default TeamRecommendations;
