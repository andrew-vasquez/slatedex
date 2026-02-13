"use client";

import { FiSearch, FiX } from "react-icons/fi";
import { type UIEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import PokemonCard from "@/components/ui/PokemonCard";
import type { DexMode, Pokemon } from "@/lib/types";

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
}

const GRID_GAP_PX = 10;
const DEFAULT_ROW_HEIGHT = 190;
const OVERSCAN_ROWS = 4;

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
}: PokemonSelectionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const rowMeasureObserverRef = useRef<ResizeObserver | null>(null);
  const pendingScrollTopRef = useRef(0);
  const [columns, setColumns] = useState(1);
  const [rowHeight, setRowHeight] = useState(DEFAULT_ROW_HEIGHT);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  const versionLabelMap: Record<string, string> = useMemo(
    () => Object.fromEntries(versions.map((version) => [version.id, version.label])),
    [versions]
  );

  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
      if (rowMeasureObserverRef.current) {
        rowMeasureObserverRef.current.disconnect();
      }
    };
  }, []);

  const measureFirstItem = useCallback((node: HTMLDivElement | null) => {
    if (rowMeasureObserverRef.current) {
      rowMeasureObserverRef.current.disconnect();
      rowMeasureObserverRef.current = null;
    }

    if (!node) return;

    const syncHeight = () => {
      const next = Math.round(node.getBoundingClientRect().height);
      if (next <= 0) return;
      setRowHeight((prev) => (Math.abs(prev - next) >= 1 ? next : prev));
    };

    syncHeight();

    const observer = new ResizeObserver(syncHeight);
    observer.observe(node);
    rowMeasureObserverRef.current = observer;
  }, []);

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    pendingScrollTopRef.current = event.currentTarget.scrollTop;

    if (rafIdRef.current !== null) return;

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      setScrollTop(pendingScrollTopRef.current);
    });
  }, []);

  const rowCount = Math.ceil(filteredPokemon.length / columns);
  const rowStride = rowHeight + GRID_GAP_PX;
  const totalHeight = rowCount > 0 ? rowCount * rowHeight + (rowCount - 1) * GRID_GAP_PX : 0;
  const maxVisibleBottom = scrollTop + viewportHeight;
  const startRow = Math.max(0, Math.floor(scrollTop / rowStride) - OVERSCAN_ROWS);
  const endRow = Math.min(rowCount - 1, Math.ceil(maxVisibleBottom / rowStride) + OVERSCAN_ROWS);

  const visibleRows = useMemo(() => {
    if (rowCount === 0) return [];

    const rows: Array<{ row: number; startIndex: number; items: Pokemon[] }> = [];
    for (let row = startRow; row <= endRow; row += 1) {
      const startIndex = row * columns;
      rows.push({
        row,
        startIndex,
        items: filteredPokemon.slice(startIndex, startIndex + columns),
      });
    }
    return rows;
  }, [columns, endRow, filteredPokemon, rowCount, startRow]);

  return (
    <section className="panel p-4 sm:p-5" aria-labelledby="available-pokemon-heading">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <h2 id="available-pokemon-heading" className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
            Step 1: Pick Pokémon
          </h2>
          <span
            className="rounded-md px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            aria-label={`${filteredPokemon.length} Pokémon available`}
          >
            {filteredPokemon.length}
          </span>
        </div>

        <div className="w-full sm:w-[21.5rem]">
          <div className="mb-2 inline-flex w-full rounded-xl border p-1" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            <button
              type="button"
              onClick={() => onDexModeChange("regional")}
              disabled={!regionalAvailable}
              aria-pressed={dexMode === "regional"}
              className="flex-1 rounded-lg px-2 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] disabled:pointer-events-none disabled:opacity-45"
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
              className="flex-1 rounded-lg px-2 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em]"
              style={{
                background: dexMode === "national" ? "var(--accent-soft)" : "transparent",
                color: dexMode === "national" ? "var(--text-primary)" : "var(--text-muted)",
                border: dexMode === "national" ? "1px solid rgba(218, 44, 67, 0.34)" : "1px solid transparent",
              }}
            >
              National
            </button>
          </div>

          <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <label className="flex items-center gap-2 rounded-xl border px-2.5 py-2" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
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
              className="inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.08em] md:hover:cursor-pointer"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-muted)" }}
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
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-xl py-2 pl-8 pr-8 text-sm"
              style={{
                background: "var(--surface-2)",
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
        </div>
      </div>

      <p className="mb-2 text-[0.68rem]" style={{ color: "var(--text-muted)" }}>
        {dexMode === "regional"
          ? "Showing Regional Pokédex entries for this game."
          : `Showing National Pokédex up to Generation ${generation}.`}
      </p>

      <p className="mb-2 text-[0.68rem]" style={{ color: "var(--text-muted)" }}>
        Version view: <span className="font-semibold">{versionLabelMap[selectedVersionId] ?? selectedVersionId}</span>
        {versionFilterEnabled ? " (filter ON)" : " (showing all)"}
      </p>

      {dexNotice && (
        <p className="mb-2 text-[0.68rem]" style={{ color: "#fca5a5" }}>
          {dexNotice}
        </p>
      )}

      <p className="mb-3 text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
        {currentTeamLength < 6
          ? "Tap or drag a card to place it into your team slots."
          : "Your team is full. Remove a member to add another Pokémon."}
      </p>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar sm:max-h-[calc(100vh-360px)]"
        role="list"
        aria-label="Available Pokémon"
      >
        {filteredPokemon.length === 0 ? (
          <div
            className="rounded-xl px-4 py-6 text-center text-sm"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            No matching Pokémon found. Try a different name.
          </div>
        ) : !isHydrated ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {filteredPokemon.map((pokemon: Pokemon) => (
              <div key={pokemon.id} role="listitem" className="pokemon-list-item">
                <PokemonCard
                  pokemon={pokemon}
                  dragId={`available-${pokemon.id}`}
                  onTap={onAddPokemon}
                  canAddToTeam={currentTeamLength < 6}
                  versionLabelMap={versionLabelMap}
                  dragEnabled={dragEnabled}
                />
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{ position: "relative", height: totalHeight, width: "100%" }}
          >
            {visibleRows.map(({ row, startIndex, items }) => (
              <div
                key={`row-${row}`}
                style={{
                  position: "absolute",
                  top: row * rowStride,
                  left: 0,
                  right: 0,
                  display: "grid",
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  columnGap: GRID_GAP_PX,
                }}
              >
                {items.map((pokemon: Pokemon, offset: number) => {
                  const index = startIndex + offset;
                  return (
                    <div
                      key={pokemon.id}
                      ref={index === 0 ? measureFirstItem : undefined}
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
