"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ALL_TYPES } from "@/lib/constants";
import { pokemonSpriteSrc } from "@/lib/image";
import type { OffensiveCoverageMap } from "@/lib/types";

interface OffensiveCoverageProps {
  coverage: OffensiveCoverageMap;
  generation?: number;
}

const TYPE_HEX: Record<string, string> = {
  normal: "#a8a878",
  fire: "#f08030",
  water: "#6890f0",
  electric: "#f8d030",
  grass: "#78c850",
  ice: "#98d8d8",
  fighting: "#c03028",
  poison: "#a040a0",
  ground: "#e0c068",
  flying: "#a890f0",
  psychic: "#f85888",
  bug: "#a8b820",
  rock: "#b8a038",
  ghost: "#705898",
  dragon: "#7038f8",
  dark: "#705848",
  steel: "#b8b8d0",
  fairy: "#ee99ac",
};

const OffensiveCoverage = ({ coverage }: OffensiveCoverageProps) => {
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [pulsedTypes, setPulsedTypes] = useState<Set<string>>(new Set());
  const previousTypeSignatureRef = useRef<Record<string, string>>({});

  const typeSummaries = useMemo(
    () =>
      ALL_TYPES.map((type) => {
        const data = coverage[type] || { hitCount: 0, hitters: [] };
        return {
          type,
          hitCount: data.hitCount,
          hitters: data.hitters,
          isLocked: data.locked === true,
        };
      }),
    [coverage]
  );

  const activeSummaries = useMemo(() => typeSummaries.filter((e) => !e.isLocked), [typeSummaries]);
  const coveredCount = activeSummaries.filter((e) => e.hitCount > 0).length;
  const uncoveredCount = activeSummaries.filter((e) => e.hitCount === 0).length;

  const gaps = activeSummaries.filter((e) => e.hitCount === 0).slice(0, 4);
  const strengths = [...activeSummaries].filter((e) => e.hitCount > 0).sort((a, b) => b.hitCount - a.hitCount).slice(0, 4);

  const fallbackType = gaps[0]?.type || strengths[0]?.type || activeSummaries[0]?.type || ALL_TYPES[0];
  const activeType = hoveredType || selectedType || fallbackType;
  const displayType = useDeferredValue(activeType);
  const activeData = typeSummaries.find((t) => t.type === displayType) || typeSummaries[0];

  const getCellBg = (hitCount: number): string => {
    if (hitCount === 0) return "var(--surface-2)";
    if (hitCount === 1) return "var(--warning-bg)";
    if (hitCount === 2) return "var(--success-bg)";
    return "var(--success-bg-strong)";
  };

  const getCellBorder = (hitCount: number): string => {
    if (hitCount === 0) return "rgba(148, 163, 184, 0.25)";
    if (hitCount === 1) return "var(--warning-border)";
    return "var(--success-border)";
  };

  const previewType = useCallback((type: string) => {
    setHoveredType((previous) => (previous === type ? previous : type));
  }, []);

  const clearPreview = useCallback(() => {
    setHoveredType(null);
  }, []);

  const selectType = useCallback((type: string) => {
    setSelectedType(type);
  }, []);

  useEffect(() => {
    const nextSignature: Record<string, string> = {};
    const changedTypes: string[] = [];

    typeSummaries.forEach(({ type, hitCount, isLocked }) => {
      const signature = isLocked ? "locked" : String(hitCount);
      nextSignature[type] = signature;

      const previous = previousTypeSignatureRef.current[type];
      if (previous !== undefined && previous !== signature) {
        changedTypes.push(type);
      }
    });

    if (changedTypes.length > 0) {
      setPulsedTypes(new Set(changedTypes));
      const timer = setTimeout(() => setPulsedTypes(new Set()), 460);
      previousTypeSignatureRef.current = nextSignature;
      return () => clearTimeout(timer);
    }

    previousTypeSignatureRef.current = nextSignature;
  }, [typeSummaries]);

  return (
    <div className="animate-section-reveal panel p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
            Offensive Coverage
          </h3>
          <p className="mt-0.5 text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
            Types your team can hit super-effectively via STAB.
          </p>
        </div>

        <div className="flex items-center gap-3 text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
          <span className="inline-flex items-center gap-1.5">
            <span className="font-mono font-semibold" style={{ color: "var(--success-text)" }}>{coveredCount}</span>
            covered
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="font-mono font-semibold" style={{ color: uncoveredCount > 0 ? "var(--danger-text)" : "var(--text-muted)" }}>{uncoveredCount}</span>
            gaps
          </span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="panel-soft px-3.5 py-3">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--danger-text)" }}>
            Coverage Gaps
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5" onPointerLeave={clearPreview}>
            {strengths.length === 0 ? (
              <span className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
                Add Pokémon to show offensive coverage.
              </span>
            ) : gaps.length > 0 ? (
              gaps.map((item) => {
                const isActive = item.type === activeType;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onPointerEnter={() => previewType(item.type)}
                    onFocus={() => previewType(item.type)}
                    onBlur={clearPreview}
                    onClick={() => selectType(item.type)}
                    className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold capitalize"
                    style={{
                      background: isActive ? "var(--danger-bg-strong)" : "var(--danger-bg)",
                      border: "1px solid var(--danger-border)",
                      color: "var(--danger-text)",
                      boxShadow: isActive ? "0 0 0 2px var(--danger-bg)" : undefined,
                    }}
                  >
                    {item.type}
                  </button>
                );
              })
            ) : (
              <span className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
                Full offensive coverage!
              </span>
            )}
          </div>
        </div>

        <div className="panel-soft px-3.5 py-3">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--success-text)" }}>
            Strongest Hits
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5" onPointerLeave={clearPreview}>
            {strengths.length > 0 ? (
              strengths.map((item) => {
                const isActive = item.type === activeType;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onPointerEnter={() => previewType(item.type)}
                    onFocus={() => previewType(item.type)}
                    onBlur={clearPreview}
                    onClick={() => selectType(item.type)}
                    className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold capitalize"
                    style={{
                      background: isActive ? "var(--success-bg-strong)" : "var(--success-bg)",
                      border: "1px solid var(--success-border)",
                      color: "var(--success-text)",
                      boxShadow: isActive ? "0 0 0 2px var(--success-bg)" : undefined,
                    }}
                  >
                    {item.type} ({item.hitCount})
                  </button>
                );
              })
            ) : (
              <span className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
                Add team members for offensive analysis.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="lg:h-full">
          <div className="coverage-heatmap-grid grid grid-cols-6 gap-1.5 sm:grid-cols-9 sm:gap-2" role="grid" aria-label="Offensive coverage heatmap" onPointerLeave={clearPreview}>
            {typeSummaries.map(({ type, hitCount, isLocked }) => {
              if (isLocked) {
                return (
                  <div
                    key={type}
                    className="coverage-type-cell relative flex aspect-square flex-col items-center justify-center rounded-lg"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px dashed rgba(148, 163, 184, 0.35)",
                      opacity: 0.35,
                      pointerEvents: "none",
                      overflow: "hidden",
                    }}
                    aria-label={`${type}: not available in this generation`}
                  >
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: "linear-gradient(135deg, transparent 45%, rgba(148, 163, 184, 0.4) 45%, rgba(148, 163, 184, 0.4) 55%, transparent 55%)",
                      }}
                      aria-hidden="true"
                    />
                    <div className="mb-1 h-3.5 w-3.5 rounded-full" style={{ background: TYPE_HEX[type], opacity: 0.5 }} />
                    <span className="text-[0.54rem] font-bold uppercase leading-none" style={{ color: "var(--text-muted)" }}>
                      {type.slice(0, 3)}
                    </span>
                  </div>
                );
              }

              const isActive = type === activeType;

              return (
                <button
                  key={type}
                  type="button"
                  className={`coverage-type-cell heatmap-cell relative flex aspect-square flex-col items-center justify-center rounded-lg ${pulsedTypes.has(type) ? "coverage-cell-pulse" : ""}`}
                  data-active={isActive ? "true" : "false"}
                  style={{
                    background: getCellBg(hitCount),
                    border: `1px solid ${getCellBorder(hitCount)}`,
                  }}
                  onPointerEnter={() => previewType(type)}
                  onFocus={() => previewType(type)}
                  onBlur={clearPreview}
                  onClick={() => selectType(type)}
                  aria-label={`${type}: ${hitCount} team members can hit super-effectively`}
                >
                  <div className="mb-1 h-3.5 w-3.5 rounded-full" style={{ background: TYPE_HEX[type] }} />
                  <span className="text-[0.54rem] font-bold uppercase leading-none" style={{ color: "var(--text-secondary)" }}>
                    {type.slice(0, 3)}
                  </span>
                  {hitCount > 0 && (
                    <span className="mt-0.5 text-[0.5rem] font-bold tabular-nums" style={{ color: hitCount >= 2 ? "var(--success-text)" : "var(--warning-text)" }}>
                      {hitCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="panel-soft coverage-detail-panel h-fit p-3.5 lg:sticky lg:top-24" aria-live="polite">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[0.6rem] font-bold text-white"
              style={{ background: TYPE_HEX[activeData.type] }}
            >
              {activeData.type.charAt(0).toUpperCase()}
            </span>
            <span className="font-display text-base capitalize" style={{ color: "var(--text-primary)" }}>
              {activeData.type}
            </span>
            {activeData.isLocked && (
              <span className="rounded-full px-2 py-0.5 text-[0.58rem] font-semibold" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                Locked
              </span>
            )}
          </div>

          <div className="coverage-detail-body">
            {activeData.isLocked ? (
              <div className="coverage-detail-state">
                <p className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                  This type was not introduced until a later generation.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <div className="rounded-md px-2 py-1.5" style={{
                    background: activeData.hitCount > 0 ? "var(--success-bg)" : "var(--danger-bg)",
                    border: `1px solid ${activeData.hitCount > 0 ? "var(--success-border)" : "var(--danger-border)"}`,
                  }}>
                    <p className="text-[0.55rem] font-semibold uppercase" style={{ color: activeData.hitCount > 0 ? "var(--success-text)" : "var(--danger-text)" }}>
                      {activeData.hitCount > 0 ? "Super Effective" : "No Coverage"}
                    </p>
                    <p className="font-mono text-xs" style={{ color: activeData.hitCount > 0 ? "var(--success-text)" : "var(--danger-text)" }}>
                      {activeData.hitCount > 0 ? `${activeData.hitCount} hitter${activeData.hitCount !== 1 ? "s" : ""}` : "Gap"}
                    </p>
                  </div>
                </div>

                {activeData.hitCount > 0 ? (
                  <div>
                    <p className="mb-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--success-text)" }}>
                      Can Hit ({activeData.hitCount})
                    </p>
                    <div className="coverage-sprite-list flex flex-wrap gap-1">
                      {activeData.hitters.map((pokemon) => (
                        <Image
                          key={pokemon.id}
                          src={pokemonSpriteSrc(pokemon.sprite, pokemon.id)}
                          alt={pokemon.name}
                          width={30}
                          height={30}
                          unoptimized
                          className="rounded border"
                          style={{ borderColor: "var(--success-border)", background: "var(--success-bg)" }}
                          title={`${pokemon.name} — STAB super-effective`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="coverage-detail-state">
                    <p className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                      No team member has a STAB type that hits {activeData.type} super-effectively. Consider adding a Pok&eacute;mon with a type advantage.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default OffensiveCoverage;
