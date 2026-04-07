import { Link, useRouterState } from "@tanstack/react-router";
import Image from "~/components/ui/AppImage";
import { startTransition, useEffect, useMemo, useState } from "react";
import { GENERATION_META } from "@/lib/pokemon";
import { getCuratedExclusiveCount } from "@/lib/versionExclusives";
import {
  LAST_VISITED_GENERATION_KEY,
  getSelectedGameStorageKey,
} from "@/lib/storageKeys";
import { FALLBACK_POKEMON_SPRITE } from "@/lib/image";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchTeamCountsByGame } from "@/lib/api";
import UserMenu from "@/components/auth/UserMenu";
import SlatedexBrand from "@/components/ui/SlatedexBrand";
import MobileSiteMenu from "@/components/ui/MobileSiteMenu";
import DesktopToolsMenu from "@/components/ui/DesktopToolsMenu";

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
  groudon: 383,
  kyogre: 382,
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
  necrozma: 800,
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

const getSpriteUrl = (name: string): string => {
  const id = SPRITE_IDS[name];
  return id
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
    : FALLBACK_POKEMON_SPRITE;
};

const REGION_COLORS: Record<string, { accent: string; soft: string; edge: string }> = {
  Kanto:  { accent: "#dc2626", soft: "rgba(220,38,38,0.12)",   edge: "rgba(220,38,38,0.26)"  },
  Johto:  { accent: "#b45309", soft: "rgba(180,83,9,0.12)",    edge: "rgba(180,83,9,0.26)"   },
  Hoenn:  { accent: "#0f766e", soft: "rgba(15,118,110,0.12)",  edge: "rgba(15,118,110,0.26)" },
  Sinnoh: { accent: "#2563eb", soft: "rgba(37,99,235,0.12)",   edge: "rgba(37,99,235,0.26)"  },
  Unova:  { accent: "#6b4f3b", soft: "rgba(107,79,59,0.12)",   edge: "rgba(107,79,59,0.26)"  },
  Kalos:  { accent: "#7c3aed", soft: "rgba(124,58,237,0.12)",  edge: "rgba(124,58,237,0.26)" },
  Alola:  { accent: "#c2410c", soft: "rgba(194,65,12,0.12)",   edge: "rgba(194,65,12,0.26)"  },
  Galar:  { accent: "#0369a1", soft: "rgba(3,105,161,0.12)",   edge: "rgba(3,105,161,0.26)"  },
  Paldea: { accent: "#be185d", soft: "rgba(190,24,93,0.12)",   edge: "rgba(190,24,93,0.26)"  },
};

const GEN_ROMAN: Record<number, string> = {
  1: "I", 2: "II", 3: "III", 4: "IV", 5: "V",
  6: "VI", 7: "VII", 8: "VIII", 9: "IX",
};

