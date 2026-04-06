"use client";

import AppLink from "~/components/ui/AppLink";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiChevronDown, FiSearch, FiSettings, FiShuffle, FiTrash2, FiX } from "react-icons/fi";
import { GENERATION_META } from "@/lib/pokemon";
import { getSelectedGameStorageKey } from "@/lib/storageKeys";
import type { CSSProperties } from "react";
import type { BuilderSettings, CardDensity, DexMode, DragBehavior, Game } from "@/lib/types";
import BuilderSettingsPanel from "./BuilderSettingsPanel";
import UserMenu from "@/components/auth/UserMenu";

interface TeamBuilderHeaderProps {
  game: Game;
  generation: number;
  onBackToGameSelect: () => void;
  onGameChange: (gameId: number) => void;
  onShuffle: () => void;
  onClear: () => void;
  teamLength: number;
  settings: BuilderSettings;
  onSettingsDexModeChange: (value: DexMode) => void;
  onSettingsVersionFilterDefaultChange: (value: boolean) => void;
  onSettingsCardDensityChange: (value: CardDensity) => void;
  onSettingsReduceMotionChange: (value: boolean) => void;
  onSettingsDragBehaviorChange: (value: DragBehavior) => void;
  onSettingsVersionThemingChange: (value: boolean) => void;
  onSettingsMobileHapticsChange: (value: boolean) => void;
  onSettingsReset: () => void;
  isAiCoachOpen?: boolean;
  versionCssVars?: CSSProperties;
}

const GENERATION_MENU_ANIMATION_MS = 260;

const getGenerationRegionInfo = (meta: (typeof GENERATION_META)[number]) => {
  const regions = [...new Set(meta.games.map((entry) => entry.region).filter(Boolean))];
  return {
    regions,
    regionsLabel: regions.join(" · "),
    hasMultipleRegions: regions.length > 1,
    regionCountLabel: `${regions.length} regions`,
  };
};

