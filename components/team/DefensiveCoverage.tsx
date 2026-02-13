"use client";

import Image from "next/image";
import { TYPE_COLORS, ALL_TYPES } from "@/lib/constants";
import type { CoverageMap } from "@/lib/types";

interface DefensiveCoverageProps {
  coverage: CoverageMap;
}

const DefensiveCoverage = ({ coverage }: DefensiveCoverageProps) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-xl p-4 sm:p-6">
      <h3
        id="coverage-heading"
        className="text-lg sm:text-xl font-bold text-white mb-4 text-center"
      >
        Defensive Coverage
      </h3>

      {/* Mobile: Enhanced Layout */}
      <div className="block sm:hidden space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {ALL_TYPES.map((type: string) => {
          const typeData = coverage[type] || {
            weakPokemon: [],
            resistPokemon: [],
          };
          return (
            <div key={type} className="bg-gray-700/30 rounded-lg p-3">
              <div
                className={`${TYPE_COLORS[type]} text-white text-sm font-bold px-3 py-2 rounded text-center uppercase mb-3`}
              >
                {type}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-red-400 text-xs font-bold mb-2">
                    Super Effective (2x/4x)
                  </div>
                  <div className="min-h-[50px] bg-red-500/20 rounded-lg p-2 border border-red-500/30">
                    {typeData.weakPokemon.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {typeData.weakPokemon.map((pokemon, idx: number) => (
                          <div key={idx} className="relative group">
                            <Image
                              src={pokemon.sprite}
                              alt={pokemon.name}
                              width={32}
                              height={32}
                              className={`rounded border ${
                                pokemon.effectiveness === 4
                                  ? "border-red-600 bg-red-600/30"
                                  : "border-red-400 bg-red-500/20"
                              }`}
                              title={`${pokemon.name} (${pokemon.effectiveness}x damage)`}
                            />
                            <div
                              className={`absolute -top-1 -right-1 ${
                                pokemon.effectiveness === 4
                                  ? "bg-red-700"
                                  : "bg-red-600"
                              } text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center`}
                            >
                              {pokemon.effectiveness}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-xs text-center py-2">
                        None
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-green-400 text-xs font-bold mb-2">
                    Not Very Effective (0.5x/0.25x)
                  </div>
                  <div className="min-h-[50px] bg-green-500/20 rounded-lg p-2 border border-green-500/30">
                    {typeData.resistPokemon.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {typeData.resistPokemon.map((pokemon, idx: number) => (
                          <div key={idx} className="relative group">
                            <Image
                              src={pokemon.sprite}
                              alt={pokemon.name}
                              width={32}
                              height={32}
                              className={`rounded border ${
                                pokemon.effectiveness === 0.25
                                  ? "border-green-600 bg-green-600/30"
                                  : "border-green-400 bg-green-500/20"
                              }`}
                              title={`${pokemon.name} (${pokemon.effectiveness}x damage)`}
                            />
                            <div
                              className={`absolute -top-1 -right-1 ${
                                pokemon.effectiveness === 0.25
                                  ? "bg-green-700"
                                  : "bg-green-600"
                              } text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center`}
                            >
                              {pokemon.effectiveness}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-xs text-center py-2">
                        None
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-3 gap-4 mb-4 px-2">
              <div className="text-left text-white font-bold text-sm">
                Attacking Type
              </div>
              <div className="text-center text-white font-bold text-sm">
                Super Effective (2x/4x)
              </div>
              <div className="text-center text-white font-bold text-sm">
                Not Very Effective (0.5x/0.25x)
              </div>
            </div>

            <div className="space-y-3">
              {ALL_TYPES.map((type: string) => {
                const typeData = coverage[type] || {
                  weakPokemon: [],
                  resistPokemon: [],
                };
                return (
                  <div
                    key={type}
                    className="grid grid-cols-3 gap-4 items-stretch bg-gray-700/30 rounded-lg p-3"
                  >
                    <div
                      className={`${TYPE_COLORS[type]} text-white text-sm font-bold rounded text-center uppercase flex items-center justify-center min-h-[60px]`}
                    >
                      {type}
                    </div>

                    <div className="min-h-[60px] bg-red-500/20 rounded-lg p-2 border border-red-500/30">
                      {typeData.weakPokemon.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {typeData.weakPokemon.map((pokemon, idx: number) => (
                            <div key={idx} className="relative group">
                              <Image
                                src={pokemon.sprite}
                                alt={pokemon.name}
                                width={32}
                                height={32}
                                className={`rounded border ${
                                  pokemon.effectiveness === 4
                                    ? "border-red-600 bg-red-600/30"
                                    : "border-red-400 bg-red-500/20"
                                }`}
                                title={`${pokemon.name} (${pokemon.effectiveness}x damage)`}
                              />
                              <div
                                className={`absolute -top-1 -right-1 ${
                                  pokemon.effectiveness === 4
                                    ? "bg-red-700"
                                    : "bg-red-600"
                                } text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center`}
                              >
                                {pokemon.effectiveness}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500 text-xs text-center py-2">
                          None
                        </div>
                      )}
                    </div>

                    <div className="min-h-[60px] bg-green-500/20 rounded-lg p-2 border border-green-500/30">
                      {typeData.resistPokemon.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {typeData.resistPokemon.map((pokemon, idx: number) => (
                            <div key={idx} className="relative group">
                              <Image
                                src={pokemon.sprite}
                                alt={pokemon.name}
                                width={32}
                                height={32}
                                className={`rounded border ${
                                  pokemon.effectiveness === 0.25
                                    ? "border-green-600 bg-green-600/30"
                                    : "border-green-400 bg-green-500/20"
                                }`}
                                title={`${pokemon.name} (${pokemon.effectiveness}x damage)`}
                              />
                              <div
                                className={`absolute -top-1 -right-1 ${
                                  pokemon.effectiveness === 0.25
                                    ? "bg-green-700"
                                    : "bg-green-600"
                                } text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center`}
                              >
                                {pokemon.effectiveness}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500 text-xs text-center py-2">
                          None
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefensiveCoverage;
