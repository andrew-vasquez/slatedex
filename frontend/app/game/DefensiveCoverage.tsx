"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import MatchupBucketCard from "@/components/ui/MatchupBucketCard";
import { ALL_TYPES } from "@/lib/constants";
import { pokemonSpriteSrc } from "@/lib/image";
import { formatPokemonType, getPokemonTypePalette } from "@/lib/pokemonTypePalette";
import type { CoverageMap, PokemonWithEffectiveness } from "@/lib/types";

interface DefensiveCoverageProps {
  coverage: CoverageMap;
  generation?: number;
}

interface DefensiveTypeSummary {
  type: string;
  weakCount: number;
  resistCount: number;
  net: number;
  quadWeakCount: number;
  weakPokemon: PokemonWithEffectiveness[];
  resistPokemon: PokemonWithEffectiveness[];
  isLocked: boolean;
}

function TypeSummaryChip({
  type,
  meta,
  tone,
  isActive,
  onSelect,
}: {
  type: string;
  meta: string;
  tone: "danger" | "success" | "neutral";
  isActive: boolean;
  onSelect: (type: string) => void;
}) {
  const palette = getPokemonTypePalette(type);

  const toneStyles =
    tone === "danger"
      ? {
          background: isActive ? "var(--danger-bg-strong)" : "var(--danger-bg)",
          borderColor: "var(--danger-border)",
          color: "var(--danger-text)",
        }
      : tone === "success"
        ? {
            background: isActive ? "var(--success-bg-strong)" : "var(--success-bg)",
            borderColor: "var(--success-border)",
            color: "var(--success-text)",
          }
        : {
            background: isActive ? "var(--surface-3)" : "var(--surface-2)",
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          };

  return (
    <button
      type="button"
      onClick={() => onSelect(type)}
      className="coverage-summary-chip"
      style={toneStyles}
      aria-pressed={isActive}
    >
      <span
        className="coverage-summary-chip-dot"
        style={{ background: palette.darkTint }}
        aria-hidden="true"
      />
      <span className="coverage-summary-chip-label">{formatPokemonType(type)}</span>
      <span className="coverage-summary-chip-meta">{meta}</span>
    </button>
  );
}

