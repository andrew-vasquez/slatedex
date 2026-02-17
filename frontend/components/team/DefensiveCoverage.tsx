"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ALL_TYPES } from "@/lib/constants";
import type { CoverageMap } from "@/lib/types";

interface DefensiveCoverageProps {
  coverage: CoverageMap;
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

const DefensiveCoverage = ({ coverage, generation }: DefensiveCoverageProps) => {
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const typeSummaries = useMemo(
    () =>
      ALL_TYPES.map((type) => {
        const data = coverage[type] || { weakPokemon: [], resistPokemon: [] };
        const isLocked = data.locked === true;
        const weakCount = data.weakPokemon.length;
        const resistCount = data.resistPokemon.length;

        return {
          type,
          weakCount,
          resistCount,
          net: resistCount - weakCount,
          data,
          isLocked,
        };
      }),
    [coverage]
  );

  const activeTypeSummaries = useMemo(
    () => typeSummaries.filter((entry) => !entry.isLocked),
    [typeSummaries]
  );

  const pressurePoints = [...activeTypeSummaries]
    .filter((entry) => entry.weakCount > entry.resistCount)
    .sort((a, b) => a.net - b.net)
    .slice(0, 3);

  const safePivots = [...activeTypeSummaries]
    .filter((entry) => entry.resistCount >= entry.weakCount && entry.resistCount > 0)
    .sort((a, b) => b.net - a.net)
    .slice(0, 3);

  const fallbackType = pressurePoints[0]?.type || safePivots[0]?.type || activeTypeSummaries[0]?.type || ALL_TYPES[0];
  const activeType = hoveredType || selectedType || fallbackType;
  const activeData = typeSummaries.find((item) => item.type === activeType) || typeSummaries[0];

  const getCellBg = (net: number, weakCount: number, resistCount: number): string => {
    if (weakCount === 0 && resistCount === 0) return "var(--surface-2)";
    if (net >= 2) return "rgba(19, 111, 58, 0.18)";
    if (net >= 0) return "rgba(196, 126, 31, 0.14)";
    if (net >= -1) return "rgba(218, 44, 67, 0.18)";
    return "rgba(185, 28, 28, 0.26)";
  };

  const getCellBorder = (net: number, weakCount: number, resistCount: number): string => {
    if (weakCount === 0 && resistCount === 0) return "rgba(148, 163, 184, 0.25)";
    if (net >= 1) return "rgba(19, 111, 58, 0.4)";
    if (net >= 0) return "rgba(196, 126, 31, 0.38)";
    return "rgba(185, 28, 28, 0.4)";
  };

  const getNetColor = (net: number): string => {
    if (net > 0) return "#136f3a";
    if (net < 0) return "#991b1b";
    return "#9a670e";
  };

  const formatNet = (net: number): string => {
    if (net > 0) return `+${net}`;
    if (net === 0) return "0";
    return String(net);
  };

  const hasCoverageData = activeData.weakCount > 0 || activeData.resistCount > 0;

  const previewType = (type: string) => setHoveredType(type);
  const clearPreview = () => setHoveredType(null);
  const selectType = (type: string) => setSelectedType(type);

  return (
    <div className="animate-section-reveal panel p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 id="coverage-heading" className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
            Defensive Coverage
          </h3>
          <p className="mt-0.5 text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
            See where your team is safe or exposed. Hover to preview and click to lock a type.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "rgba(19, 111, 58, 0.35)" }} />
            Covered
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "rgba(218, 44, 67, 0.3)" }} />
            Exposed
          </span>
          {typeSummaries.some((t) => t.isLocked) && (
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "rgba(148, 163, 184, 0.18)", border: "1px dashed rgba(148, 163, 184, 0.4)" }} />
              Locked
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="panel-soft px-3.5 py-3">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "#f87171" }}>
            Pressure Points
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {pressurePoints.length > 0 ? (
              pressurePoints.map((item) => {
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
                    {item.type} ({item.weakCount} weak)
                  </button>
                );
              })
            ) : (
              <span className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
                No major weak points detected.
              </span>
            )}
          </div>
        </div>

        <div className="panel-soft px-3.5 py-3">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "#4ade80" }}>
            Safe Pivots
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {safePivots.length > 0 ? (
              safePivots.map((item) => {
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
                    {item.type} (+{Math.max(item.net, 0)})
                  </button>
                );
              })
            ) : (
              <span className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
                Add more resistances to stabilize matchups.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9 sm:gap-2" role="grid" aria-label="Type coverage heatmap">
            {typeSummaries.map(({ type, weakCount, resistCount, net, isLocked }) => {
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
                      cursor: "not-allowed",
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
                    background: getCellBg(net, weakCount, resistCount),
                    border: `1px solid ${getCellBorder(net, weakCount, resistCount)}`,
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
                  aria-label={`${type}: ${weakCount} weak, ${resistCount} resist`}
                >
                  <div className="mb-1 h-3.5 w-3.5 rounded-full" style={{ background: TYPE_HEX[type] }} />
                  <span className="text-[0.54rem] font-bold uppercase leading-none" style={{ color: "var(--text-secondary)" }}>
                    {type.slice(0, 3)}
                  </span>
                  {(weakCount > 0 || resistCount > 0) && (
                    <span className="mt-0.5 text-[0.5rem] font-bold tabular-nums" style={{ color: getNetColor(net) }}>
                      {formatNet(net)}
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
              <div className="mb-3 grid grid-cols-3 gap-1.5">
                <div className="rounded-md px-2 py-1.5" style={{ background: "rgba(248, 113, 113, 0.12)", border: "1px solid rgba(248, 113, 113, 0.28)" }}>
                  <p className="text-[0.55rem] font-semibold uppercase" style={{ color: "#fca5a5" }}>
                    Weak
                  </p>
                  <p className="font-mono text-xs" style={{ color: "#fca5a5" }}>
                    {activeData.weakCount}
                  </p>
                </div>
                <div className="rounded-md px-2 py-1.5" style={{ background: "rgba(74, 222, 128, 0.12)", border: "1px solid rgba(74, 222, 128, 0.28)" }}>
                  <p className="text-[0.55rem] font-semibold uppercase" style={{ color: "#86efac" }}>
                    Resist
                  </p>
                  <p className="font-mono text-xs" style={{ color: "#86efac" }}>
                    {activeData.resistCount}
                  </p>
                </div>
                <div className="rounded-md px-2 py-1.5" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                  <p className="text-[0.55rem] font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                    Net
                  </p>
                  <p className="font-mono text-xs" style={{ color: getNetColor(activeData.net) }}>
                    {formatNet(activeData.net)}
                  </p>
                </div>
              </div>

              {!hasCoverageData && (
                <p className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                  No team member is currently weak or resistant to this type.
                </p>
              )}

              {hasCoverageData && (
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <p className="mb-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "#fca5a5" }}>
                      Weak ({activeData.weakCount})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {activeData.data.weakPokemon.length > 0 ? (
                        activeData.data.weakPokemon.map((pokemon) => (
                          <Image
                            key={pokemon.id}
                            src={pokemon.sprite}
                            alt={pokemon.name}
                            width={30}
                            height={30}
                            className="rounded border"
                            style={{ borderColor: "rgba(248, 113, 113, 0.35)", background: "rgba(248, 113, 113, 0.16)" }}
                            title={`${pokemon.name} (${pokemon.effectiveness}x)`}
                          />
                        ))
                      ) : (
                        <span className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                          No listed weaknesses.
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "#86efac" }}>
                      Resist ({activeData.resistCount})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {activeData.data.resistPokemon.length > 0 ? (
                        activeData.data.resistPokemon.map((pokemon) => (
                          <Image
                            key={pokemon.id}
                            src={pokemon.sprite}
                            alt={pokemon.name}
                            width={30}
                            height={30}
                            className="rounded border"
                            style={{ borderColor: "rgba(74, 222, 128, 0.35)", background: "rgba(74, 222, 128, 0.14)" }}
                            title={`${pokemon.name} (${pokemon.effectiveness}x)`}
                          />
                        ))
                      ) : (
                        <span className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                          No listed resistances.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export default DefensiveCoverage;
