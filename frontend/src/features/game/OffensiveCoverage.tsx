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

type CoverageMode = "simple" | "advanced";

function CoverageModeToggle({
  mode,
  onModeChange,
}: {
  mode: CoverageMode;
  onModeChange: (mode: CoverageMode) => void;
}) {
  return (
    <div className="coverage-mode-toggle" role="tablist" aria-label="Coverage detail level">
      <button
        type="button"
        role="tab"
        aria-selected={mode === "simple"}
        className={`coverage-mode-button ${mode === "simple" ? "is-active" : ""}`}
        onClick={() => onModeChange("simple")}
      >
        Simple
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "advanced"}
        className={`coverage-mode-button ${mode === "advanced" ? "is-active" : ""}`}
        onClick={() => onModeChange("advanced")}
      >
        Advanced
      </button>
    </div>
  );
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
      <span className="coverage-summary-chip-dot" style={{ background: palette.darkTint }} aria-hidden="true" />
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
  const [mode, setMode] = useState<CoverageMode>("simple");

  const activeSummary =
    typeSummaries.find((entry) => entry.type === selectedType) ||
    typeSummaries.find((entry) => entry.type === fallbackType) ||
    typeSummaries[0];

  const noCoverageTypes = noCoverage.slice(0, 4).map((entry) => entry.type);
  const thinCoverageTypes = thinCoverage.slice(0, 4).map((entry) => entry.type);
  const bestPressureTypes = bestPressure.slice(0, 4).map((entry) => entry.type);
  const summaryLead =
    noCoverage.length > 0
      ? `${noCoverage.length} type${noCoverage.length !== 1 ? "s" : ""} still have no clean STAB answer.`
      : thinCoverage.length > 0
        ? `${thinCoverage.length} type${thinCoverage.length !== 1 ? "s" : ""} are covered by only one teammate.`
        : "Your team has broad offensive pressure with no obvious coverage hole.";

  return (
    <section className="animate-section-reveal panel p-4 sm:p-5">
      <div className="coverage-header">
        <div>
          <h3 className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
            Offensive Coverage
          </h3>
          <p className="mt-0.5 text-[0.78rem]" style={{ color: "var(--text-muted)" }}>
            See what your team still struggles to break cleanly.
          </p>
        </div>

        <div className="coverage-header-actions">
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

          <CoverageModeToggle mode={mode} onModeChange={setMode} />
        </div>
      </div>

      <div key={mode} className="coverage-mode-panel animate-section-reveal">
      {mode === "simple" ? (
        <>
          <div className="panel-soft coverage-summary-banner">
            <p className="coverage-summary-copy">{summaryLead}</p>
          </div>

          <div className="coverage-summary-grid-simple">
            <div className="panel-soft coverage-summary-card-simple coverage-summary-card-polished">
              <p className="coverage-summary-title" style={{ color: "var(--danger-text)" }}>
                No answer
              </p>
              {noCoverageTypes.length > 0 ? (
                <div className="coverage-summary-chip-list">
                  {noCoverageTypes.map((type) => (
                    <TypeSummaryChip
                      key={`simple-none-${type}`}
                      type={type}
                      meta="0 hitters"
                      tone="danger"
                      isActive={false}
                      onSelect={setSelectedType}
                    />
                  ))}
                </div>
              ) : (
                <p className="coverage-summary-empty">Every active type has at least one answer from your current team.</p>
              )}
            </div>

            <div className="panel-soft coverage-summary-card-simple coverage-summary-card-polished">
              <p className="coverage-summary-title" style={{ color: "var(--warning-text)" }}>
                One answer
              </p>
              {thinCoverageTypes.length > 0 ? (
                <div className="coverage-summary-chip-list">
                  {thinCoverageTypes.map((type) => (
                    <TypeSummaryChip
                      key={`simple-thin-${type}`}
                      type={type}
                      meta="1 hitter"
                      tone="warning"
                      isActive={false}
                      onSelect={setSelectedType}
                    />
                  ))}
                </div>
              ) : (
                <p className="coverage-summary-empty">No type relies on just one teammate for offensive pressure.</p>
              )}
            </div>

            <div className="panel-soft coverage-summary-card-simple coverage-summary-card-polished">
              <p className="coverage-summary-title" style={{ color: "var(--success-text)" }}>
                Best pressure
              </p>
              {bestPressureTypes.length > 0 ? (
                <div className="coverage-summary-chip-list">
                  {bestPressureTypes.map((type) => {
                    const summary = typeSummaries.find((entry) => entry.type === type);
                    return (
                      <TypeSummaryChip
                        key={`simple-pressure-${type}`}
                        type={type}
                        meta={`${summary?.hitCount ?? 0} hitters`}
                        tone="success"
                        isActive={false}
                        onSelect={setSelectedType}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="coverage-summary-empty">Add more overlap in STAB pressure to make your coverage safer.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="weakness-bucket-grid">
            <MatchupBucketCard title="No Answer" multiplier="0" items={noCoverage.map((entry) => entry.type)} tone="danger" />
            <MatchupBucketCard title="One Answer" multiplier="1" items={thinCoverage.map((entry) => entry.type)} tone="danger" />
            <MatchupBucketCard title="Reliable" multiplier="2" items={reliableCoverage} tone="success" />
            <MatchupBucketCard title="Strong Pressure" multiplier="3+" items={strongCoverage} tone="success" />
          </div>

          <div className="panel-soft coverage-focus-card">
            <div className="coverage-focus-header">
              <div className="flex items-center gap-2">
                <span className="coverage-focus-dot" style={{ background: getPokemonTypePalette(activeSummary.type).darkTint }} aria-hidden="true" />
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
                    {activeSummary.hitCount === 0 ? "No Answer" : `${activeSummary.hitCount} hitter${activeSummary.hitCount !== 1 ? "s" : ""}`}
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

          {(solidCoverage.length > 0 || lockedCount > 0) ? (
            <p className="coverage-advanced-note">
              {solidCoverage.length > 0 ? `${coveredCount} active types are covered overall.` : ""}
              {solidCoverage.length > 0 && lockedCount > 0 ? " " : ""}
              {lockedCount > 0 ? `${lockedCount} later-gen types are excluded here.` : ""}
            </p>
          ) : null}
        </>
      )}
      </div>
    </section>
  );
}
