"use client";

import Image from "next/image";
import { TYPE_COLORS, ALL_TYPES } from "@/lib/constants";
import type { CoverageMap } from "@/lib/types";

interface DefensiveCoverageProps {
  coverage: CoverageMap;
}

const DefensiveCoverage = ({ coverage }: DefensiveCoverageProps) => {
  return (
    <div
      className="rounded-2xl p-5 sm:p-6"
      style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
    >
      <h3
        id="coverage-heading"
        className="text-base sm:text-lg font-semibold mb-5"
        style={{ color: "var(--text-primary)" }}
      >
        Defensive Coverage
      </h3>

      {/* Mobile layout */}
      <div className="block sm:hidden space-y-2 max-h-[28rem] overflow-y-auto custom-scrollbar pr-1">
        {ALL_TYPES.map((type: string) => {
          const typeData = coverage[type] || { weakPokemon: [], resistPokemon: [] };
          const hasData = typeData.weakPokemon.length > 0 || typeData.resistPokemon.length > 0;
          if (!hasData) return null;
          return (
            <div
              key={type}
              className="rounded-lg p-3"
              style={{ background: "var(--surface-2)" }}
            >
              <div className={`${TYPE_COLORS[type]} text-white text-[0.6rem] font-bold px-2.5 py-1 rounded text-center uppercase mb-2.5 inline-block`}>
                {type}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[0.55rem] font-semibold uppercase mb-1.5" style={{ color: "#f87171" }}>
                    Weak
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {typeData.weakPokemon.length > 0 ? typeData.weakPokemon.map((pokemon, idx: number) => (
                      <div key={idx} className="relative">
                        <Image
                          src={pokemon.sprite} alt={pokemon.name} width={28} height={28}
                          className="rounded border border-red-500/30 bg-red-500/10"
                          title={`${pokemon.name} (${pokemon.effectiveness}x)`}
                        />
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[0.45rem] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                          {pokemon.effectiveness}
                        </span>
                      </div>
                    )) : (
                      <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[0.55rem] font-semibold uppercase mb-1.5" style={{ color: "#4ade80" }}>
                    Resist
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {typeData.resistPokemon.length > 0 ? typeData.resistPokemon.map((pokemon, idx: number) => (
                      <div key={idx} className="relative">
                        <Image
                          src={pokemon.sprite} alt={pokemon.name} width={28} height={28}
                          className="rounded border border-green-500/30 bg-green-500/10"
                          title={`${pokemon.name} (${pokemon.effectiveness}x)`}
                        />
                        <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[0.45rem] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                          {pokemon.effectiveness}
                        </span>
                      </div>
                    )) : (
                      <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-[120px_1fr_1fr] gap-3 mb-3 px-1">
          <div className="text-[0.6rem] font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Type</div>
          <div className="text-[0.6rem] font-semibold uppercase text-center" style={{ color: "#f87171" }}>Super Effective</div>
          <div className="text-[0.6rem] font-semibold uppercase text-center" style={{ color: "#4ade80" }}>Resisted</div>
        </div>

        <div className="space-y-1.5 max-h-[32rem] overflow-y-auto custom-scrollbar pr-1">
          {ALL_TYPES.map((type: string) => {
            const typeData = coverage[type] || { weakPokemon: [], resistPokemon: [] };
            return (
              <div
                key={type}
                className="grid grid-cols-[120px_1fr_1fr] gap-3 items-center rounded-lg px-3 py-2.5"
                style={{ background: "var(--surface-2)" }}
              >
                <div
                  className={`${TYPE_COLORS[type]} text-white text-[0.6rem] font-bold rounded py-1.5 text-center uppercase`}
                >
                  {type}
                </div>

                <div className="min-h-[36px] flex items-center justify-center rounded-lg px-2 py-1.5"
                  style={{ background: "rgba(248, 113, 113, 0.06)", border: "1px solid rgba(248, 113, 113, 0.1)" }}>
                  {typeData.weakPokemon.length > 0 ? (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {typeData.weakPokemon.map((pokemon, idx: number) => (
                        <div key={idx} className="relative group/sprite">
                          <Image
                            src={pokemon.sprite} alt={pokemon.name} width={28} height={28}
                            className={`rounded border ${
                              pokemon.effectiveness === 4 ? "border-red-500/60 bg-red-500/20" : "border-red-500/30 bg-red-500/10"
                            }`}
                            title={`${pokemon.name} (${pokemon.effectiveness}x)`}
                          />
                          <span className={`absolute -top-1 -right-1 ${
                            pokemon.effectiveness === 4 ? "bg-red-700" : "bg-red-600"
                          } text-white text-[0.45rem] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center`}>
                            {pokemon.effectiveness}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </div>

                <div className="min-h-[36px] flex items-center justify-center rounded-lg px-2 py-1.5"
                  style={{ background: "rgba(74, 222, 128, 0.06)", border: "1px solid rgba(74, 222, 128, 0.1)" }}>
                  {typeData.resistPokemon.length > 0 ? (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {typeData.resistPokemon.map((pokemon, idx: number) => (
                        <div key={idx} className="relative group/sprite">
                          <Image
                            src={pokemon.sprite} alt={pokemon.name} width={28} height={28}
                            className={`rounded border ${
                              pokemon.effectiveness === 0.25 ? "border-green-500/60 bg-green-500/20" : "border-green-500/30 bg-green-500/10"
                            }`}
                            title={`${pokemon.name} (${pokemon.effectiveness}x)`}
                          />
                          <span className={`absolute -top-1 -right-1 ${
                            pokemon.effectiveness === 0.25 ? "bg-green-700" : "bg-green-600"
                          } text-white text-[0.45rem] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center`}>
                            {pokemon.effectiveness}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DefensiveCoverage;
