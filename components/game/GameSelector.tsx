"use client";

import Link from "next/link";
import Image from "next/image";
import { MAINLINE_GAMES } from "@/lib/pokemon";
import type { Game } from "@/lib/types";

const getSpriteUrl = (name: string): string => {
  const SPRITE_IDS: Record<string, number> = {
    bulbasaur: 1,
    charmander: 4,
    squirtle: 7,
    mewtwo: 150,
    chikorita: 152,
    cyndaquil: 155,
    totodile: 158,
    lugia: 249,
    "ho-oh": 250,
    treecko: 252,
    torchic: 255,
    mudkip: 258,
    rayquaza: 384,
    turtwig: 387,
    chimchar: 390,
    piplup: 393,
    arceus: 493,
    snivy: 495,
    tepig: 498,
    oshawott: 501,
    zekrom: 644,
  };

  const id = SPRITE_IDS[name];
  return id
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
    : "";
};

const REGION_COLORS: Record<string, { accent: string; soft: string; edge: string }> = {
  Kanto: { accent: "#e53935", soft: "rgba(229, 57, 53, 0.12)", edge: "rgba(229, 57, 53, 0.28)" },
  Johto: { accent: "#fb8c00", soft: "rgba(251, 140, 0, 0.12)", edge: "rgba(251, 140, 0, 0.28)" },
  Hoenn: { accent: "#00897b", soft: "rgba(0, 137, 123, 0.12)", edge: "rgba(0, 137, 123, 0.28)" },
  Sinnoh: { accent: "#1e88e5", soft: "rgba(30, 136, 229, 0.12)", edge: "rgba(30, 136, 229, 0.28)" },
  Unova: { accent: "#6d4c41", soft: "rgba(109, 76, 65, 0.12)", edge: "rgba(109, 76, 65, 0.28)" },
};

const STEPS = [
  "Pick your game generation",
  "Add up to six Pokémon",
  "Use type coverage to patch weaknesses",
];

const GameSelector = () => {
  return (
    <div className="min-h-screen pb-14 sm:pb-20">
      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-10 left-10 h-44 w-44 rounded-full border border-[var(--border)] bg-[var(--accent-soft)]" />
          <div className="absolute top-12 right-0 h-60 w-60 rounded-full border border-[var(--border)] bg-[var(--accent-blue-soft)]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-16 sm:px-8 sm:pt-20">
          <div className="panel overflow-hidden p-6 sm:p-9">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-muted)" }}>
              Pokédex Planning Lab
            </p>

            <h1 className="font-display mt-3 text-4xl leading-[0.95] sm:text-6xl" style={{ textWrap: "balance" }}>
              Build smarter teams.
              <span className="block" style={{ color: "var(--accent)" }}>
                Cover every matchup.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-secondary)" }}>
              Choose a generation, draft your six, and instantly inspect where your team folds or holds. The flow is designed to keep strategy clear at a glance.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <div
                  key={step}
                  className="rounded-xl px-3.5 py-3 text-xs font-medium"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-bold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-2.5 text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
              <span className="rounded-full border px-2.5 py-1" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                5 mainline generations
              </span>
              <span className="rounded-full border px-2.5 py-1" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                Up to 649 Pokémon
              </span>
              <span className="rounded-full border px-2.5 py-1" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                Live defensive analysis
              </span>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto mt-6 max-w-6xl px-4 sm:mt-8 sm:px-8" role="main">
        <h2 className="font-display text-xl sm:text-2xl" style={{ color: "var(--text-primary)" }}>
          Choose Your Region
        </h2>
        <p className="mt-1 text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
          Each card loads species from that generation only.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2">
          {MAINLINE_GAMES.map((game: Game, i: number) => {
            const colors = REGION_COLORS[game.region] || REGION_COLORS.Kanto;
            return (
              <Link
                key={game.id}
                href={`/game/${game.id}`}
                className="group animate-fade-in-up relative overflow-hidden rounded-2xl"
                style={{ animationDelay: `${i * 80}ms` }}
                aria-label={`${game.name} generation ${game.generation}, ${game.region} region`}
              >
                <article
                  className="h-full p-4 sm:p-5"
                  style={{
                    border: `1px solid ${colors.edge}`,
                    background: `linear-gradient(135deg, ${colors.soft} 0%, var(--surface-1) 65%)`,
                    boxShadow: "var(--shadow-soft)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  <div className="absolute right-2 top-2 h-20 w-20 rounded-full border" style={{ borderColor: colors.edge }} aria-hidden="true" />

                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p
                        className="font-display text-[0.62rem] uppercase tracking-[0.2em]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Generation {game.generation}
                      </p>
                      <h3 className="font-display mt-1 text-2xl sm:text-[1.85rem]" style={{ color: "var(--text-primary)" }}>
                        {game.name}
                      </h3>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em]" style={{ color: colors.accent }}>
                        {game.region}
                      </p>
                    </div>

                    <div
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
                      style={{ background: colors.soft, color: colors.accent, border: `1px solid ${colors.edge}` }}
                    >
                      G{game.generation}
                    </div>
                  </div>

                  <div className="relative mt-4 flex items-center gap-2.5">
                    {game.starters.map((starter: string) => (
                      <div
                        key={starter}
                        className="relative flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                      >
                        <Image
                          src={getSpriteUrl(starter)}
                          alt={starter}
                          width={40}
                          height={40}
                          className="h-9 w-9 object-contain transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                    ))}

                    <div className="ml-auto flex items-center gap-1.5" aria-hidden="true">
                      {game.legendaries.slice(0, 1).map((legendary) => (
                        <Image
                          key={legendary}
                          src={getSpriteUrl(legendary)}
                          alt=""
                          width={52}
                          height={52}
                          className="h-12 w-12 object-contain opacity-50 transition-all duration-300 group-hover:opacity-80 group-hover:scale-105"
                        />
                      ))}
                      <span
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm transition-transform group-hover:translate-x-0.5"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                      >
                        ›
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default GameSelector;
