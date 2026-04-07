import { useMemo, useState } from "react";
import Image from "~/components/ui/AppImage";
import MatchupBucketCard from "@/components/ui/MatchupBucketCard";
import { ALL_TYPES } from "@/lib/constants";
import { pokemonSpriteSrc } from "@/lib/image";
import { formatPokemonType, getPokemonTypePalette } from "@/lib/pokemonTypePalette";
import type { OffensiveCoverageMap, PokemonWithEffectiveness } from "@/lib/types";

interface OffensiveCoverageProps {
  coverage: OffensiveCoverageMap;
  generation?: number;
}

interface OffensiveTypeSummary {
  type: string;
  hitCount: number;
  hitters: PokemonWithEffectiveness[];
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
  tone: "danger" | "warning" | "success" | "neutral";
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
      : tone === "warning"
        ? {
            background: isActive ? "var(--warning-bg)" : "color-mix(in srgb, var(--warning-bg) 80%, var(--surface-1))",
            borderColor: "var(--warning-border)",
            color: "var(--warning-text)",
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

export default function OffensiveCoverage({ coverage, generation }: OffensiveCoverageProps) {
  const typeSummaries = useMemo<OffensiveTypeSummary[]>(
    () =>
      ALL_TYPES.map((type) => {
        const data = coverage[type] || { hitCount: 0, hitters: [] };
        return {
          type,
          hitCount: data.hitCount ?? 0,
          hitters: data.hitters ?? [],
          isLocked: data.locked === true,
        };
      }),
    [coverage]
  );

  const activeSummaries = useMemo(
    () => typeSummaries.filter((entry) => !entry.isLocked),
    [typeSummaries]
  );

  const noCoverage = useMemo(
    () => activeSummaries.filter((entry) => entry.hitCount === 0),
    [activeSummaries]
  );

  const thinCoverage = useMemo(
    () => activeSummaries.filter((entry) => entry.hitCount === 1),
    [activeSummaries]
  );

  const bestPressure = useMemo(
    () =>
      [...activeSummaries]
        .filter((entry) => entry.hitCount >= 2)
        .sort((a, b) => b.hitCount - a.hitCount),
    [activeSummaries]
  );

  const solidCoverage = useMemo(
    () =>
      [...activeSummaries]
        .filter((entry) => entry.hitCount > 0)
        .sort((a, b) => b.hitCount - a.hitCount)
        .slice(0, 6),
    [activeSummaries]
  );

  const reliableCoverage = useMemo(
    () => activeSummaries.filter((entry) => entry.hitCount === 2).map((entry) => entry.type),
    [activeSummaries]
  );

  const strongCoverage = useMemo(
    () => activeSummaries.filter((entry) => entry.hitCount >= 3).map((entry) => entry.type),
    [activeSummaries]
  );

  const coveredCount = activeSummaries.filter((entry) => entry.hitCount > 0).length;
  const uncoveredCount = noCoverage.length;
  const lockedCount = typeSummaries.filter((entry) => entry.isLocked).length;

  const fallbackType =
    noCoverage[0]?.type ||
    thinCoverage[0]?.type ||
    bestPressure[0]?.type ||
    solidCoverage[0]?.type ||
    activeSummaries[0]?.type ||
    ALL_TYPES[0];

  const [selectedType, setSelectedType] = useState(fallbackType);

  const activeSummary =
    typeSummaries.find((entry) => entry.type === selectedType) ||
    typeSummaries.find((entry) => entry.type === fallbackType) ||
    typeSummaries[0];

  return (
    <section className="animate-section-reveal panel p-4 sm:p-5">
      <div className="coverage-header">
        <div>
          <h3 className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
            Offensive Coverage
          </h3>
          <p className="mt-0.5 text-[0.78rem]" style={{ color: "var(--text-muted)" }}>
            Focus on what you cannot hit, what only one teammate handles, and where your pressure is strongest.
          </p>
        </div>

        <div className="coverage-stat-row" aria-label="Offensive coverage summary">
          <div className="coverage-stat-card">
            <span className="coverage-stat-label">Covered</span>
            <span className="coverage-stat-value" style={{ color: coveredCount > 0 ? "var(--success-text)" : "var(--text-primary)" }}>
              {coveredCount}
            </span>
          </div>
          <div className="coverage-stat-card">
            <span className="coverage-stat-label">Uncovered</span>
            <span className="coverage-stat-value" style={{ color: uncoveredCount > 0 ? "var(--danger-text)" : "var(--text-primary)" }}>
              {uncoveredCount}
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
          title="No answer"
          multiplier="0"
          items={noCoverage.map((entry) => entry.type)}
          tone="danger"
        />
        <MatchupBucketCard
          title="One answer"
          multiplier="1"
          items={thinCoverage.map((entry) => entry.type)}
          tone="danger"
        />
        <MatchupBucketCard
          title="Reliable coverage"
          multiplier="2"
          items={reliableCoverage}
          tone="success"
        />
        <MatchupBucketCard
          title="Strong pressure"
          multiplier="3+"
          items={strongCoverage}
          tone="success"
        />
        <MatchupBucketCard
          title="Covered targets"
          multiplier="Any"
          items={solidCoverage.map((entry) => entry.type)}
          tone="neutral"
        />
        <MatchupBucketCard
          title="Locked types"
          multiplier="Later gen"
          items={typeSummaries.filter((entry) => entry.isLocked).map((entry) => entry.type)}
          tone="neutral"
          compactSummary={`${typeSummaries.filter((entry) => entry.isLocked).length} types are not active in this generation.`}
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
                  ? `This type is not active in Generation ${generation ?? "this ruleset"}.`
                  : activeSummary.hitCount === 0
                    ? `No current team member hits ${activeSummary.type} super-effectively with STAB.`
                    : activeSummary.hitCount === 1
                      ? `Only one teammate gives you a clean STAB answer into ${activeSummary.type}.`
                      : `${activeSummary.hitCount} teammates can pressure ${activeSummary.type} super-effectively.`}
              </p>
            </div>
          </div>

          {!activeSummary.isLocked ? (
            <div className="coverage-focus-stats">
              <span className={`coverage-focus-pill ${activeSummary.hitCount === 0 ? "coverage-focus-pill--danger" : activeSummary.hitCount === 1 ? "" : "coverage-focus-pill--success"}`}>
                {activeSummary.hitCount === 0 ? "no answer" : `${activeSummary.hitCount} hitter${activeSummary.hitCount !== 1 ? "s" : ""}`}
              </span>
            </div>
          ) : null}
        </div>

        {activeSummary.isLocked ? (
          <p className="coverage-summary-empty">This type is excluded from the current generation, so it does not affect offensive coverage here.</p>
        ) : activeSummary.hitters.length > 0 ? (
          <div className="coverage-focus-section">
            <p className="coverage-focus-label" style={{ color: "var(--success-text)" }}>
              Best STAB Answers
            </p>
            <div className="coverage-sprite-list">
              {activeSummary.hitters.map((entry) => (
                <div
                  key={`${activeSummary.type}-${entry.id}`}
                  className="coverage-sprite-card"
                  style={{
                    borderColor: "var(--success-border)",
                    background: "var(--success-bg)",
                  }}
                  title={`${entry.name}${entry.effectiveness > 1 ? ` • ${entry.effectiveness}x` : ""}`}
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
          </div>
        ) : (
          <p className="coverage-summary-empty">You do not currently have a STAB answer here. Adding one would help immediately.</p>
        )}
      </div>
    </section>
  );
}