const GameSelector = () => {
  const { isAuthenticated } = useAuth();
  const pendingLocation = useRouterState({ select: (state) => state.resolvedLocation?.href ?? null });
  const [lastVisitedGen, setLastVisitedGen] = useState<number | null>(null);
  const [lastVisitedGameId, setLastVisitedGameId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingGeneration, setPendingGeneration] = useState<number | null>(null);
  // Map of gameId → saved team count (only populated when authenticated)
  const [teamCountByGame, setTeamCountByGame] = useState<Record<number, number>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAST_VISITED_GENERATION_KEY);
      if (raw) {
        const gen = Number(raw);
        if (Number.isFinite(gen)) {
          setLastVisitedGen(gen);
          const gameRaw = localStorage.getItem(getSelectedGameStorageKey(gen));
          if (gameRaw) {
            const gameId = Number(gameRaw);
            if (Number.isFinite(gameId)) setLastVisitedGameId(gameId);
          }
        }
      }
    } catch {}
  }, []);

  // Fetch saved team counts per game for authenticated users
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchTeamCountsByGame().then((countsByGame) => {
      const counts: Record<number, number> = {};
      for (const entry of countsByGame) {
        counts[entry.gameId] = entry.count;
      }
      setTeamCountByGame(counts);
    }).catch(() => {});
  }, [isAuthenticated]);

  const exclusivesCountByGame = useMemo(() => {
    return Object.fromEntries(
      GENERATION_META.flatMap((meta) =>
        meta.games.map((game) => [game.id, getCuratedExclusiveCount(game.id)])
      )
    );
  }, []);

  const gensWithDelay = useMemo(() => {
    let idx = 0;
    return GENERATION_META.map((gen) => ({
      ...gen,
      games: gen.games.map((game) => ({ ...game, animDelay: (idx++) * 50 })),
    }));
  }, []);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredGenerations = useMemo(() => {
    if (!normalizedSearchQuery) return gensWithDelay;
    return gensWithDelay
      .map((gen) => ({
        ...gen,
        games: gen.games.filter((game) =>
          `${gen.generation} ${game.name} ${game.region}`.toLowerCase().includes(normalizedSearchQuery)
        ),
      }))
      .filter((gen) => gen.games.length > 0);
  }, [gensWithDelay, normalizedSearchQuery]);

  const handleGameClick = (generation: number, gameId: number) => {
    try {
      localStorage.setItem(getSelectedGameStorageKey(generation), String(gameId));
      localStorage.setItem(LAST_VISITED_GENERATION_KEY, String(generation));
    } catch {}

    startTransition(() => {
      setPendingGeneration(generation);
    });
  };

  useEffect(() => {
    if (!pendingLocation?.startsWith("/game/")) {
      setPendingGeneration(null);
    }
  }, [pendingLocation]);

  return (
    <div className="min-h-screen pb-16 sm:pb-24">
      {pendingGeneration !== null && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[rgba(6,9,20,0.72)] backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border px-5 py-5 shadow-2xl" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                  Loading Builder
                </p>
                <h3 className="font-display mt-1 text-xl" style={{ color: "var(--text-primary)" }}>
                  Preparing Gen {pendingGeneration}
                </h3>
              </div>
              <div className="h-10 w-10 animate-pulse rounded-2xl" style={{ background: "var(--accent-soft)", border: "1px solid var(--border)" }} />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
                <div className="h-5 w-2/3 animate-pulse rounded-full" style={{ background: "var(--surface-3)" }} />
                <div className="h-4 w-full animate-pulse rounded-full" style={{ background: "var(--surface-2)" }} />
                <div className="h-4 w-5/6 animate-pulse rounded-full" style={{ background: "var(--surface-2)" }} />
                <div className="flex gap-2 pt-1">
                  <div className="h-6 w-20 animate-pulse rounded-full" style={{ background: "var(--surface-2)" }} />
                  <div className="h-6 w-24 animate-pulse rounded-full" style={{ background: "var(--surface-2)" }} />
                  <div className="h-6 w-16 animate-pulse rounded-full" style={{ background: "var(--surface-2)" }} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-12 w-12 animate-pulse rounded-2xl"
                    style={{
                      background: index === 3 ? "var(--accent-soft)" : "var(--surface-2)",
                      border: "1px solid var(--border)",
                      animationDelay: `${index * 80}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="relative z-30 overflow-visible border-b" style={{ borderColor: "var(--border)" }}>
        {/* Background atmosphere */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute -top-32 -left-20 h-80 w-80 rounded-full opacity-50"
            style={{ background: "radial-gradient(circle, rgba(218,44,67,0.15) 0%, transparent 70%)" }}
          />
          <div
            className="absolute -top-20 right-0 h-96 w-96 rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 65%)" }}
          />
        </div>

        <div className="relative mx-auto max-w-screen-xl px-4 py-5 sm:px-6 sm:py-7">
          {/* Top bar: logo + auth */}
          <div className="flex items-center justify-between gap-3">
            <SlatedexBrand titleClassName="text-3xl sm:text-4xl" />
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <MobileSiteMenu
                items={[
                  { href: "/play", label: "Builder", description: "You are here" },
                  { href: "/weaknesses", label: "Weakness Tool", description: "Check Pokemon weaknesses fast" },
                  { href: "/type-chart", label: "Type Chart", description: "See every type at a glance" },
                  { href: "/teams", label: "My Teams", description: "Open your saved teams" },
                ]}
              />
              <div className="hidden min-[820px]:flex min-[820px]:items-center min-[820px]:gap-3">
                <UserMenu
                  betweenThemeAndAuth={<DesktopToolsMenu />}
                />
              </div>
            </div>
          </div>

          {/* Tagline + stat chips */}
          <div className="mt-4">
            <p className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-secondary)" }}>
              Pick your game — build your six — analyze coverage.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["9 generations", "14 game titles", "18-type coverage", "AI team coach"].map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--text-muted)",
                  }}
                >
                  <span
                    className="inline-block h-1 w-1 rounded-full"
                    style={{ background: "var(--accent)" }}
                    aria-hidden="true"
                  />
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Game selection ───────────────────────────────────── */}
      <main
        id="main-content"
        className="mx-auto mt-7 max-w-screen-xl px-4 sm:mt-9 sm:px-6"
        role="main"
      >
        <div className="mb-4 rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
              Search Games
            </p>
            <p className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
              Filter by generation, game title, or region
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border px-2.5 py-1.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
              /
            </span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search generation, game, or region"
              className="w-full bg-transparent text-xs outline-none sm:text-sm"
              style={{ color: "var(--text-primary)" }}
              aria-label="Search games"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-md px-2 py-0.5 text-[0.66rem] font-semibold transition-colors hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <h2
            className="font-display text-lg font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}
          >
            Select a Game
          </h2>
          <div
            className="h-px flex-1"
            style={{ background: "var(--border)" }}
            aria-hidden="true"
          />
        </div>

        <div className="space-y-6">
          {filteredGenerations.map((gen) => {
            const primaryRegionColors =
              REGION_COLORS[gen.region] ?? REGION_COLORS.Kanto;
            const isMultiGame = gen.games.length > 1;
            const uniqueRegions = [...new Set(gen.games.map((g) => g.region))];

            return (
              <section key={gen.generation} aria-labelledby={`gen-${gen.generation}-heading`}>

                {/* Generation row label */}
                <div className="mb-2.5 flex items-center gap-2">
                  <span
                    className="font-display text-[0.64rem] font-bold uppercase tracking-[0.16em]"
                    style={{ color: primaryRegionColors.accent }}
                    id={`gen-${gen.generation}-heading`}
                  >
                    Gen {GEN_ROMAN[gen.generation]}
                  </span>
                  <span
                    className="text-[0.64rem] font-medium uppercase tracking-[0.1em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    · {uniqueRegions.join(" & ")}
                  </span>
                  {isMultiGame && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.06em]"
                      style={{
                        background: primaryRegionColors.soft,
                        color: primaryRegionColors.accent,
                        border: `1px solid ${primaryRegionColors.edge}`,
                      }}
                    >
                      {gen.games.length} titles
                    </span>
                  )}
                </div>

                {/* Cards — landscape for single game, grid for multiple */}
                {isMultiGame ? (
                  <div
                    className={`grid gap-3 ${
                      gen.games.length === 2
                        ? "grid-cols-1 sm:grid-cols-2"
                        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    }`}
                  >
                    {gen.games.map((game) => {
                      const colors = REGION_COLORS[game.region] ?? REGION_COLORS.Kanto;
                      const exclusivesCount = exclusivesCountByGame[game.id] ?? 0;
                      const teamCount = teamCountByGame[game.id] ?? 0;
                      const isRecent =
                        lastVisitedGen === gen.generation &&
                        (lastVisitedGameId === game.id ||
                          (lastVisitedGameId === null && gen.games[0]?.id === game.id));

                      return (
                        <Link
                          key={game.id}
                          to="/game/$generation"
                          params={{ generation: `gen${gen.generation}` }}
                          onClick={() => handleGameClick(gen.generation, game.id)}
                          className="group animate-fade-in-up relative block h-full overflow-hidden rounded-2xl cursor-pointer"
                          style={{ animationDelay: `${game.animDelay}ms` }}
                          aria-label={`${game.name}, ${game.region}`}
                        >
                          <article
                            className="game-card-hover relative h-full overflow-hidden rounded-2xl p-4 sm:p-5"
                            style={{
                              border: `1px solid ${colors.edge}`,
                              background: `linear-gradient(140deg, ${colors.soft} 0%, var(--surface-1) 60%)`,
                              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                            }}
                          >
                            {/* Decorative ring */}
                            <div
                              className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 rounded-full border opacity-40"
                              style={{ borderColor: colors.edge }}
                              aria-hidden="true"
                            />

                            {/* Region label + badges */}
                            <div className="relative flex items-start justify-between gap-2 mb-2">
                              <span
                                className="text-[0.62rem] font-bold uppercase tracking-[0.14em]"
                                style={{ color: colors.accent }}
                              >
                                {game.region}
                              </span>
                              <div className="flex gap-1">
                                {isRecent && (
                                  <span
                                    className="rounded-full border px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.06em]"
                                    style={{
                                      borderColor: "rgba(59,130,246,0.35)",
                                      background: "rgba(59,130,246,0.14)",
                                      color: "#93c5fd",
                                    }}
                                  >
                                    Recent
                                  </span>
                                )}
                                {exclusivesCount > 0 && (
                                  <span
                                    className="rounded-full border px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.06em]"
                                    style={{
                                      borderColor: "rgba(234,179,8,0.28)",
                                      background: "rgba(234,179,8,0.10)",
                                      color: "#fde68a",
                                    }}
                                  >
                                    {exclusivesCount} excl.
                                  </span>
                                )}
                                {teamCount > 0 && (
                                  <span
                                    className="rounded-full border px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.06em]"
                                    style={{
                                      borderColor: "rgba(134,239,172,0.3)",
                                      background: "rgba(134,239,172,0.10)",
                                      color: "#86efac",
                                    }}
                                  >
                                    {teamCount} {teamCount === 1 ? "team" : "teams"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Game name */}
                            <h3
                              className="relative font-display text-xl leading-tight sm:text-2xl"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {game.name}
                            </h3>

                            {/* Version pills */}
                            <div className="relative mt-2 flex flex-wrap gap-1">
                              {game.versions.map((v) => (
                                <span
                                  key={v.id}
                                  className="rounded-md px-2 py-0.5 text-[0.66rem] font-semibold"
                                  style={{
                                    background: colors.soft,
                                    border: `1px solid ${colors.edge}`,
                                    color: colors.accent,
                                  }}
                                >
                                  {v.label}
                                </span>
                              ))}
                            </div>

                            {/* Sprites row */}
                            <div className="relative mt-4 flex items-center gap-2">
                              {game.starters.map((starter) => (
                                <div
                                  key={starter}
                                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                                  style={{
                                    background: "var(--surface-2)",
                                    border: "1px solid var(--border)",
                                  }}
                                >
                                  <Image
                                    src={getSpriteUrl(starter)}
                                    alt={starter}
                                    width={32}
                                    height={32}
                                    sizes="28px"
                                    unoptimized
                                    className="h-7 w-7 object-contain transition-transform duration-300 group-hover:scale-110"
                                  />
                                </div>
                              ))}
                              <div className="ml-auto flex items-center gap-1.5">
                                {game.legendaries.slice(0, 1).map((leg) => (
                                  <Image
                                    key={leg}
                                    src={getSpriteUrl(leg)}
                                    alt=""
                                    width={44}
                                    height={44}
                                    sizes="40px"
                                    unoptimized
                                    className="h-10 w-10 object-contain opacity-35 transition-all duration-300 group-hover:opacity-65 group-hover:scale-105"
                                    aria-hidden="true"
                                  />
                                ))}
                                <span
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5"
                                  style={{
                                    background: "var(--surface-2)",
                                    border: "1px solid var(--border)",
                                    color: "var(--text-muted)",
                                    fontSize: "1rem",
                                  }}
                                  aria-hidden="true"
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
                ) : (
                  /* ── Landscape card for single-game generations ── */
                  (() => {
                    const game = gen.games[0];
                    if (!game) return null;
                    const colors = REGION_COLORS[game.region] ?? REGION_COLORS.Kanto;
                    const exclusivesCount = exclusivesCountByGame[game.id] ?? 0;
                    const teamCount = teamCountByGame[game.id] ?? 0;
                    const isRecent = lastVisitedGen === gen.generation;

                    return (
                      <Link
                        to="/game/$generation"
                        params={{ generation: `gen${gen.generation}` }}
                        onClick={() => handleGameClick(gen.generation, game.id)}
                        className="group animate-fade-in-up relative block overflow-hidden rounded-2xl cursor-pointer"
                        style={{ animationDelay: `${game.animDelay}ms` }}
                        aria-label={`${game.name}, ${game.region}`}
                      >
                        <article
                          className="game-card-hover relative overflow-hidden rounded-2xl"
                          style={{
                            border: `1px solid ${colors.edge}`,
                            background: `linear-gradient(135deg, ${colors.soft} 0%, var(--surface-1) 55%)`,
                            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                          }}
                        >
                          {/* Decorative large ring */}
                          <div
                            className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full border opacity-20"
                            style={{ borderColor: colors.accent }}
                            aria-hidden="true"
                          />
                          <div
                            className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full border opacity-15"
                            style={{ borderColor: colors.accent }}
                            aria-hidden="true"
                          />

                          {/* Left accent stripe */}
                          <div
                            className="absolute left-0 top-0 h-full w-0.5 rounded-l-2xl"
                            style={{ background: colors.accent }}
                            aria-hidden="true"
                          />

                          {/* Content: flex row */}
                          <div className="flex items-center gap-4 px-5 py-4 sm:gap-6 sm:px-6 sm:py-5">
                            {/* Info block */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span
                                  className="text-[0.64rem] font-bold uppercase tracking-[0.16em]"
                                  style={{ color: colors.accent }}
                                >
                                  {game.region}
                                </span>
                                {isRecent && (
                                  <span
                                    className="rounded-full border px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.06em]"
                                    style={{
                                      borderColor: "rgba(59,130,246,0.35)",
                                      background: "rgba(59,130,246,0.14)",
                                      color: "#93c5fd",
                                    }}
                                  >
                                    Recent
                                  </span>
                                )}
                                {exclusivesCount > 0 && (
                                  <span
                                    className="rounded-full border px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.06em]"
                                    style={{
                                      borderColor: "rgba(234,179,8,0.28)",
                                      background: "rgba(234,179,8,0.10)",
                                      color: "#fde68a",
                                    }}
                                  >
                                    {exclusivesCount} excl.
                                  </span>
                                )}
                                {teamCount > 0 && (
                                  <span
                                    className="rounded-full border px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.06em]"
                                    style={{
                                      borderColor: "rgba(134,239,172,0.3)",
                                      background: "rgba(134,239,172,0.10)",
                                      color: "#86efac",
                                    }}
                                  >
                                    {teamCount} {teamCount === 1 ? "team" : "teams"}
                                  </span>
                                )}
                              </div>
                              <h3
                                className="font-display text-2xl leading-tight sm:text-3xl"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {game.name}
                              </h3>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {game.versions.map((v) => (
                                  <span
                                    key={v.id}
                                    className="rounded-md px-2 py-0.5 text-[0.66rem] font-semibold"
                                    style={{
                                      background: colors.soft,
                                      border: `1px solid ${colors.edge}`,
                                      color: colors.accent,
                                    }}
                                  >
                                    {v.label}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Starters — hidden on xs, show on sm+ */}
                            <div className="hidden sm:flex items-center gap-2">
                              {game.starters.map((starter) => (
                                <div
                                  key={starter}
                                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                                  style={{
                                    background: "var(--surface-2)",
                                    border: "1px solid var(--border)",
                                  }}
                                >
                                  <Image
                                    src={getSpriteUrl(starter)}
                                    alt={starter}
                                    width={40}
                                    height={40}
                                    sizes="36px"
                                    unoptimized
                                    className="h-9 w-9 object-contain transition-transform duration-300 group-hover:scale-110"
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Legendary + arrow */}
                            <div className="flex items-center gap-2">
                              {game.legendaries.slice(0, 1).map((leg) => (
                                <Image
                                  key={leg}
                                  src={getSpriteUrl(leg)}
                                  alt=""
                                  width={56}
                                  height={56}
                                  sizes="(min-width: 640px) 56px, 48px"
                                  unoptimized
                                  className="h-12 w-12 object-contain opacity-40 transition-all duration-300 group-hover:opacity-70 group-hover:scale-105 sm:h-14 sm:w-14"
                                  aria-hidden="true"
                                />
                              ))}
                              <span
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5"
                                style={{
                                  background: "var(--surface-2)",
                                  border: "1px solid var(--border)",
                                  color: "var(--text-muted)",
                                  fontSize: "1rem",
                                }}
                                aria-hidden="true"
                              >
                                ›
                              </span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    );
                  })()
                )}
              </section>
            );
          })}
          {filteredGenerations.length === 0 && (
            <section className="rounded-2xl border p-6 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                No game found for "{searchQuery.trim()}"
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Try searching by game title, region, or generation number.
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default GameSelector;
