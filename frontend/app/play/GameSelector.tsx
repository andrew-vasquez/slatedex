"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { GENERATION_META } from "@/lib/pokemon";
import { getCuratedExclusiveCount } from "@/lib/versionExclusives";
import { LAST_VISITED_GENERATION_KEY } from "@/lib/storageKeys";
import { FALLBACK_POKEMON_SPRITE } from "@/lib/image";
import type { GenerationMeta, Game } from "@/lib/types";
import UserMenu from "@/components/auth/UserMenu";

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
  chespin: 650,
  fennekin: 653,
  froakie: 656,
  xerneas: 716,
  yveltal: 717,
  rowlet: 722,
  litten: 725,
  popplio: 728,
  solgaleo: 791,
  lunala: 792,
  grookey: 810,
  scorbunny: 813,
  sobble: 816,
  zacian: 888,
  zamazenta: 889,
  sprigatito: 906,
  fuecoco: 909,
  quaxly: 912,
  koraidon: 1007,
  miraidon: 1008,
};

const POPULAR_GENERATIONS = [9, 3, 1];

const getSpriteUrl = (name: string): string => {
  const id = SPRITE_IDS[name];
  return id
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
    : FALLBACK_POKEMON_SPRITE;
};

const REGION_COLORS: Record<string, { accent: string; soft: string; edge: string }> = {
  Kanto: { accent: "#e53935", soft: "rgba(229, 57, 53, 0.12)", edge: "rgba(229, 57, 53, 0.28)" },
  Johto: { accent: "#fb8c00", soft: "rgba(251, 140, 0, 0.12)", edge: "rgba(251, 140, 0, 0.28)" },
  Hoenn: { accent: "#00897b", soft: "rgba(0, 137, 123, 0.12)", edge: "rgba(0, 137, 123, 0.28)" },
  Sinnoh: { accent: "#1e88e5", soft: "rgba(30, 136, 229, 0.12)", edge: "rgba(30, 136, 229, 0.28)" },
  Unova: { accent: "#6d4c41", soft: "rgba(109, 76, 65, 0.12)", edge: "rgba(109, 76, 65, 0.28)" },
  Kalos: { accent: "#5e35b1", soft: "rgba(94, 53, 177, 0.12)", edge: "rgba(94, 53, 177, 0.28)" },
  Alola: { accent: "#f4511e", soft: "rgba(244, 81, 30, 0.12)", edge: "rgba(244, 81, 30, 0.28)" },
  Galar: { accent: "#546e7a", soft: "rgba(84, 110, 122, 0.12)", edge: "rgba(84, 110, 122, 0.28)" },
  Paldea: { accent: "#c62828", soft: "rgba(198, 40, 40, 0.12)", edge: "rgba(198, 40, 40, 0.28)" },
};

const STEPS = [
  "Pick your game generation",
  "Add up to six Pokemon",
  "Use type coverage to patch weaknesses",
];


