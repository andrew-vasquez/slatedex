"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ALL_TYPES } from "@/lib/constants";
import type { CoverageMap } from "@/lib/types";

interface DefensiveCoverageProps {
  coverage: CoverageMap;
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

const DefensiveCoverage = ({ coverage }: DefensiveCoverageProps) => {
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const typeSummaries = useMemo(
    () =>
      ALL_TYPES.map((type) => {
        const data = coverage[type] || { weakPokemon: [], resistPokemon: [] };
        const weakCount = data.weakPokemon.length;
        const resistCount = data.resistPokemon.length;

        return {
          type,
          weakCount,
          resistCount,
          net: resistCount - weakCount,
          data,
        };
      }),
    [coverage]
  );

  const hoveredData = hoveredType ? typeSummaries.find((item) => item.type === hoveredType) : null;

  const pressurePoints = [...typeSummaries]
    .filter((entry) => entry.weakCount > entry.resistCount)
    .sort((a, b) => a.net - b.net)
    .slice(0, 3);

  const safePivots = [...typeSummaries]
    .filter((entry) => entry.resistCount >= entry.weakCount && entry.resistCount > 0)
    .sort((a, b) => b.net - a.net)
    .slice(0, 3);

  const getCellBg = (net: number, weakCount: number, resistCount: number): string => {
    if (weakCount === 0 && resistCount === 0) return "var(--surface-2)";
    if (net >= 2) return "rgba(19, 111, 58, 0.18)";
    if (net >= 0) return "rgba(196, 126, 31, 0.14)";
    if (net >= -1) return "rgba(218, 44, 67, 0.18)";
    return "rgba(185, 28, 28, 0.26)";
  };

  const getCellBorder = (net: number, weakCount: number, resistCount: number): string => {
    if (weakCount === 0 && resistCount === 0) return "rgba(69, 51, 34, 0.16)";
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

  return (
    <div className="panel p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 id="coverage-heading" className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
            Step 3: Type Coverage
          </h3>
          <p className="mt-0.5 text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
            Hover or focus a type to inspect which team members are weak or resistant.
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
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="panel-soft px-3.5 py-3">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "#b91c1c" }}>
            Pressure Points
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {pressurePoints.length > 0 ? (
              pressurePoints.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onMouseEnter={() => setHoveredType(item.type)}
                  onFocus={() => setHoveredType(item.type)}
                  className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold capitalize"
                  style={{ background: "rgba(185, 28, 28, 0.12)", border: "1px solid rgba(185, 28, 28, 0.26)", color: "#991b1b" }}
                >
                  {item.type} ({item.weakCount} weak)
                </button>
              ))
            ) : (
              <span className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
                No major weak points detected.
              </span>
            )}
          </div>
        </div>

        <div className="panel-soft px-3.5 py-3">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "#136f3a" }}>
            Safe Pivots
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {safePivots.length > 0 ? (
              safePivots.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onMouseEnter={() => setHoveredType(item.type)}
                  onFocus={() => setHoveredType(item.type)}
                  className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold capitalize"
                  style={{ background: "rgba(19, 111, 58, 0.12)", border: "1px solid rgba(19, 111, 58, 0.26)", color: "#136f3a" }}
                >
                  {item.type} (+{Math.max(item.net, 0)})
                </button>
              ))
            ) : (
              <span className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
                Add more resistances to stabilize matchups.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9 sm:gap-2" role="grid" aria-label="Type coverage heatmap">
        {typeSummaries.map(({ type, weakCount, resistCount, net }) => (
          <button
            key={type}
            type="button"
            className="heatmap-cell relative flex aspect-square flex-col items-center justify-center rounded-lg"
            style={{
              background: getCellBg(net, weakCount, resistCount),
              border: `1px solid ${getCellBorder(net, weakCount, resistCount)}`,
            }}
            onMouseEnter={() => setHoveredType(type)}
            onFocus={() => setHoveredType(type)}
            aria-label={`${type}: ${weakCount} weak, ${resistCount} resist`}
          >
            <div className="mb-1 h-3.5 w-3.5 rounded-full" style={{ background: TYPE_HEX[type] }} />
            <span className="text-[0.54rem] font-bold uppercase leading-none" style={{ color: "var(--text-secondary)" }}>
              {type.slice(0, 3)}
            </span>
            {(weakCount > 0 || resistCount > 0) && (
              <span
                className="mt-0.5 text-[0.5rem] font-bold tabular-nums"
                style={{ color: getNetColor(net) }}
              >
                {formatNet(net)}
              </span>
            )}
          </button>
        ))}
      </div>

      {hoveredData && (hoveredData.weakCount > 0 || hoveredData.resistCount > 0) && (
        <div className="panel-soft mt-4 p-3.5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[0.6rem] font-bold text-white"
              style={{ background: TYPE_HEX[hoveredData.type] }}
            >
              {hoveredData.type.charAt(0).toUpperCase()}
            </span>
            <span className="font-display text-base capitalize" style={{ color: "var(--text-primary)" }}>
              {hoveredData.type}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <p className="mb-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "#991b1b" }}>
                Weak ({hoveredData.weakCount})
              </p>
              <div className="flex flex-wrap gap-1">
                {hoveredData.data.weakPokemon.length > 0 ? (
                  hoveredData.data.weakPokemon.map((pokemon) => (
                    <div key={pokemon.id} className="relative">
                      <Image
                        src={pokemon.sprite}
                        alt={pokemon.name}
                        width={30}
                        height={30}
                        className="rounded border"
                        style={{ borderColor: "rgba(185, 28, 28, 0.35)", background: "rgba(185, 28, 28, 0.1)" }}
                        title={`${pokemon.name} (${pokemon.effectiveness}x)`}
                      />
                    </div>
                  ))
                ) : (
                  <span className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                    No listed weaknesses.
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "#136f3a" }}>
                Resist ({hoveredData.resistCount})
              </p>
              <div className="flex flex-wrap gap-1">
                {hoveredData.data.resistPokemon.length > 0 ? (
                  hoveredData.data.resistPokemon.map((pokemon) => (
                    <div key={pokemon.id} className="relative">
                      <Image
                        src={pokemon.sprite}
                        alt={pokemon.name}
                        width={30}
                        height={30}
                        className="rounded border"
                        style={{ borderColor: "rgba(19, 111, 58, 0.35)", background: "rgba(19, 111, 58, 0.1)" }}
                        title={`${pokemon.name} (${pokemon.effectiveness}x)`}
                      />
                    </div>
                  ))
                ) : (
                  <span className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                    No listed resistances.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefensiveCoverage;
