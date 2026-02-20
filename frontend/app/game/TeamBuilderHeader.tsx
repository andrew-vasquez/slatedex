"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiChevronDown, FiSettings, FiShuffle, FiTrash2 } from "react-icons/fi";
import { GENERATION_META } from "@/lib/pokemon";
import type { BuilderSettings, CardDensity, DexMode, DragBehavior, Game } from "@/lib/types";
import BuilderSettingsPanel from "./BuilderSettingsPanel";
import UserMenu from "@/components/auth/UserMenu";

interface TeamBuilderHeaderProps {
  game: Game;
  generation: number;
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
  onSettingsReset: () => void;
}

const TeamBuilderHeader = ({
  game,
  generation,
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
  onSettingsReset,
}: TeamBuilderHeaderProps) => {
  const completion = Math.round((teamLength / 6) * 100);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerationMenuOpen, setIsGenerationMenuOpen] = useState(false);
  const [isDesktopCompact, setIsDesktopCompact] = useState(false);
  const settingsRefMobile = useRef<HTMLDivElement | null>(null);
  const settingsRefDesktop = useRef<HTMLDivElement | null>(null);
  const generationRefMobile = useRef<HTMLDivElement | null>(null);
  const generationRefDesktop = useRef<HTMLDivElement | null>(null);

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

  return (
    <header className="glass sticky top-0 z-40 border-b lg:fixed lg:left-0 lg:right-0" style={{ borderColor: "var(--border)" }} role="banner">
      <div
        className={`mx-auto max-w-screen-xl px-4 sm:px-6 ${isDesktopCompact ? "py-2.5 lg:py-2" : "py-3 lg:py-3"}`}
        style={{ transition: "padding 0.2s ease" }}
      >
        <div className="lg:hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2.5">
                <Link
                  href="/play"
                  className="game-nav-back-link inline-flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                  aria-label="Go back to game selection"
                >
                  <FiArrowLeft size={14} aria-hidden="true" />
                </Link>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href="/"
                      className="game-nav-logo-link font-display shrink-0 text-[0.95rem] leading-none"
                      style={{ letterSpacing: "-0.02em", color: "var(--text-primary)", textDecoration: "none" }}
                      aria-label="Slatedex home"
                    >
                      Slate<span style={{ color: "var(--accent)" }}>dex</span>
                    </Link>
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
                        <FiChevronDown
                          size={11}
                          aria-hidden="true"
                          style={{ transform: isGenerationMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
                        />
                      </button>

                      {isGenerationMenuOpen && (
                        <div
                          className="absolute left-0 top-[calc(100%+0.35rem)] z-[85] w-52 rounded-xl border p-1.5"
                          style={{ borderColor: "var(--border)", background: "var(--surface-1)", boxShadow: "var(--shadow-soft)" }}
                          role="menu"
                          aria-label="Switch generation"
                        >
                          {GENERATION_META.map((meta) => {
                            const isActive = meta.generation === generation;
                            return (
                              <Link
                                key={meta.generation}
                                href={`/game/${meta.generation}`}
                                onClick={() => setIsGenerationMenuOpen(false)}
                                className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[0.74rem] font-semibold transition-colors"
                                style={{
                                  background: isActive ? "var(--version-color-soft, var(--accent-soft))" : "transparent",
                                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                                  border: isActive ? "1px solid var(--version-color-border, rgba(218, 44, 67, 0.34))" : "1px solid transparent",
                                }}
                                role="menuitem"
                              >
                                <span>Gen {meta.generation}</span>
                                <span className="text-[0.64rem] uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
                                  {meta.region}
                                </span>
                              </Link>
                            );
                          })}
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
                <div className="absolute left-0 top-[calc(100%+0.45rem)] z-[80] w-[22rem] max-w-[calc(100vw-2rem)] sm:left-auto sm:right-0">
                  <BuilderSettingsPanel
                    settings={settings}
                    onDexModeChange={onSettingsDexModeChange}
                    onVersionFilterDefaultChange={onSettingsVersionFilterDefaultChange}
                    onCardDensityChange={onSettingsCardDensityChange}
                    onReduceMotionChange={onSettingsReduceMotionChange}
                    onDragBehaviorChange={onSettingsDragBehaviorChange}
                    onVersionThemingChange={onSettingsVersionThemingChange}
                    onReset={onSettingsReset}
                  />
                </div>
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
            <Link
              href="/play"
              className="game-nav-back-link inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              aria-label="Go back to game selection"
            >
              <FiArrowLeft size={14} aria-hidden="true" />
            </Link>

            <Link
              href="/"
              className={`game-nav-logo-link font-display shrink-0 leading-none transition-all duration-200 ${isDesktopCompact ? "text-[0.9rem]" : "text-[1.05rem]"}`}
              style={{ letterSpacing: "-0.02em", color: "var(--text-primary)", textDecoration: "none" }}
              aria-label="Slatedex home"
            >
              Slate<span style={{ color: "var(--accent)" }}>dex</span>
            </Link>

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
                    Gen {generation} · {game.region}
                    <FiChevronDown
                      size={12}
                      aria-hidden="true"
                      style={{ transform: isGenerationMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
                    />
                  </button>

                  {isGenerationMenuOpen && (
                    <div
                      className="absolute left-0 top-[calc(100%+0.35rem)] z-[85] w-56 rounded-xl border p-1.5"
                      style={{ borderColor: "var(--border)", background: "var(--surface-1)", boxShadow: "var(--shadow-soft)" }}
                      role="menu"
                      aria-label="Switch generation"
                    >
                      {GENERATION_META.map((meta) => {
                        const isActive = meta.generation === generation;
                        return (
                          <Link
                            key={meta.generation}
                            href={`/game/${meta.generation}`}
                            onClick={() => setIsGenerationMenuOpen(false)}
                            className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[0.74rem] font-semibold transition-colors"
                            style={{
                              background: isActive ? "var(--version-color-soft, var(--accent-soft))" : "transparent",
                              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                              border: isActive ? "1px solid var(--version-color-border, rgba(218, 44, 67, 0.34))" : "1px solid transparent",
                            }}
                            role="menuitem"
                          >
                            <span>Gen {meta.generation}</span>
                            <span className="text-[0.64rem] uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
                              {meta.region}
                            </span>
                          </Link>
                        );
                      })}
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
};

export default TeamBuilderHeader;
