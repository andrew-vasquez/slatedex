"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ALL_TYPES } from "@/lib/constants";
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
  const activeData = typeSummaries.find((t) => t.type === activeType) || typeSummaries[0];

  const getCellBg = (hitCount: number): string => {
    if (hitCount === 0) return "var(--surface-2)";
    if (hitCount === 1) return "rgba(196, 126, 31, 0.14)";
    if (hitCount === 2) return "rgba(19, 111, 58, 0.14)";
    return "rgba(19, 111, 58, 0.22)";
  };

  const getCellBorder = (hitCount: number): string => {
    if (hitCount === 0) return "rgba(148, 163, 184, 0.25)";
    if (hitCount === 1) return "rgba(196, 126, 31, 0.38)";
    return "rgba(19, 111, 58, 0.4)";
  };

  const previewType = (type: string) => setHoveredType(type);
  const clearPreview = () => setHoveredType(null);
  const selectType = (type: string) => setSelectedType(type);

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
            <span className="font-mono font-semibold" style={{ color: "#86efac" }}>{coveredCount}</span>
            covered
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="font-mono font-semibold" style={{ color: uncoveredCount > 0 ? "#fca5a5" : "var(--text-muted)" }}>{uncoveredCount}</span>
            gaps
          </span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="panel-soft px-3.5 py-3">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "#f87171" }}>
            Coverage Gaps
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {gaps.length > 0 ? (
              gaps.map((item) => {
                const isActive = item.type === activeType;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onMouseEnter={() => previewType(item.type)}
                    onMouseLeave={clearPreview}
                    onFocus={() => previewType(item.type)}
                    onBlur={clearPreview}
                    onClick={() => selectType(item.type)}
                    className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold capitalize"
                    style={{
                      background: isActive ? "rgba(185, 28, 28, 0.18)" : "rgba(185, 28, 28, 0.12)",
                      border: isActive ? "1px solid rgba(248, 113, 113, 0.45)" : "1px solid rgba(185, 28, 28, 0.26)",
                      color: "#fca5a5",
                      boxShadow: isActive ? "0 0 0 2px rgba(248, 113, 113, 0.2)" : undefined,
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
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "#4ade80" }}>
            Strongest Hits
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {strengths.length > 0 ? (
              strengths.map((item) => {
                const isActive = item.type === activeType;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onMouseEnter={() => previewType(item.type)}
                    onMouseLeave={clearPreview}
                    onFocus={() => previewType(item.type)}
                    onBlur={clearPreview}
                    onClick={() => selectType(item.type)}
                    className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold capitalize"
                    style={{
                      background: isActive ? "rgba(19, 111, 58, 0.18)" : "rgba(19, 111, 58, 0.12)",
                      border: isActive ? "1px solid rgba(134, 239, 172, 0.45)" : "1px solid rgba(19, 111, 58, 0.26)",
                      color: "#86efac",
                      boxShadow: isActive ? "0 0 0 2px rgba(74, 222, 128, 0.2)" : undefined,
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
        <div>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9 sm:gap-2" role="grid" aria-label="Offensive coverage heatmap">
            {typeSummaries.map(({ type, hitCount, isLocked }) => {
              if (isLocked) {
                return (
                  <div
                    key={type}
                    className="relative flex aspect-square flex-col items-center justify-center rounded-lg"
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
                  className="heatmap-cell relative flex aspect-square flex-col items-center justify-center rounded-lg"
                  style={{
                    background: getCellBg(hitCount),
                    border: `1px solid ${getCellBorder(hitCount)}`,
                    boxShadow: isActive
                      ? "0 0 0 2px var(--heatmap-ring), inset 0 0 0 1px rgba(226, 232, 240, 0.22)"
                      : undefined,
                    transform: isActive ? "translateY(-1px) scale(1.06)" : undefined,
                  }}
                  onMouseEnter={() => previewType(type)}
                  onMouseLeave={clearPreview}
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
                    <span className="mt-0.5 text-[0.5rem] font-bold tabular-nums" style={{ color: hitCount >= 2 ? "#136f3a" : "#9a670e" }}>
                      {hitCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="panel-soft h-fit p-3.5 lg:sticky lg:top-24" aria-live="polite">
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

          {activeData.isLocked ? (
            <p className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
              This type was not introduced until a later generation.
            </p>
          ) : (
            <>
              <div className="mb-3">
                <div className="rounded-md px-2 py-1.5" style={{
                  background: activeData.hitCount > 0 ? "rgba(74, 222, 128, 0.12)" : "rgba(248, 113, 113, 0.12)",
                  border: `1px solid ${activeData.hitCount > 0 ? "rgba(74, 222, 128, 0.28)" : "rgba(248, 113, 113, 0.28)"}`,
                }}>
                  <p className="text-[0.55rem] font-semibold uppercase" style={{ color: activeData.hitCount > 0 ? "#86efac" : "#fca5a5" }}>
                    {activeData.hitCount > 0 ? "Super Effective" : "No Coverage"}
                  </p>
                  <p className="font-mono text-xs" style={{ color: activeData.hitCount > 0 ? "#86efac" : "#fca5a5" }}>
                    {activeData.hitCount > 0 ? `${activeData.hitCount} hitter${activeData.hitCount !== 1 ? "s" : ""}` : "Gap"}
                  </p>
                </div>
              </div>

              {activeData.hitCount > 0 ? (
                <div>
                  <p className="mb-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "#86efac" }}>
                    Can Hit ({activeData.hitCount})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {activeData.hitters.map((pokemon) => (
                      <Image
                        key={pokemon.id}
                        src={pokemon.sprite}
                        alt={pokemon.name}
                        width={30}
                        height={30}
                        className="rounded border"
                        style={{ borderColor: "rgba(74, 222, 128, 0.35)", background: "rgba(74, 222, 128, 0.14)" }}
                        title={`${pokemon.name} — STAB super-effective`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                  No team member has a STAB type that hits {activeData.type} super-effectively. Consider adding a Pok&eacute;mon with a type advantage.
                </p>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export default OffensiveCoverage;