const TeamBuilderHeader = ({
  game,
  generation,
  onBackToGameSelect,
  onGameChange,
  onShuffle,
  onClear,
  teamLength,
  settings,
  onSettingsDexModeChange,
  onSettingsVersionFilterDefaultChange,
  onSettingsCardDensityChange,
  onSettingsReduceMotionChange,
  onSettingsDragBehaviorChange,
  onSettingsVersionThemingChange,
  onSettingsMobileHapticsChange,
  onSettingsReset,
  isAiCoachOpen = false,
  versionCssVars,
}: TeamBuilderHeaderProps) => {
  // Delay restoring the header on mobile so it doesn't pop in during the AI panel's
  // 260ms exit animation. Hides instantly when AI opens, restores 280ms after it closes.
  const [isHiddenForAi, setIsHiddenForAi] = useState(isAiCoachOpen);
  useEffect(() => {
    if (isAiCoachOpen) {
      setIsHiddenForAi(true);
    } else {
      const timer = window.setTimeout(() => setIsHiddenForAi(false), 280);
      return () => window.clearTimeout(timer);
    }
  }, [isAiCoachOpen]);
  const completion = Math.round((teamLength / 6) * 100);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerationMenuOpen, setIsGenerationMenuOpen] = useState(false);
  const [shouldRenderGenerationMenu, setShouldRenderGenerationMenu] = useState(false);
  const [hoveredGenerationItem, setHoveredGenerationItem] = useState<number | null>(null);
  const [isDesktopCompact, setIsDesktopCompact] = useState(false);
  const [generationMenuQuery, setGenerationMenuQuery] = useState("");
  const settingsRefMobile = useRef<HTMLDivElement | null>(null);
  const settingsRefDesktop = useRef<HTMLDivElement | null>(null);
  const generationRefMobile = useRef<HTMLDivElement | null>(null);
  const generationRefDesktop = useRef<HTMLDivElement | null>(null);
  const generationMenuSearchRef = useRef<HTMLInputElement | null>(null);
  const currentGenerationMeta = GENERATION_META.find((meta) => meta.generation === generation);
  const currentGenerationRegionInfo = currentGenerationMeta ? getGenerationRegionInfo(currentGenerationMeta) : null;
  const normalizedGenerationMenuQuery = generationMenuQuery.trim().toLowerCase();
  const filteredGenerationMeta = useMemo(() => {
    if (!normalizedGenerationMenuQuery) return GENERATION_META;
    return GENERATION_META.map((meta) => ({
      ...meta,
      games: meta.games.filter((gameEntry) => {
        const searchable = `${meta.generation} ${gameEntry.name} ${gameEntry.region}`.toLowerCase();
        return searchable.includes(normalizedGenerationMenuQuery);
      }),
    })).filter((meta) => meta.games.length > 0);
  }, [normalizedGenerationMenuQuery]);

  const renderGenerationGameLink = (
    meta: (typeof GENERATION_META)[number],
    gameEntry: (typeof GENERATION_META)[number]["games"][number]
  ) => {
    const isCurrentGen = meta.generation === generation;
    const isActiveGame = isCurrentGen && game.id === gameEntry.id;
    const isHovered = hoveredGenerationItem === meta.generation * 100 + gameEntry.id;

    return (
      <AppLink
        key={gameEntry.id}
        href={`/game/gen${meta.generation}`}
        onClick={(e) => {
          try {
            localStorage.setItem(getSelectedGameStorageKey(meta.generation), String(gameEntry.id));
          } catch {}
          if (isCurrentGen) {
            e.preventDefault();
            onGameChange(gameEntry.id);
          }
          setIsGenerationMenuOpen(false);
          setHoveredGenerationItem(null);
          setGenerationMenuQuery("");
        }}
        onMouseEnter={() => setHoveredGenerationItem(meta.generation * 100 + gameEntry.id)}
        onMouseLeave={() =>
          setHoveredGenerationItem((prev) =>
            prev === meta.generation * 100 + gameEntry.id ? null : prev
          )
        }
        onFocus={() => setHoveredGenerationItem(meta.generation * 100 + gameEntry.id)}
        onBlur={() =>
          setHoveredGenerationItem((prev) =>
            prev === meta.generation * 100 + gameEntry.id ? null : prev
          )
        }
        className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-[0.72rem] font-semibold transition-[background-color,border-color,color,transform] duration-150"
        style={{
          background: isActiveGame
            ? "var(--version-color-soft, var(--accent-soft))"
            : isHovered
              ? "var(--surface-2)"
              : "transparent",
          color:
            isActiveGame || isHovered ? "var(--text-primary)" : "var(--text-secondary)",
          border: isActiveGame
            ? "1px solid var(--version-color-border, rgba(218,44,67,0.34))"
            : isHovered
              ? "1px solid var(--border)"
              : "1px solid transparent",
          transform:
            isHovered && !settings.reduceMotion
              ? "translateX(2px)"
              : "translateX(0)",
        }}
        role="menuitem"
        aria-label={`Go to ${gameEntry.name}`}
        aria-current={isActiveGame ? "page" : undefined}
      >
        <span className="truncate">{gameEntry.name}</span>
        <span className="ml-auto mr-1 hidden text-[0.6rem] font-semibold uppercase tracking-[0.08em] sm:inline" style={{ color: "var(--text-muted)" }}>
          {gameEntry.region}
        </span>
        {isActiveGame && (
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[0.56rem] font-bold uppercase tracking-[0.08em]"
            style={{ background: "var(--version-color-soft, var(--accent-soft))", color: "var(--text-muted)" }}
          >
            active
          </span>
        )}
      </AppLink>
    );
  };

  // Renders a generation group with region-grouped game links
  const renderGenerationMenuItem = (meta: (typeof GENERATION_META)[number]) => {
    const regionInfo = getGenerationRegionInfo(meta);
    const gamesByRegion = meta.games.reduce<Record<string, typeof meta.games>>((groups, gameEntry) => {
      const key = gameEntry.region || "Unknown";
      groups[key] = groups[key] ? [...groups[key], gameEntry] : [gameEntry];
      return groups;
    }, {});

    return (
      <div key={meta.generation}>
        <div
          className="flex items-center gap-1.5 px-2.5 pb-0.5 pt-2"
          aria-hidden="true"
        >
          <span
            className="text-[0.6rem] font-bold uppercase tracking-[0.14em]"
            style={{ color: "var(--text-muted)" }}
          >
            Gen {meta.generation}
          </span>
          <span className="text-[0.6rem] uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
            · {regionInfo.regionsLabel}
          </span>
          <div
            className="ml-auto h-px flex-1 opacity-40"
            style={{ background: "var(--border)" }}
          />
        </div>

        {Object.entries(gamesByRegion).map(([region, regionGames], regionIndex) => (
          <div key={`${meta.generation}-${region}`}>
            {(regionInfo.hasMultipleRegions || normalizedGenerationMenuQuery) && (
              <p
                className={`px-2.5 text-[0.58rem] font-semibold uppercase tracking-[0.12em] ${
                  regionIndex === 0 ? "pt-1" : "pt-1.5"
                }`}
                style={{ color: "var(--text-muted)", opacity: 0.9 }}
              >
                {region}
              </p>
            )}
            {regionGames.map((gameEntry) => renderGenerationGameLink(meta, gameEntry))}
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (!isSettingsOpen && !isGenerationMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedMobile = settingsRefMobile.current?.contains(target) ?? false;
      const clickedDesktop = settingsRefDesktop.current?.contains(target) ?? false;
      const clickedGenerationMobile = generationRefMobile.current?.contains(target) ?? false;
      const clickedGenerationDesktop = generationRefDesktop.current?.contains(target) ?? false;
      if (!clickedMobile && !clickedDesktop && !clickedGenerationMobile && !clickedGenerationDesktop) {
        setIsSettingsOpen(false);
        setIsGenerationMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSettingsOpen(false);
        setIsGenerationMenuOpen(false);
      }
      if (event.key === "/" && isGenerationMenuOpen) {
        event.preventDefault();
        generationMenuSearchRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isGenerationMenuOpen, isSettingsOpen]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const updateCompactState = () => {
      setIsDesktopCompact(desktopQuery.matches && window.scrollY > 56);
    };

    updateCompactState();
    window.addEventListener("scroll", updateCompactState, { passive: true });
    desktopQuery.addEventListener("change", updateCompactState);
    return () => {
      window.removeEventListener("scroll", updateCompactState);
      desktopQuery.removeEventListener("change", updateCompactState);
    };
  }, []);

  useEffect(() => {
    if (isGenerationMenuOpen) {
      setShouldRenderGenerationMenu(true);
      return;
    }

    setHoveredGenerationItem(null);
    setGenerationMenuQuery("");

    const timeoutId = window.setTimeout(
      () => setShouldRenderGenerationMenu(false),
      settings.reduceMotion ? 0 : GENERATION_MENU_ANIMATION_MS
    );
    return () => window.clearTimeout(timeoutId);
  }, [isGenerationMenuOpen, settings.reduceMotion]);

  useEffect(() => {
    if (!isGenerationMenuOpen) return;
    const timeoutId = window.setTimeout(() => {
      generationMenuSearchRef.current?.focus();
    }, settings.reduceMotion ? 0 : 70);
    return () => window.clearTimeout(timeoutId);
  }, [isGenerationMenuOpen, settings.reduceMotion]);

  const generationMenuAnimationClass = settings.reduceMotion
    ? ""
    : isGenerationMenuOpen
      ? "translate-y-0 scale-100 opacity-100"
      : "-translate-y-0.5 scale-[0.995] opacity-0 pointer-events-none";
  const generationMenuContent = (
    <>
      <div
        className="sticky top-0 z-[2] rounded-lg border p-2"
        style={{
          borderColor: "var(--border)",
          background: "color-mix(in srgb, var(--surface-1) 88%, transparent)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      >
        <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
          Current run
        </p>
        <p className="mt-0.5 text-[0.68rem] font-semibold" style={{ color: "var(--text-secondary)" }}>
          Gen {generation} · {game.name} · {game.region}
        </p>

        <div className="relative mt-2">
          <FiSearch
            size={12}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
            aria-hidden="true"
          />
          <input
            ref={generationMenuSearchRef}
            value={generationMenuQuery}
            onChange={(event) => setGenerationMenuQuery(event.target.value)}
            className="w-full rounded-lg border py-1.5 pl-7 pr-8 text-[0.7rem] outline-none"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-2)",
              color: "var(--text-primary)",
            }}
            placeholder="Search generation, game, or region"
            aria-label="Search games in generation switcher"
          />
          {generationMenuQuery && (
            <button
              type="button"
              onClick={() => setGenerationMenuQuery("")}
              className="absolute right-1.5 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md"
              style={{ color: "var(--text-muted)" }}
              aria-label="Clear generation search"
            >
              <FiX size={11} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-1">
        {filteredGenerationMeta.length > 0 ? (
          filteredGenerationMeta.map((meta) => renderGenerationMenuItem(meta))
        ) : (
          <p className="px-2.5 py-3 text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
            No generation or game matches “{generationMenuQuery.trim()}”.
          </p>
        )}
      </div>
    </>
  );

  const header = (
    <header
      id="team-builder-header"
      className={`glass sticky top-0 z-40 w-full border-b${isHiddenForAi ? " max-lg:hidden" : ""}`}
      style={{
        ...versionCssVars,
        borderColor: "var(--border)",
      }}
      role="banner"
    >
      <div
        className={`mx-auto max-w-screen-xl px-4 sm:px-6 ${isDesktopCompact ? "py-2.5 lg:py-2" : "py-3 lg:py-3"}`}
        style={{ transition: "padding 0.2s ease" }}
      >
        <div className="lg:hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2.5">
                <AppLink
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    onBackToGameSelect();
                  }}
                  className="game-nav-back-link inline-flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                  aria-label="Go back to game selection"
                >
                  <FiArrowLeft size={14} aria-hidden="true" />
                </AppLink>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <AppLink
                      href="/"
                      className="game-nav-logo-link font-display shrink-0 text-[0.95rem] leading-none"
                      style={{ letterSpacing: "-0.02em", color: "var(--text-primary)", textDecoration: "none" }}
                      aria-label="Slatedex home"
                    >
                      Slate<span style={{ color: "var(--accent)" }}>dex</span>
                    </AppLink>
                    <div className="relative shrink-0" ref={generationRefMobile}>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em]"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                        onClick={() => {
                          setIsGenerationMenuOpen((prev) => !prev);
                          setIsSettingsOpen(false);
                        }}
                        aria-expanded={isGenerationMenuOpen}
                        aria-haspopup="menu"
                        aria-label="Switch generation"
                      >
                        Gen {generation}
                        {currentGenerationRegionInfo?.hasMultipleRegions && (
                          <span className="hidden min-[390px]:inline"> · {currentGenerationRegionInfo.regionCountLabel}</span>
                        )}
                        <FiChevronDown
                          size={11}
                          aria-hidden="true"
                          style={{ transform: isGenerationMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
                        />
                      </button>

                      {shouldRenderGenerationMenu && (
                        <div
                          className={`absolute left-0 top-[calc(100%+0.35rem)] z-[85] w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border p-1.5 origin-top transform-gpu transition-[opacity,transform] max-h-[70vh] overflow-y-auto custom-scrollbar ${generationMenuAnimationClass}`}
                          style={{
                            borderColor: "var(--border)",
                            background: "var(--surface-1)",
                            boxShadow: "var(--shadow-soft)",
                            transitionDuration: settings.reduceMotion ? "0ms" : `${GENERATION_MENU_ANIMATION_MS}ms`,
                            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                          }}
                          role="menu"
                          aria-label="Switch generation"
                        >
                          {generationMenuContent}
                        </div>
                      )}
                    </div>
                  </div>
                  <h1 className="font-display mt-0.5 truncate text-sm leading-tight" style={{ color: "var(--text-secondary)" }}>
                    {game.name}
                    <span className="ml-1.5 hidden text-[0.72rem] font-normal uppercase tracking-[0.08em] min-[420px]:inline" style={{ color: "var(--text-muted)" }}>
                      · {game.region}
                    </span>
                  </h1>
                </div>
              </div>
            </div>

            <div className="shrink-0 sm:hidden">
              <UserMenu compactOnMobile />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2.5">
            <div className="h-1.5 w-36 overflow-hidden rounded-full" style={{ background: "rgba(148, 163, 184, 0.24)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${completion}%`,
                  background: "linear-gradient(90deg, var(--version-color, var(--accent)) 0%, color-mix(in srgb, var(--version-color, var(--accent)) 60%, #ef6f40) 100%)",
                  transition: "width 0.3s ease, background 0.35s ease",
                }}
              />
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
              {teamLength}/6 slots filled
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-nowrap sm:items-center sm:justify-end" role="toolbar" aria-label="Team management">
            <div className="relative col-span-1 sm:col-auto" ref={settingsRefMobile}>
              <button
                type="button"
                onClick={() => {
                  setIsGenerationMenuOpen(false);
                  setIsSettingsOpen((prev) => !prev);
                }}
                className="btn-secondary action-btn w-full sm:w-auto"
                aria-label="Open builder settings"
                aria-expanded={isSettingsOpen}
                aria-haspopup="dialog"
              >
                <FiSettings size={14} aria-hidden="true" />
                Settings
                <FiChevronDown
                  size={12}
                  aria-hidden="true"
                  style={{ transform: isSettingsOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
                />
              </button>

              {isSettingsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[79] sm:hidden"
                    style={{ background: "rgba(0,0,0,0.25)", touchAction: "none" }}
                    onClick={() => setIsSettingsOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute left-0 top-[calc(100%+0.45rem)] z-[80] w-[22rem] max-w-[calc(100vw-2rem)] sm:left-auto sm:right-0">
                  <BuilderSettingsPanel
                    settings={settings}
                    onDexModeChange={onSettingsDexModeChange}
                    onVersionFilterDefaultChange={onSettingsVersionFilterDefaultChange}
                    onCardDensityChange={onSettingsCardDensityChange}
                    onReduceMotionChange={onSettingsReduceMotionChange}
                    onDragBehaviorChange={onSettingsDragBehaviorChange}
                    onVersionThemingChange={onSettingsVersionThemingChange}
                    onMobileHapticsChange={onSettingsMobileHapticsChange}
                    onReset={onSettingsReset}
                  />
                </div>
                </>
              )}
            </div>

            <button
              onClick={onShuffle}
              disabled={teamLength === 0}
              className="btn-secondary action-btn col-span-1 w-full sm:w-auto disabled:pointer-events-none disabled:opacity-50"
              aria-label="Shuffle current team members"
            >
              <FiShuffle size={14} aria-hidden="true" />
              Shuffle
            </button>
            <button
              onClick={onClear}
              disabled={teamLength === 0}
              className="btn-danger action-btn col-span-2 w-full sm:w-auto disabled:pointer-events-none disabled:opacity-50"
              aria-label="Clear all team members"
            >
              <FiTrash2 size={14} aria-hidden="true" />
              Clear Team
            </button>
            <div className="hidden sm:block">
              <UserMenu />
            </div>
          </div>
        </div>

        <div className="hidden items-center justify-between gap-5 lg:flex" role="toolbar" aria-label="Team management">
          <div className={`min-w-0 flex items-center ${isDesktopCompact ? "gap-3" : "gap-3.5"}`} style={{ transition: "gap 0.2s ease" }}>
            <AppLink
              href="#"
              onClick={(event) => {
                event.preventDefault();
                onBackToGameSelect();
              }}
              className="game-nav-back-link inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              aria-label="Go back to game selection"
            >
              <FiArrowLeft size={14} aria-hidden="true" />
            </AppLink>

            <AppLink
              href="/"
              className={`game-nav-logo-link font-display shrink-0 leading-none transition-all duration-200 ${isDesktopCompact ? "text-[0.9rem]" : "text-[1.05rem]"}`}
              style={{ letterSpacing: "-0.02em", color: "var(--text-primary)", textDecoration: "none" }}
              aria-label="Slatedex home"
            >
              Slate<span style={{ color: "var(--accent)" }}>dex</span>
            </AppLink>

            <div
              className="h-4 w-px shrink-0"
              style={{ background: "var(--border)" }}
              aria-hidden="true"
            />

            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <div className="relative" ref={generationRefDesktop}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em]"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                    onClick={() => {
                      setIsGenerationMenuOpen((prev) => !prev);
                      setIsSettingsOpen(false);
                    }}
                    aria-expanded={isGenerationMenuOpen}
                    aria-haspopup="menu"
                    aria-label="Switch generation"
                  >
                    Gen {generation} · {currentGenerationRegionInfo?.regionsLabel ?? game.region}
                    <FiChevronDown
                      size={12}
                      aria-hidden="true"
                      style={{ transform: isGenerationMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
                    />
                  </button>

                  {shouldRenderGenerationMenu && (
                    <div
                      className={`absolute left-0 top-[calc(100%+0.35rem)] z-[85] w-64 rounded-xl border p-1.5 origin-top transform-gpu transition-[opacity,transform] max-h-[70vh] overflow-y-auto custom-scrollbar ${generationMenuAnimationClass}`}
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--surface-1)",
                        boxShadow: "var(--shadow-soft)",
                        transitionDuration: settings.reduceMotion ? "0ms" : `${GENERATION_MENU_ANIMATION_MS}ms`,
                        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                      role="menu"
                      aria-label="Switch generation"
                    >
                      {generationMenuContent}
                    </div>
                  )}
                </div>
              </div>

              <div className={`flex items-center gap-2.5 ${isDesktopCompact ? "mt-0" : "mt-0.5"}`} style={{ transition: "margin-top 0.2s ease" }}>
                <h1 className={`font-display truncate leading-tight ${isDesktopCompact ? "text-base" : "text-lg"}`} style={{ color: "var(--text-primary)", transition: "font-size 0.2s ease" }}>
                  {game.name}
                </h1>

                <div className="flex items-center gap-2.5">
                  <div
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ width: isDesktopCompact ? "8.5rem" : "11rem", background: "rgba(148, 163, 184, 0.24)", transition: "width 0.2s ease" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${completion}%`,
                        background: "linear-gradient(90deg, var(--version-color, var(--accent)) 0%, color-mix(in srgb, var(--version-color, var(--accent)) 60%, #ef6f40) 100%)",
                        transition: "width 0.3s ease, background 0.35s ease",
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
                    {teamLength}/6 slots filled
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" ref={settingsRefDesktop}>
              <button
                type="button"
                onClick={() => {
                  setIsGenerationMenuOpen(false);
                  setIsSettingsOpen((prev) => !prev);
                }}
                className="btn-secondary action-btn"
                aria-label="Open builder settings"
                aria-expanded={isSettingsOpen}
                aria-haspopup="dialog"
              >
                <FiSettings size={14} aria-hidden="true" />
                Settings
                <FiChevronDown
                  size={12}
                  aria-hidden="true"
                  style={{ transform: isSettingsOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
                />
              </button>

              {isSettingsOpen && (
                <div className="absolute right-0 top-[calc(100%+0.45rem)] z-[80] w-[22rem]">
                  <BuilderSettingsPanel
                    settings={settings}
                    onDexModeChange={onSettingsDexModeChange}
                    onVersionFilterDefaultChange={onSettingsVersionFilterDefaultChange}
                    onCardDensityChange={onSettingsCardDensityChange}
                    onReduceMotionChange={onSettingsReduceMotionChange}
                    onDragBehaviorChange={onSettingsDragBehaviorChange}
                    onVersionThemingChange={onSettingsVersionThemingChange}
                    onMobileHapticsChange={onSettingsMobileHapticsChange}
                    onReset={onSettingsReset}
                  />
                </div>
              )}
            </div>

            <button
              onClick={onShuffle}
              disabled={teamLength === 0}
              className="btn-secondary action-btn disabled:pointer-events-none disabled:opacity-50"
              aria-label="Shuffle current team members"
            >
              <FiShuffle size={14} aria-hidden="true" />
              Shuffle
            </button>

            <button
              onClick={onClear}
              disabled={teamLength === 0}
              className="btn-danger action-btn disabled:pointer-events-none disabled:opacity-50"
              aria-label="Clear all team members"
            >
              <FiTrash2 size={14} aria-hidden="true" />
              Clear Team
            </button>

            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );

  return header;
};

export default TeamBuilderHeader;
