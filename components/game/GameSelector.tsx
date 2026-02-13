"use client";

import Link from "next/link";
import Image from "next/image";
import { MAINLINE_GAMES } from "@/lib/pokemon";
import type { Game } from "@/lib/types";

const getSpriteUrl = (name: string): string => {
  const SPRITE_IDS: Record<string, number> = {
    bulbasaur: 1, charmander: 4, squirtle: 7, mewtwo: 150,
    chikorita: 152, cyndaquil: 155, totodile: 158, lugia: 249, "ho-oh": 250,
    treecko: 252, torchic: 255, mudkip: 258, rayquaza: 384,
    turtwig: 387, chimchar: 390, piplup: 393, arceus: 493,
    snivy: 495, tepig: 498, oshawott: 501, zekrom: 644,
  };
  const id = SPRITE_IDS[name];
  return id
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
    : "";
};

const REGION_GRADIENTS: Record<string, string> = {
  Kanto: "from-red-500/20 to-orange-500/20",
  Johto: "from-amber-500/20 to-yellow-500/20",
  Hoenn: "from-emerald-500/20 to-cyan-500/20",
  Sinnoh: "from-blue-500/20 to-indigo-500/20",
  Unova: "from-violet-500/20 to-fuchsia-500/20",
};

const REGION_ACCENTS: Record<string, string> = {
  Kanto: "group-hover:border-red-500/50 group-hover:shadow-red-500/10",
  Johto: "group-hover:border-amber-500/50 group-hover:shadow-amber-500/10",
  Hoenn: "group-hover:border-emerald-500/50 group-hover:shadow-emerald-500/10",
  Sinnoh: "group-hover:border-blue-500/50 group-hover:shadow-blue-500/10",
  Unova: "group-hover:border-violet-500/50 group-hover:shadow-violet-500/10",
};

const GameSelector = () => {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--surface-0)" }}>
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-red-600/[0.04] blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-600/[0.04] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <header className="pt-16 sm:pt-24 pb-12 sm:pb-16 text-center" role="banner">
          <div className="inline-flex flex-col items-center gap-3">
            <span
              className="text-[0.7rem] sm:text-xs font-medium tracking-[0.3em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              Interactive Team Builder
            </span>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9]">
              <span className="block" style={{ color: "var(--text-primary)" }}>
                POKÉMON
              </span>
              <span
                className="block bg-gradient-to-r from-red-400 via-red-500 to-orange-500 bg-clip-text text-transparent"
              >
                TEAM BUILDER
              </span>
            </h1>
            <p
              className="mt-4 text-base sm:text-lg max-w-md leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Choose your generation. Craft the perfect team.
            </p>
          </div>
        </header>

        {/* Game cards grid */}
        <main role="main" className="pb-16 sm:pb-24">
          <h2 className="sr-only">Select a Pokémon Game Generation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {MAINLINE_GAMES.map((game: Game, i: number) => (
              <Link
                key={game.id}
                href={`/game/${game.id}`}
                className={`
                  group relative rounded-2xl overflow-hidden block
                  border border-[var(--border)] transition-all duration-300
                  hover:shadow-2xl hover:-translate-y-1
                  ${REGION_ACCENTS[game.region] || ""}
                  animate-fade-in-up
                `}
                style={{
                  background: "var(--surface-1)",
                  animationDelay: `${i * 80}ms`,
                }}
                aria-label={`Select ${game.name} — Generation ${game.generation}, ${game.region} region`}
              >
                {/* Region gradient overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${REGION_GRADIENTS[game.region] || "from-gray-500/20 to-gray-600/20"} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  aria-hidden="true"
                />

                {/* Legendary watermark */}
                <div className="absolute -top-2 -right-2 pointer-events-none" aria-hidden="true">
                  <Image
                    src={getSpriteUrl(game.legendaries[0])}
                    alt=""
                    width={120}
                    height={120}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain opacity-[0.06] group-hover:opacity-[0.14] transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                  />
                </div>

                <div className="relative p-5 sm:p-6 flex flex-col min-h-[200px]">
                  {/* Gen badge */}
                  <div className="flex items-center gap-2 mb-auto">
                    <span
                      className="text-[0.65rem] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-md"
                      style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}
                    >
                      Gen {game.generation}
                    </span>
                    <span
                      className="text-[0.65rem] font-medium tracking-wider uppercase"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {game.region}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl sm:text-3xl font-bold mt-6 mb-4 tracking-tight transition-colors duration-300">
                    {game.name}
                  </h3>

                  {/* Starters row */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex -space-x-1">
                      {game.starters.map((starter: string) => (
                        <div
                          key={starter}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                          style={{ background: "var(--surface-3)" }}
                        >
                          <Image
                            src={getSpriteUrl(starter)}
                            alt={starter}
                            width={32}
                            height={32}
                            className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Arrow indicator */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1"
                      style={{ background: "var(--surface-3)" }}
                      aria-hidden="true"
                    >
                      <svg className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default GameSelector;