const GameSelector = () => {
  const [lastVisitedGen, setLastVisitedGen] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAST_VISITED_GENERATION_KEY);
      if (raw) {
        const gen = Number(raw);
        if (Number.isFinite(gen)) setLastVisitedGen(gen);
      }
    } catch {}
  }, []);

  const generationMetaSummary = useMemo(() => {
    return Object.fromEntries(
      GENERATION_META.map((meta) => {
        const versionCount = meta.games.reduce((sum, game) => sum + game.versions.length, 0);
        const hasRegionalDex = meta.games.some((game) => game.regionalDexCandidates.length > 0);
        const exclusivesCount = meta.games.reduce((sum, game) => sum + getCuratedExclusiveCount(game.id), 0);

        return [
          meta.generation,
          {
            versionCount,
            hasRegionalDex,
            exclusivesCount,
          },
        ];
      })
    ) as Record<number, { versionCount: number; hasRegionalDex: boolean; exclusivesCount: number }>;
  }, []);

  return (
    <div className="min-h-screen pb-14 sm:pb-20">
      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute -top-20 -left-20 h-64 w-64 rounded-full opacity-60"
            style={{ background: "radial-gradient(circle, rgba(218,44,67,0.14) 0%, transparent 70%)" }}
          />
          <div
            className="absolute -top-10 right-10 h-80 w-80 rounded-full opacity-40"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-3/4 opacity-30"
            style={{ background: "linear-gradient(90deg, transparent, rgba(218,44,67,0.4), transparent)" }}
          />
        </div>

        <div className="relative mx-auto max-w-screen-xl px-4 pt-8 sm:px-6 sm:pt-10">
          <div className="panel overflow-hidden p-6 sm:p-9">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "var(--accent-soft)", border: "1px solid rgba(218,44,67,0.28)" }}
                  aria-hidden="true"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--accent)" }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                    <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </div>
                <p className="font-display text-[0.72rem] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                  Tactical Team Builder
                </p>
              </div>
              <UserMenu />
            </div>

            <h1 className="font-display mt-5 text-5xl leading-none sm:text-7xl" style={{ letterSpacing: "-0.025em" }}>
              <span style={{ color: "var(--text-primary)" }}>Slate</span>
              <span style={{ color: "var(--accent)" }}>dex</span>
            </h1>

            <p className="font-display mt-0.5 text-sm font-medium uppercase tracking-[0.18em] sm:text-base" style={{ color: "var(--text-muted)" }}>
              Build your ideal team. Outsmart every matchup.
            </p>

            <p className="mt-3.5 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-secondary)" }}>
              Pick a generation, draft your six, and instantly see where your team holds strong or breaks. Type coverage, defensive analysis, and smart picks — all at a glance.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {STEPS.map((step, i) => (
                <div
                  key={step}
                  className="rounded-xl px-2.5 py-2.5 sm:px-3.5 sm:py-3"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span className="mb-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[0.72rem] font-bold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                    {i + 1}
                  </span>
                  <p className="text-[0.75rem] font-medium leading-snug sm:text-sm">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-1.5 sm:gap-2">
              {[
                "9 generations",
                "Up to 1025 Pokémon",
                "Live type coverage",
                "Smart picks",
              ].map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.72rem] font-semibold sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[0.76rem]"
                  style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-secondary)" }}
                >
                  <span style={{ color: "var(--accent)", fontSize: "0.45rem" }}>◈</span>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto mt-6 max-w-screen-xl px-4 sm:mt-8 sm:px-6" role="main">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-display text-xl sm:text-2xl" style={{ color: "var(--text-primary)" }}>
            Select a Generation
          </h2>
          <span
            className="rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em]"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-muted)" }}
          >
            Gen I – IX
          </span>
        </div>
        <p className="mt-1 text-[0.72rem] sm:text-sm" style={{ color: "var(--text-muted)" }}>
          Each generation loads all Pokémon from that era and earlier.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
            Popular:
          </span>
          {POPULAR_GENERATIONS.map((gen) => (
            <Link
              key={`popular-${gen}`}
              href={`/game/${gen}`}
              className="rounded-full border px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.06em]"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-secondary)" }}
            >
              Gen {gen}
            </Link>
          ))}

        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2">
          {GENERATION_META.map((gen: GenerationMeta, i: number) => {
            const colors = REGION_COLORS[gen.region] || REGION_COLORS.Kanto;
            const meta = generationMetaSummary[gen.generation];
            const isPopular = POPULAR_GENERATIONS.includes(gen.generation);
            const isRecent = gen.generation === lastVisitedGen;

            return (
              <Link
                key={gen.generation}
                href={`/game/${gen.generation}`}
                className="group animate-fade-in-up relative block h-full overflow-hidden rounded-2xl"
                style={{ animationDelay: `${i * 80}ms` }}
                aria-label={`Generation ${gen.generation}, ${gen.region} region`}
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
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        {isPopular && (
                          <span className="rounded-full border px-2 py-0.5 text-[0.64rem] font-semibold uppercase tracking-[0.08em]" style={{ borderColor: "rgba(234, 179, 8, 0.38)", background: "rgba(234, 179, 8, 0.16)", color: "#fef08a" }}>
                            Popular
                          </span>
                        )}
                        {isRecent && (
                          <span className="rounded-full border px-2 py-0.5 text-[0.64rem] font-semibold uppercase tracking-[0.08em]" style={{ borderColor: "rgba(59, 130, 246, 0.38)", background: "rgba(59, 130, 246, 0.16)", color: "#93c5fd" }}>
                            Recent
                          </span>
                        )}
                      </div>

                      <p
                        className="font-display text-[0.72rem] uppercase tracking-[0.12em]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Generation {gen.generation}
                      </p>
                      <h3 className="font-display mt-1 text-2xl sm:text-[1.85rem]" style={{ color: "var(--text-primary)" }}>
                        {gen.primaryName}
                      </h3>
                      <p className="text-[0.78rem] font-semibold uppercase tracking-[0.12em]" style={{ color: colors.accent }}>
                        {gen.region}
                      </p>

                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <span
                          className="rounded-lg px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-[0.06em]"
                          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                        >
                          {meta.versionCount} versions
                        </span>
                        <span
                          className="rounded-lg px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-[0.06em]"
                          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: meta.hasRegionalDex ? "#86efac" : "var(--text-muted)" }}
                        >
                          {meta.hasRegionalDex ? "regional dex" : "no regional dex"}
                        </span>
                        {meta.exclusivesCount > 0 && (
                          <span
                            className="rounded-lg px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-[0.06em]"
                            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "#fef08a" }}
                          >
                            {meta.exclusivesCount} exclusives
                          </span>
                        )}
                      </div>

                      {gen.games.length > 1 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {gen.games.map((g: Game) => (
                            <span
                              key={g.id}
                              className="rounded-lg px-2.5 py-1 text-[0.76rem] font-semibold"
                              style={{
                                background: colors.soft,
                                border: `1px solid ${colors.edge}`,
                                color: colors.accent,
                              }}
                            >
                              {g.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
                      style={{ background: colors.soft, color: colors.accent, border: `1px solid ${colors.edge}` }}
                    >
                      G{gen.generation}
                    </div>
                  </div>

                  <div className="relative mt-4 flex items-center gap-2.5">
                    {gen.starters.map((starter: string) => (
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
                      {gen.legendaries.slice(0, 1).map((legendary) => (
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
