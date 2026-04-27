import { FiChevronDown, FiSearch, FiX } from "react-icons/fi";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { type UIEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "~/components/ui/AppImage";
import PokemonCard from "~/features/game/PokemonCard";
import AnimatedNumber from "~/features/game/AnimatedNumber";
import { PokemonTypeBadge, PokemonTypeButton } from "@/components/ui/PokemonTypeBadge";
import { getAvailableTypes } from "@/lib/constants";
import { pokemonSpriteSrc } from "@/lib/image";
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
  allFormsAvailable?: boolean;
  dexNotice: string | null;
  generation: number;
  versions: { id: string; label: string }[];
  selectedVersionId: string;
  onVersionChange: (versionId: string) => void;
  versionFilterEnabled: boolean;
  onVersionFilterChange: (enabled: boolean) => void;
  showGameVersionControls?: boolean;
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
  allFormsAvailable = false,
  dexNotice,
  generation,
  versions,
  selectedVersionId,
  onVersionChange,
  versionFilterEnabled,
  onVersionFilterChange,
  showGameVersionControls = true,
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

  const SEARCH_HISTORY_KEY = `pokemon_search_history_gen${generation}`;
  const MAX_HISTORY = 5;

  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setSearchHistory(parsed);
      }
    } catch { /* ignore */ }
  }, [SEARCH_HISTORY_KEY]);

  const addToSearchHistory = useCallback((term: string) => {
    const trimmed = term.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return;
    setSearchHistory((prev) =>
      [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY)
    );
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {}
  }, [SEARCH_HISTORY_KEY]);

  // Persist search history whenever it changes (kept outside setState updater to avoid
  // React StrictMode double-invocation writing stale data).
  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
    } catch {}
  }, [SEARCH_HISTORY_KEY, searchHistory]);

  // Compare mode
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareList, setCompareList] = useState<Pokemon[]>([]);
  const MAX_COMPARE = 3;

  const toggleCompare = useCallback((pokemon: Pokemon) => {
    setCompareList((prev) => {
      const exists = prev.find((p) => p.id === pokemon.id);
      if (exists) return prev.filter((p) => p.id !== pokemon.id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, pokemon];
    });
  }, []);

  const exitCompareMode = useCallback(() => {
    setIsCompareMode(false);
    setCompareList([]);
  }, []);

  const versionLabelMap: Record<string, string> = useMemo(
    () => Object.fromEntries(versions.map((version) => [version.id, version.label])),
    [versions]
  );
  const activeTypeFilters = typeFilter ?? [];
  const hasMultipleGames = Boolean(games && games.length > 1 && onGameChange);
  const gameOptions = hasMultipleGames ? games ?? [] : [];

  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const lgQuery = window.matchMedia("(min-width: 1024px)");
    const updateColumns = () => {
      if (cardDensity === "compact" && lgQuery.matches) setColumns(3);
      else if (query.matches) setColumns(2);
      else setColumns(1);
    };

    updateColumns();
    query.addEventListener("change", updateColumns);
    lgQuery.addEventListener("change", updateColumns);

    return () => {
      query.removeEventListener("change", updateColumns);
      lgQuery.removeEventListener("change", updateColumns);
    };
  }, [cardDensity]);

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
  const defaultRowHeight = cardDensity === "compact" ? 52 : 190;
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
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => isCompareMode ? exitCompareMode() : setIsCompareMode(true)}
                className="hidden sm:flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.68rem] font-semibold transition-colors cursor-pointer"
                style={{
                  background: isCompareMode ? "rgba(218,44,67,0.15)" : "var(--surface-1)",
                  border: `1px solid ${isCompareMode ? "rgba(218,44,67,0.3)" : "var(--border)"}`,
                  color: isCompareMode ? "var(--accent)" : "var(--text-muted)",
                }}
                aria-label={isCompareMode ? "Exit compare mode" : "Compare Pokémon"}
              >
                {isCompareMode ? "✕ Exit" : "⚖ Compare"}
              </button>
              <span
                className="shrink-0 rounded-md px-2 py-0.5 text-[0.75rem] font-semibold tabular-nums"
                style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                aria-label={`${filteredPokemon.length} Pokémon available`}
              >
                <AnimatedNumber value={filteredPokemon.length} />
              </span>
            </div>
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
                onBlur={() => {
                  if (searchTerm.trim()) addToSearchHistory(searchTerm);
                }}
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

            {/* Recent searches */}
            {searchHistory.length > 0 && !searchTerm && (
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="shrink-0 text-[0.6rem] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Recent</span>
                {searchHistory.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => onSearchChange(term)}
                    className="search-history-chip"
                  >
                    {term}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearSearchHistory}
                  className="shrink-0 rounded p-0.5 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  aria-label="Clear search history"
                >
                  <FiX size={11} />
                </button>
              </div>
            )}

            <div className="hidden flex-wrap gap-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.06em] sm:flex">
              <span className="rounded-md border px-2 py-0.5" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                Dex {dexMode === "regional" ? "Regional" : dexMode === "all" ? "All Forms" : "National"}
              </span>
              {showGameVersionControls && (
                <span className="rounded-md border px-2 py-0.5" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                  {versionFilterEnabled ? "Version-only entries" : "All entries"}
                </span>
              )}
              {activeTypeFilters.length > 0 ? (
                <span className="rounded-md border px-2 py-0.5" style={{ borderColor: "rgba(218, 44, 67, 0.34)", color: "var(--accent)" }}>
                  Types {activeTypeFilters.slice(0, 2).map((type) => type.charAt(0).toUpperCase() + type.slice(1)).join(", ")}
                  {activeTypeFilters.length > 2 ? ` +${activeTypeFilters.length - 2}` : ""}
                </span>
              ) : null}
            </div>

            {showGameVersionControls && hasMultipleGames && (
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
                          className="min-w-[8.2rem] min-h-[44px] rounded-lg px-2.5 py-2 text-[0.78rem] font-semibold leading-tight inline-flex flex-col items-center justify-center"
                          style={{
                            background: isSelected ? "var(--version-color-soft)" : "transparent",
                            color: isSelected ? "var(--text-primary)" : "var(--text-muted)",
                            border: isSelected ? "1px solid var(--version-color-border)" : "1px solid transparent",
                            transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
                          }}
                        >
                          <span className="block">{game.name}</span>
                          <span
                            className="mt-0.5 block text-[0.66rem] font-normal uppercase tracking-[0.08em]"
                            style={{ color: isSelected ? "var(--version-color)" : "var(--text-muted)", opacity: isSelected ? 1 : 0.7 }}
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

            {showGameVersionControls && versions.length > 0 && (
              <div>
                <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
                  Version
                </p>
                <div className="relative -mx-0.5">
                <div className="custom-scrollbar overflow-x-auto pb-1">
                  <div
                    className="inline-flex min-w-max items-center rounded-xl border p-1"
                    style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                    role="radiogroup"
                    aria-label="Select game version"
                  >
                    {versions.map((version) => {
                      const isSelected = version.id === selectedVersionId;
                      return (
                        <button
                          key={version.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => onVersionChange(version.id)}
                          className="rounded-lg px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-[0.78rem] font-semibold"
                          style={{
                            background: isSelected ? "var(--version-color-soft)" : "transparent",
                            color: isSelected ? "var(--version-color)" : "var(--text-muted)",
                            border: isSelected ? "1px solid var(--version-color-border)" : "1px solid transparent",
                            transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
                          }}
                        >
                          {version.label}
                        </button>
                      );
                    })}

                    {/* Divider */}
                    <div className="mx-1 h-5 w-px" style={{ background: "var(--border)" }} />

                    {/* Filter toggle pill */}
                    <div className="inline-flex items-center gap-1">
                      <InfoTooltip
                        iconOnly
                        triggerLabel="Version filter"
                        description="Version-only: only Pokémon obtainable in the selected version (e.g. Red). All: includes version exclusives from other versions (e.g. Blue)."
                      />
                      <button
                        type="button"
                        onClick={() => onVersionFilterChange(!versionFilterEnabled)}
                        className={`rounded-lg px-3 py-2.5 min-h-[44px] inline-flex items-center justify-center text-[0.72rem] font-semibold transition-all duration-150 ${versionFilterEnabled ? "" : "exclusive-badge"}`}
                      style={{
                        background: versionFilterEnabled
                          ? "var(--version-color-soft)"
                          : undefined,
                        color: versionFilterEnabled
                          ? "var(--version-color)"
                          : undefined,
                        border: versionFilterEnabled
                          ? "1px solid var(--version-color-border)"
                          : undefined,
                      }}
                      aria-pressed={versionFilterEnabled}
                      aria-label={versionFilterEnabled ? "Showing only Pokémon from selected version — click to show all" : "Showing all Pokémon — click to filter by version"}
                    >
                      {versionFilterEnabled ? "Version Only ✓" : "Show All"}
                    </button>
                    </div>
                  </div>
                </div>
                {/* Scroll-right affordance — only visible on mobile where the row can overflow */}
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:hidden"
                  aria-hidden="true"
                  style={{ background: "linear-gradient(to right, transparent, var(--surface-1))" }}
                />
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
                  isAdvancedOpen ? "mt-2 max-h-[min(580px,70dvh)] translate-y-0 opacity-100" : "mt-0 max-h-0 -translate-y-1 opacity-0 pointer-events-none"
                }`}
              >
                <div className="space-y-2.5 pb-0.5">
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <InfoTooltip
                        label={<span className="text-[0.72rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Dex Mode</span>}
                        description="Regional: Pokémon in this game's regional Pokédex. National: full Pokédex for that generation. All Forms: every supported Pokémon form in the sandbox pool."
                      />
                    </div>
                    <div className={`grid w-full rounded-xl border p-1 ${allFormsAvailable ? "grid-cols-3" : "grid-cols-2"}`} style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
                      <button
                        type="button"
                        onClick={() => onDexModeChange("regional")}
                        disabled={!regionalAvailable}
                        aria-pressed={dexMode === "regional"}
                        className="min-h-[44px] rounded-lg px-2 py-2 text-[0.78rem] font-semibold uppercase tracking-[0.06em] disabled:pointer-events-none disabled:opacity-45"
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
                        className="min-h-[44px] rounded-lg px-2 py-2 text-[0.78rem] font-semibold uppercase tracking-[0.06em]"
                        style={{
                          background: dexMode === "national" ? "var(--accent-soft)" : "transparent",
                          color: dexMode === "national" ? "var(--text-primary)" : "var(--text-muted)",
                          border: dexMode === "national" ? "1px solid rgba(218, 44, 67, 0.34)" : "1px solid transparent",
                        }}
                      >
                        National
                      </button>
                      {allFormsAvailable && (
                        <button
                          type="button"
                          onClick={() => onDexModeChange("all")}
                          aria-pressed={dexMode === "all"}
                          className="min-h-[44px] rounded-lg px-2 py-2 text-[0.78rem] font-semibold uppercase tracking-[0.06em]"
                          style={{
                            background: dexMode === "all" ? "var(--accent-soft)" : "transparent",
                            color: dexMode === "all" ? "var(--text-primary)" : "var(--text-muted)",
                            border: dexMode === "all" ? "1px solid rgba(218, 44, 67, 0.34)" : "1px solid transparent",
                          }}
                        >
                          All Forms
                        </button>
                      )}
                    </div>
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
                              <PokemonTypeButton
                                key={type}
                                pokemonType={type}
                                size="sm"
                                pressed={isActive}
                                onClick={() => {
                                  if (isActive) {
                                    onTypeFilterChange(activeTypeFilters.filter((entry) => entry !== type));
                                    return;
                                  }
                                  onTypeFilterChange([...activeTypeFilters, type]);
                                }}
                                className={`sm:text-[0.74rem] ${isActive ? "" : "hover:opacity-90"}`}
                                style={{
                                  opacity: isActive ? 1 : 0.68,
                                }}
                              />
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
        className="max-h-[60dvh] overflow-y-auto pr-1 custom-scrollbar sm:max-h-[calc(100dvh-330px)]"
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
                className={`pokemon-card-row ${isFilterTransitioning ? "animate-filter-row" : ""}`}
                style={{
                  position: "absolute",
                  top,
                  left: 0,
                  right: 0,
                  display: "grid",
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  columnGap: GRID_GAP_PX,
                  overflow: "visible",
                  animationDelay: isFilterTransitioning ? `${Math.min(visibleRowIndex * 28, 220)}ms` : undefined,
                }}
              >
                {items.map((pokemon: Pokemon, itemIndex: number) => {
                  const isSelected = isCompareMode && compareList.some((p) => p.id === pokemon.id);
                  return (
                    <div
                      key={pokemon.id}
                      role="listitem"
                      className="pokemon-list-item"
                      style={{ position: "relative" }}
                    >
                      {isCompareMode && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleCompare(pokemon); }}
                          className="absolute inset-0 z-10 cursor-pointer rounded-xl transition-all"
                          style={{
                            background: isSelected ? "rgba(218,44,67,0.12)" : "transparent",
                            border: isSelected ? "2px solid var(--accent)" : "2px solid transparent",
                            borderRadius: "inherit",
                          }}
                          aria-label={isSelected ? `Deselect ${pokemon.name}` : `Select ${pokemon.name} to compare`}
                        >
                          {isSelected && (
                            <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full text-[0.6rem] font-bold text-white" style={{ background: "var(--accent)" }}>
                              {compareList.findIndex((p) => p.id === pokemon.id) + 1}
                            </span>
                          )}
                        </button>
                      )}
                      <PokemonCard
                        pokemon={pokemon}
                        dragId={`available-${pokemon.id}`}
                        onTap={isCompareMode ? undefined : onAddPokemon}
                        canAddToTeam={!isCompareMode && currentTeamLength < 6}
                        versionLabelMap={versionLabelMap}
                        dragEnabled={!isCompareMode && dragEnabled}
                        onInspect={isCompareMode ? undefined : onInspect}
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
      {/* Compare panel */}
      {isCompareMode && compareList.length >= 2 && (
        <div className="compare-panel">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm" style={{ color: "var(--text-primary)" }}>
              Comparing {compareList.length} Pokémon
            </h3>
            <button type="button" onClick={exitCompareMode} className="text-[0.68rem] font-semibold cursor-pointer" style={{ color: "var(--text-muted)" }}>
              Done
            </button>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: `80px repeat(${compareList.length}, 1fr)` }}>
            {/* Header row */}
            <div />
            {compareList.map((p) => (
              <div key={p.id} className="text-center">
                <Image
                  src={pokemonSpriteSrc(p.sprite, p.id)}
                  alt={p.name}
                  width={40}
                  height={40}
                  unoptimized
                  className="mx-auto h-10 w-10 object-contain drop-shadow-md"
                />
                <p className="mt-0.5 text-[0.68rem] font-semibold" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                <div className="mt-0.5 flex justify-center gap-0.5">
                  {p.types.map((type: string) => (
                    <PokemonTypeBadge key={type} pokemonType={type} size="xs">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </PokemonTypeBadge>
                  ))}
                </div>
              </div>
            ))}
            {/* Stat rows */}
            {([
              { key: "hp", label: "HP", color: "#136f3a" },
              { key: "attack", label: "ATK", color: "#b4232c" },
              { key: "defense", label: "DEF", color: "#1d5fa4" },
              { key: "specialAttack", label: "SPA", color: "#7c3aed" },
              { key: "specialDefense", label: "SPD", color: "#d97706" },
              { key: "speed", label: "SPE", color: "#0891b2" },
            ] as const).map((stat) => {
              const vals = compareList.map((p) => p[stat.key]);
              const maxVal = Math.max(...vals);
              return (
                <div key={stat.key} className="contents">
                  <span className="self-center text-[0.6rem] font-bold uppercase" style={{ color: stat.color }}>{stat.label}</span>
                  {compareList.map((p) => {
                    const v = p[stat.key];
                    const isBest = v === maxVal && vals.filter((x) => x === maxVal).length === 1;
                    return (
                      <div key={p.id} className="flex items-center gap-1.5">
                        <div className="flex-1 h-[5px] rounded-full" style={{ background: "var(--surface-1)" }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min((v / 160) * 100, 100)}%`, background: stat.color, opacity: isBest ? 1 : 0.5 }} />
                        </div>
                        <span
                          className="w-[24px] text-right font-mono text-[0.62rem] font-semibold tabular-nums"
                          style={{ color: isBest ? stat.color : "var(--text-muted)" }}
                        >{v}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {/* BST row */}
            <div className="contents">
              <span className="self-center text-[0.6rem] font-bold uppercase" style={{ color: "var(--text-secondary)" }}>BST</span>
              {compareList.map((p) => {
                const bst = p.hp + p.attack + p.defense + p.specialAttack + p.specialDefense + p.speed;
                const bsts = compareList.map((pp) => pp.hp + pp.attack + pp.defense + pp.specialAttack + pp.specialDefense + pp.speed);
                const isBest = bst === Math.max(...bsts) && bsts.filter((b) => b === bst).length === 1;
                return (
                  <span
                    key={p.id}
                    className="text-center font-mono text-[0.72rem] font-bold tabular-nums"
                    style={{ color: isBest ? "var(--accent)" : "var(--text-secondary)" }}
                  >{bst}</span>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {isCompareMode && compareList.length < 2 && (
        <div className="compare-hint">
          Select {2 - compareList.length} more Pokémon to compare
        </div>
      )}
    </section>
  );
};

export default PokemonSelection;
