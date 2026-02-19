"use client";

import { FiChevronDown, FiSearch, FiX } from "react-icons/fi";
import { type UIEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import PokemonCard from "@/app/game/PokemonCard";
import AnimatedNumber from "@/app/game/AnimatedNumber";
import { getAvailableTypes, TYPE_COLORS } from "@/lib/constants";
import type { CardDensity, DexMode, Pokemon, Game } from "@/lib/types";

interface PokemonSelectionProps {
  filteredPokemon: Pokemon[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddPokemon: (pokemon: Pokemon) => void;
  currentTeamLength: number;
  dexMode: DexMode;
  onDexModeChange: (mode: DexMode) => void;
  regionalAvailable: boolean;
  dexNotice: string | null;
  generation: number;
  versions: { id: string; label: string }[];
  selectedVersionId: string;
  onVersionChange: (versionId: string) => void;
  versionFilterEnabled: boolean;
  onVersionFilterChange: (enabled: boolean) => void;
  dragEnabled: boolean;
  games?: Game[];
  selectedGameId?: number;
  onGameChange?: (gameId: number) => void;
  typeFilter?: string[];
  onTypeFilterChange?: (types: string[]) => void;
  onInspect?: (pokemon: Pokemon) => void;
  cardDensity?: CardDensity;
  isLoadingData?: boolean;
}

const GRID_GAP_PX = 10;
const OVERSCAN_ROWS = 4;
const STEP_ONE_TIP_DISMISSED_KEY = "poke-builder:step-one-tip-dismissed";

const PokemonSelection = ({
  filteredPokemon,
  searchTerm,
  onSearchChange,
  onAddPokemon,
  currentTeamLength,
  dexMode,
  onDexModeChange,
  regionalAvailable,
  dexNotice,
  generation,
  versions,
  selectedVersionId,
  onVersionChange,
  versionFilterEnabled,
  onVersionFilterChange,
  dragEnabled,
  games,
  selectedGameId,
  onGameChange,
  typeFilter,
  onTypeFilterChange,
  onInspect,
  cardDensity = "comfortable",
  isLoadingData = false,
}: PokemonSelectionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const rowObserversRef = useRef<Map<number, ResizeObserver>>(new Map());
  const pendingScrollTopRef = useRef(0);
  const [columns, setColumns] = useState(1);
  const [measuredRowHeights, setMeasuredRowHeights] = useState<Record<number, number>>({});
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [filterTransitionToken, setFilterTransitionToken] = useState(0);
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);
  const [isStepOneTipDismissed, setIsStepOneTipDismissed] = useState(false);

  const versionLabelMap: Record<string, string> = useMemo(
    () => Object.fromEntries(versions.map((version) => [version.id, version.label])),
    [versions]
  );
  const activeTypeFilters = typeFilter ?? [];
  const hasMultipleGames = Boolean(games && games.length > 1 && onGameChange);
  const gameOptions = hasMultipleGames ? games ?? [] : [];

  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const updateColumns = () => setColumns(query.matches ? 2 : 1);

    updateColumns();
    query.addEventListener("change", updateColumns);

    return () => query.removeEventListener("change", updateColumns);
  }, []);

  useEffect(() => {
    const node = scrollContainerRef.current;
    if (!node) return;

    const updateViewportHeight = () => {
      setViewportHeight(node.clientHeight);
      setScrollTop(node.scrollTop);
    };

    updateViewportHeight();

    const observer = new ResizeObserver(updateViewportHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [filteredPokemon.length]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      for (const observer of rowObserversRef.current.values()) {
        observer.disconnect();
      }
      rowObserversRef.current.clear();
    };
  }, []);

  useEffect(() => {
    setFilterTransitionToken((token) => token + 1);
    setIsFilterTransitioning(true);
    const timer = setTimeout(() => setIsFilterTransitioning(false), 260);
    return () => clearTimeout(timer);
  }, [searchTerm, typeFilter, dexMode, versionFilterEnabled, selectedVersionId, selectedGameId]);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(STEP_ONE_TIP_DISMISSED_KEY);
      if (dismissed === "1") {
        setIsStepOneTipDismissed(true);
      }
    } catch {
      // Ignore localStorage access errors (private mode, disabled storage, etc.)
    }
  }, []);

  const rowRefCallbacksRef = useRef<Map<number, (node: HTMLDivElement | null) => void>>(new Map());

  useEffect(() => {
    setMeasuredRowHeights({});

    for (const observer of rowObserversRef.current.values()) {
      observer.disconnect();
    }
    rowObserversRef.current.clear();
    rowRefCallbacksRef.current.clear();
  }, [columns]);

  const getRowRef = useCallback((row: number) => {
    let cb = rowRefCallbacksRef.current.get(row);
    if (!cb) {
      cb = (node: HTMLDivElement | null) => {
        const existingObserver = rowObserversRef.current.get(row);
        if (existingObserver) {
          existingObserver.disconnect();
          rowObserversRef.current.delete(row);
        }

        if (!node) return;

        const syncHeight = () => {
          const next = Math.round(node.getBoundingClientRect().height);
          if (next <= 0) return;
          setMeasuredRowHeights((prev) => {
            if (prev[row] === next) return prev;
            return { ...prev, [row]: next };
          });
        };

        const observer = new ResizeObserver(syncHeight);
        observer.observe(node);
        rowObserversRef.current.set(row, observer);
      };
      rowRefCallbacksRef.current.set(row, cb);
    }
    return cb;
  }, []);

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    pendingScrollTopRef.current = event.currentTarget.scrollTop;

    if (rafIdRef.current !== null) return;

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      setScrollTop(pendingScrollTopRef.current);
    });
  }, []);

  const dismissStepOneTip = useCallback(() => {
    setIsStepOneTipDismissed(true);
    try {
      window.localStorage.setItem(STEP_ONE_TIP_DISMISSED_KEY, "1");
    } catch {
      // Ignore localStorage access errors.
    }
  }, []);

  const rowCount = Math.ceil(filteredPokemon.length / columns);
  const defaultRowHeight = cardDensity === "compact" ? 122 : 190;
  const { rowOffsets, totalHeight } = useMemo(() => {
    if (rowCount === 0) return { rowOffsets: [] as number[], totalHeight: 0 };

    const offsets: number[] = new Array(rowCount);
    let y = 0;

    for (let row = 0; row < rowCount; row += 1) {
      offsets[row] = y;
      const rowHeight = measuredRowHeights[row] ?? defaultRowHeight;
      y += rowHeight;
      if (row < rowCount - 1) y += GRID_GAP_PX;
    }

    return { rowOffsets: offsets, totalHeight: y };
  }, [defaultRowHeight, measuredRowHeights, rowCount]);

  const maxVisibleBottom = scrollTop + viewportHeight;

  const visibleRows = useMemo(() => {
    if (rowCount === 0) return [];

    const getRowHeight = (row: number) => measuredRowHeights[row] ?? defaultRowHeight;

    let firstVisibleRow = 0;
    while (firstVisibleRow < rowCount) {
      const rowBottom = rowOffsets[firstVisibleRow] + getRowHeight(firstVisibleRow);
      if (rowBottom >= scrollTop) break;
      firstVisibleRow += 1;
    }

    let lastVisibleRow = firstVisibleRow;
    while (lastVisibleRow < rowCount) {
      if (rowOffsets[lastVisibleRow] > maxVisibleBottom) break;
      lastVisibleRow += 1;
    }

    const startRow = Math.max(0, firstVisibleRow - OVERSCAN_ROWS);
    const endRow = Math.min(rowCount - 1, lastVisibleRow + OVERSCAN_ROWS);

    const rows: Array<{ row: number; top: number; startIndex: number; items: Pokemon[] }> = [];
    for (let row = startRow; row <= endRow; row += 1) {
      const startIndex = row * columns;
      rows.push({
        row,
        top: rowOffsets[row],
        startIndex,
        items: filteredPokemon.slice(startIndex, startIndex + columns),
      });
    }
    return rows;
  }, [cardDensity, columns, defaultRowHeight, filteredPokemon, maxVisibleBottom, measuredRowHeights, rowCount, rowOffsets, scrollTop]);

  return (
    <section className="panel p-3.5 sm:p-5" aria-labelledby="available-pokemon-heading">
      <div className="mb-3 sm:mb-5">
        <div className="rounded-2xl border p-3 sm:p-3.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0">
              <h2 id="available-pokemon-heading" className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
                Step 1: Pick Pokémon
              </h2>
              <p className="mt-1 text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
                Search, then refine with game and advanced filters.
              </p>
            </div>
            <span
              className="shrink-0 rounded-md px-2 py-0.5 text-[0.75rem] font-semibold tabular-nums"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
              aria-label={`${filteredPokemon.length} Pokémon available`}
            >
              <AnimatedNumber value={filteredPokemon.length} />
            </span>
          </div>

          <div className="mt-3 space-y-2.5">
            <div className="relative">
              <label htmlFor="pokemon-search" className="sr-only">
                Search Pokémon
              </label>
              <FiSearch
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                size={14}
                style={{ color: "var(--text-muted)" }}
                aria-hidden="true"
              />

              <input
                id="pokemon-search"
                name="pokemon-search"
                type="search"
                placeholder="Search by name (press /)"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-xl py-2 pl-8 pr-8 text-sm"
                style={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />

              {searchTerm.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1"
                  style={{ color: "var(--text-muted)" }}
                  aria-label="Clear search"
                >
                  <FiX size={14} aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="hidden flex-wrap gap-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.06em] sm:flex">
              <span className="rounded-md border px-2 py-0.5" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                Dex {dexMode === "regional" ? "Regional" : "National"}
              </span>
              <span className="rounded-md border px-2 py-0.5" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                Version {versionLabelMap[selectedVersionId] ?? selectedVersionId}
              </span>
              <span className="rounded-md border px-2 py-0.5" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                {versionFilterEnabled ? "Version-only entries" : "All entries"}
              </span>
              {activeTypeFilters.length > 0 ? (
                <span className="rounded-md border px-2 py-0.5" style={{ borderColor: "rgba(218, 44, 67, 0.34)", color: "var(--accent)" }}>
                  Types {activeTypeFilters.slice(0, 2).map((type) => type.charAt(0).toUpperCase() + type.slice(1)).join(", ")}
                  {activeTypeFilters.length > 2 ? ` +${activeTypeFilters.length - 2}` : ""}
                </span>
              ) : null}
            </div>

            {hasMultipleGames && (
              <div>
                <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
                  Game
                </p>
                <div className="custom-scrollbar -mx-0.5 overflow-x-auto pb-1">
                  <div
                    className="inline-flex min-w-max rounded-xl border p-1"
                    style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                    role="radiogroup"
                    aria-label="Select game"
                  >
                    {gameOptions.map((game) => {
                      const isSelected = game.id === selectedGameId;
                      return (
                        <button
                          key={game.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => onGameChange?.(game.id)}
                          className="min-w-[8.2rem] rounded-lg px-2.5 py-2 text-[0.78rem] font-semibold leading-tight"
                          style={{
                            background: isSelected ? "var(--accent-soft)" : "transparent",
                            color: isSelected ? "var(--text-primary)" : "var(--text-muted)",
                            border: isSelected ? "1px solid rgba(218, 44, 67, 0.34)" : "1px solid transparent",
                            transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
                          }}
                        >
                          <span className="block">{game.name}</span>
                          <span
                            className="mt-0.5 block text-[0.66rem] font-normal uppercase tracking-[0.08em]"
                            style={{ color: isSelected ? "var(--accent)" : "var(--text-muted)", opacity: isSelected ? 1 : 0.7 }}
                          >
                            {game.region}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border p-1.5" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
              <button
                type="button"
                onClick={() => setIsAdvancedOpen((prev) => !prev)}
                className="btn-secondary !w-full !justify-between !px-2.5 !py-1.5 !text-[0.78rem]"
                aria-expanded={isAdvancedOpen}
                aria-controls="advanced-filters-panel"
              >
                Advanced filters
                <FiChevronDown
                  size={12}
                  aria-hidden="true"
                  style={{ transform: isAdvancedOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
                />
              </button>

              <div
                id="advanced-filters-panel"
                aria-hidden={!isAdvancedOpen}
                className={`overflow-hidden transition-[max-height,opacity,transform,margin-top] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isAdvancedOpen ? "mt-2 max-h-[580px] translate-y-0 opacity-100" : "mt-0 max-h-0 -translate-y-1 opacity-0 pointer-events-none"
                }`}
              >
                <div className="space-y-2.5 pb-0.5">
                  <div>
                    <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
                      Dex Mode
                    </p>
                    <div className="inline-flex w-full rounded-xl border p-1" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
                      <button
                        type="button"
                        onClick={() => onDexModeChange("regional")}
                        disabled={!regionalAvailable}
                        aria-pressed={dexMode === "regional"}
                        className="flex-1 rounded-lg px-2 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.06em] disabled:pointer-events-none disabled:opacity-45"
                        style={{
                          background: dexMode === "regional" ? "var(--accent-soft)" : "transparent",
                          color: dexMode === "regional" ? "var(--text-primary)" : "var(--text-muted)",
                          border: dexMode === "regional" ? "1px solid rgba(218, 44, 67, 0.34)" : "1px solid transparent",
                        }}
                      >
                        Regional
                      </button>
                      <button
                        type="button"
                        onClick={() => onDexModeChange("national")}
                        aria-pressed={dexMode === "national"}
                        className="flex-1 rounded-lg px-2 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.06em]"
                        style={{
                          background: dexMode === "national" ? "var(--accent-soft)" : "transparent",
                          color: dexMode === "national" ? "var(--text-primary)" : "var(--text-muted)",
                          border: dexMode === "national" ? "1px solid rgba(218, 44, 67, 0.34)" : "1px solid transparent",
                        }}
                      >
                        National
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                    <label className="flex items-center gap-2 rounded-xl border px-2.5 py-2" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
                      <span className="text-[0.78rem] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--text-muted)" }}>
                        Version
                      </span>
                      <select
                        value={selectedVersionId}
                        onChange={(e) => onVersionChange(e.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none"
                        style={{ color: "var(--text-primary)" }}
                        aria-label="Select game version"
                      >
                        {versions.map((version) => (
                          <option key={version.id} value={version.id} style={{ color: "#111827" }}>
                            {version.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label
                      className="inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[0.78rem] font-semibold uppercase tracking-[0.06em] md:hover:cursor-pointer"
                      style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-muted)" }}
                    >
                      <input
                        type="checkbox"
                        checked={versionFilterEnabled}
                        onChange={(e) => onVersionFilterChange(e.target.checked)}
                        className="h-3.5 w-3.5 accent-[var(--accent)]"
                        aria-label="Only show Pokemon available in selected version"
                      />
                      Show Pokémon from selected version
                    </label>
                  </div>

                  {onTypeFilterChange && (
                    <div>
                      <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
                        Type Filter
                      </p>
                      <p className="mb-1 text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                        Select multiple types to match Pokémon that have all selected types.
                      </p>
                      <div className="custom-scrollbar -mx-0.5 overflow-x-auto pb-1 sm:mx-0 sm:overflow-visible sm:pb-0">
                        <div className="flex min-w-max gap-1 px-0.5 sm:min-w-0 sm:flex-wrap sm:gap-1.5 sm:px-0">
                          {getAvailableTypes(generation).map((type) => {
                            const isActive = activeTypeFilters.includes(type);
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  if (isActive) {
                                    onTypeFilterChange(activeTypeFilters.filter((entry) => entry !== type));
                                    return;
                                  }
                                  onTypeFilterChange([...activeTypeFilters, type]);
                                }}
                                className={`rounded-md px-2 py-0.5 text-[0.7rem] font-semibold transition-all duration-150 sm:px-2.5 sm:py-1 sm:text-[0.74rem] ${TYPE_COLORS[type]} ${isActive ? "" : "hover:opacity-90"}`}
                                style={{
                                  color: "#fff",
                                  border: isActive ? "1px solid rgba(255, 255, 255, 0.6)" : "1px solid transparent",
                                  boxShadow: isActive ? "0 0 0 1px rgba(255, 255, 255, 0.22) inset" : "none",
                                  opacity: isActive ? 1 : 0.68,
                                  transform: isActive ? "translateY(-1px)" : "none",
                                }}
                                aria-pressed={isActive}
                              >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </button>
                            );
                          })}
                          {activeTypeFilters.length > 0 && (
                            <button
                              type="button"
                              onClick={() => onTypeFilterChange([])}
                              className="rounded-md px-2 py-0.5 text-[0.72rem] font-semibold"
                              style={{ background: "var(--surface-3)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {dexNotice && (
        <p className="mb-2 text-xs" style={{ color: "#fca5a5" }}>
          {dexNotice}
        </p>
      )}

      {!isStepOneTipDismissed && (
        <div className="mb-3 rounded-xl border px-3 py-2 text-xs sm:text-sm" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-muted)" }}>
          <div className="flex items-start justify-between gap-2">
            <p className="pr-2">
              <span className="font-semibold">Tip:</span> Search first, then use Advanced filters for dex, version, or type.
              {" "}
              {currentTeamLength < 6
                ? dragEnabled
                  ? "Tap or drag a card to add it to your team."
                  : "Tap a card to add it to your team."
                : "Your team is full. Remove a member to add another Pokémon."}
            </p>
            <button
              type="button"
              onClick={dismissStepOneTip}
              className="shrink-0 rounded-md p-1 transition-colors"
              style={{ color: "var(--text-muted)" }}
              aria-label="Dismiss tip"
            >
              <FiX size={12} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar sm:max-h-[calc(100vh-330px)]"
        role="list"
        aria-label="Available Pokémon"
      >
        {isLoadingData ? (
          <div
            className="rounded-xl px-4 py-6 text-center text-sm"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            Loading Pokédex data...
          </div>
        ) : filteredPokemon.length === 0 ? (
          <div
            className="rounded-xl px-4 py-6 text-center text-sm"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            No matching Pokémon found. Try a different name.
          </div>
        ) : (
          <div
            style={{ position: "relative", height: totalHeight, width: "100%" }}
          >
            {visibleRows.map(({ row, top, items }, visibleRowIndex) => (
              <div
                key={`row-${row}-${filterTransitionToken}`}
                ref={getRowRef(row)}
                className={isFilterTransitioning ? "animate-filter-row" : ""}
                style={{
                  position: "absolute",
                  top,
                  left: 0,
                  right: 0,
                  display: "grid",
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  columnGap: GRID_GAP_PX,
                  animationDelay: isFilterTransitioning ? `${Math.min(visibleRowIndex * 28, 220)}ms` : undefined,
                }}
              >
                {items.map((pokemon: Pokemon, itemIndex: number) => {
                  return (
                    <div
                      key={pokemon.id}
                      role="listitem"
                      className="pokemon-list-item"
                    >
                      <PokemonCard
                        pokemon={pokemon}
                        dragId={`available-${pokemon.id}`}
                        onTap={onAddPokemon}
                        canAddToTeam={currentTeamLength < 6}
                        versionLabelMap={versionLabelMap}
                        dragEnabled={dragEnabled}
                        onInspect={onInspect}
                        isCompact={cardDensity === "compact"}
                        isAboveFold={row === 0 && itemIndex < columns}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PokemonSelection;