function SpriteStrip({
  title,
  pokemon,
  tone,
  emptyLabel,
}: {
  title: string;
  pokemon: PokemonWithEffectiveness[];
  tone: "danger" | "success";
  emptyLabel: string;
}) {
  return (
    <div className="coverage-focus-section">
      <p
        className="coverage-focus-label"
        style={{ color: tone === "danger" ? "var(--danger-text)" : "var(--success-text)" }}
      >
        {title}
      </p>
      {pokemon.length > 0 ? (
        <div className="coverage-sprite-list">
          {pokemon.map((entry) => (
            <div
              key={`${title}-${entry.id}`}
              className="coverage-sprite-card"
              style={{
                borderColor: tone === "danger" ? "var(--danger-border)" : "var(--success-border)",
                background: tone === "danger" ? "var(--danger-bg)" : "var(--success-bg)",
              }}
              title={`${entry.name}${entry.effectiveness >= 4 ? ` • ${entry.effectiveness}x` : ""}`}
            >
              <Image
                src={pokemonSpriteSrc(entry.sprite, entry.id)}
                alt={entry.name}
                width={32}
                height={32}
                unoptimized
                className="h-8 w-8 object-contain"
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="coverage-focus-empty">{emptyLabel}</p>
      )}
    </div>
  );
}

export default function DefensiveCoverage({ coverage, generation }: DefensiveCoverageProps) {
  const typeSummaries = useMemo<DefensiveTypeSummary[]>(
    () =>
      ALL_TYPES.map((type) => {
        const data = coverage[type] || { weakPokemon: [], resistPokemon: [] };
        const weakPokemon = data.weakPokemon ?? [];
        const resistPokemon = data.resistPokemon ?? [];
        const weakCount = weakPokemon.length;
        const resistCount = resistPokemon.length;

        return {
          type,
          weakCount,
          resistCount,
          net: resistCount - weakCount,
          quadWeakCount: weakPokemon.filter((entry) => entry.effectiveness >= 4).length,
          weakPokemon,
          resistPokemon,
          isLocked: data.locked === true,
        };
      }),
    [coverage]
  );

  const activeTypeSummaries = useMemo(
    () => typeSummaries.filter((entry) => !entry.isLocked),
    [typeSummaries]
  );

  const quadWeaknesses = useMemo(
    () =>
      [...activeTypeSummaries]
        .filter((entry) => entry.quadWeakCount > 0)
        .sort((a, b) => b.quadWeakCount - a.quadWeakCount || b.weakCount - a.weakCount),
    [activeTypeSummaries]
  );

  const weaknesses = useMemo(
    () =>
      [...activeTypeSummaries]
        .filter((entry) => entry.weakCount > entry.resistCount)
        .sort((a, b) => b.weakCount - b.resistCount - (a.weakCount - a.resistCount) || b.weakCount - a.weakCount),
    [activeTypeSummaries]
  );

  const strongAgainst = useMemo(
    () =>
      [...activeTypeSummaries]
        .filter((entry) => entry.resistCount >= 2)
        .sort((a, b) => b.resistCount - a.resistCount || b.net - a.net),
    [activeTypeSummaries]
  );

  const safeInto = useMemo(
    () =>
      [...activeTypeSummaries]
        .filter((entry) => entry.net > 0)
        .sort((a, b) => b.net - a.net || b.resistCount - a.resistCount),
    [activeTypeSummaries]
  );

  const immunityAnswers = useMemo(
    () =>
      activeTypeSummaries
        .filter((entry) => entry.resistPokemon.some((pokemon) => pokemon.effectiveness === 0))
        .map((entry) => entry.type),
    [activeTypeSummaries]
  );

  const balancedMatchups = useMemo(
    () =>
      activeTypeSummaries
        .filter((entry) => entry.net === 0 && (entry.weakCount > 0 || entry.resistCount > 0))
        .map((entry) => entry.type),
    [activeTypeSummaries]
  );

  const fallbackType =
    quadWeaknesses[0]?.type ||
    weaknesses[0]?.type ||
    strongAgainst[0]?.type ||
    safeInto[0]?.type ||
    activeTypeSummaries[0]?.type ||
    ALL_TYPES[0];

  const [selectedType, setSelectedType] = useState(fallbackType);

  const activeSummary =
    typeSummaries.find((entry) => entry.type === selectedType) ||
    typeSummaries.find((entry) => entry.type === fallbackType) ||
    typeSummaries[0];

  const exposedCount = weaknesses.length;
  const safeCount = safeInto.length;
  const lockedCount = typeSummaries.filter((entry) => entry.isLocked).length;

  return (
    <section className="animate-section-reveal panel p-4 sm:p-5">
      <div className="coverage-header">
        <div>
          <h3 className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
            Defensive Coverage
          </h3>
          <p className="mt-0.5 text-[0.78rem]" style={{ color: "var(--text-muted)" }}>
            Straight to the point: what hits you hard, and what your team is safest into.
          </p>
        </div>

        <div className="coverage-stat-row" aria-label="Defensive coverage summary">
          <div className="coverage-stat-card">
            <span className="coverage-stat-label">Exposed</span>
            <span className="coverage-stat-value" style={{ color: exposedCount > 0 ? "var(--danger-text)" : "var(--text-primary)" }}>
              {exposedCount}
            </span>
          </div>
          <div className="coverage-stat-card">
            <span className="coverage-stat-label">Safe</span>
            <span className="coverage-stat-value" style={{ color: safeCount > 0 ? "var(--success-text)" : "var(--text-primary)" }}>
              {safeCount}
            </span>
          </div>
          {lockedCount > 0 ? (
            <div className="coverage-stat-card">
              <span className="coverage-stat-label">Locked</span>
              <span className="coverage-stat-value" style={{ color: "var(--text-muted)" }}>
                {lockedCount}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="weakness-bucket-grid">
        <MatchupBucketCard
          title="Quad weaknesses"
          multiplier="4x"
          items={quadWeaknesses.map((entry) => entry.type)}
          tone="danger"
        />
        <MatchupBucketCard
          title="Weaknesses"
          multiplier="2x"
          items={weaknesses.map((entry) => entry.type)}
          tone="danger"
        />
        <MatchupBucketCard
          title="Resists"
          multiplier="0.5x"
          items={strongAgainst.map((entry) => entry.type)}
          tone="success"
        />
        <MatchupBucketCard
          title="Safe into"
          multiplier="Net +"
          items={safeInto.map((entry) => entry.type)}
          tone="success"
        />
        <MatchupBucketCard
          title="Immunity answers"
          multiplier="0x"
          items={immunityAnswers}
          tone="neutral"
        />
        <MatchupBucketCard
          title="Balanced matchups"
          multiplier="Even"
          items={balancedMatchups}
          tone="neutral"
          compactSummary={`${balancedMatchups.length} types are basically even for your team defensively.`}
        />
      </div>

      <div className="panel-soft coverage-focus-card">
        <div className="coverage-focus-header">
          <div className="flex items-center gap-2">
            <span
              className="coverage-focus-dot"
              style={{ background: getPokemonTypePalette(activeSummary.type).darkTint }}
              aria-hidden="true"
            />
            <div>
              <h4 className="font-display text-base" style={{ color: "var(--text-primary)" }}>
                {formatPokemonType(activeSummary.type)}
              </h4>
              <p className="coverage-focus-copy">
                {activeSummary.isLocked
                  ? `This type does not apply in Generation ${generation ?? "this ruleset"}.`
                  : activeSummary.quadWeakCount > 0
                    ? `${activeSummary.quadWeakCount} teammate${activeSummary.quadWeakCount !== 1 ? "s" : ""} takes 4x damage from ${activeSummary.type}.`
                    : activeSummary.weakCount > activeSummary.resistCount
                      ? `${activeSummary.weakCount} teammate${activeSummary.weakCount !== 1 ? "s" : ""} is weak here, with only ${activeSummary.resistCount} resist.`
                      : activeSummary.resistCount > 0
                        ? `${activeSummary.resistCount} teammate${activeSummary.resistCount !== 1 ? "s" : ""} gives you defensive safety into ${activeSummary.type}.`
                        : `No major swing either way for ${activeSummary.type}.`}
              </p>
            </div>
          </div>

          {!activeSummary.isLocked ? (
            <div className="coverage-focus-stats">
              <span className="coverage-focus-pill coverage-focus-pill--danger">
                {activeSummary.weakCount} weak
              </span>
              <span className="coverage-focus-pill coverage-focus-pill--success">
                {activeSummary.resistCount} resist
              </span>
              <span className="coverage-focus-pill">
                net {activeSummary.net > 0 ? `+${activeSummary.net}` : activeSummary.net}
              </span>
            </div>
          ) : null}
        </div>

        {activeSummary.isLocked ? (
          <p className="coverage-summary-empty">This type is locked for the current generation, so it is excluded from the coverage readout.</p>
        ) : (
          <div className="coverage-focus-grid">
            <SpriteStrip
              title={activeSummary.quadWeakCount > 0 ? "Most At Risk" : "Weak Teammates"}
              pokemon={activeSummary.quadWeakCount > 0 ? activeSummary.weakPokemon.filter((entry) => entry.effectiveness >= 4) : activeSummary.weakPokemon}
              tone="danger"
              emptyLabel="No one on the team is under real pressure here."
            />
            <SpriteStrip
              title="Best Answers"
              pokemon={activeSummary.resistPokemon}
              tone="success"
              emptyLabel="No clear resist on the current team."
            />
          </div>
        )}
      </div>
    </section>
  );
}
