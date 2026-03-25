"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { FiChevronUp, FiSearch } from "react-icons/fi";
import { PokemonTypeBadge } from "@/components/ui/PokemonTypeBadge";
import { getDefensiveMatchups } from "@/lib/type-matchups";
import { pokemonSpriteSrc } from "@/lib/image";

interface WeaknessLookupPokemon {
  id: number;
  name: string;
  generation: number;
  sprite: string;
  types: string[];
}

interface WeaknessLookupClientProps {
  pokemon: WeaknessLookupPokemon[];
}

const LAST_SELECTED_KEY = "slatedex:weaknesses:last-selected";
const MOBILE_SHEET_SEEN_KEY = "slatedex:weaknesses:mobile-sheet-seen";
const GENERATIONS = Array.from({ length: 9 }, (_, index) => index + 1);
const SPRITE_CARD_MIN_WIDTH = 102;
const SPRITE_GRID_GAP = 12;
const SPRITE_CARD_HEIGHT_DESKTOP = 164;
const SPRITE_CARD_HEIGHT_MOBILE = 148;
const GRID_OVERSCAN_ROWS = 4;

const loadedSpriteSrcs = new Set<string>();

function formatPokemonName(name: string): string {
  return name
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function PokemonSprite({
  src,
  alt,
  size,
  eager = false,
}: {
  src: string;
  alt: string;
  size: number;
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(() => loadedSpriteSrcs.has(src));

  useEffect(() => {
    setLoaded(loadedSpriteSrcs.has(src));
  }, [src]);

  return (
    <div
      className={`weakness-sprite-media ${loaded ? "is-loaded" : ""}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : "low"}
        className="weakness-sprite-image pixelated"
        onLoad={() => {
          loadedSpriteSrcs.add(src);
          setLoaded(true);
        }}
      />
    </div>
  );
}

function MatchupBucket({
  title,
  multiplier,
  types,
  tone,
  compactSummary,
}: {
  title: string;
  multiplier: string;
  types: string[];
  tone: "danger" | "success" | "neutral";
  compactSummary?: string;
}) {
  return (
    <section className="weakness-bucket panel-soft">
      <div className="weakness-bucket-header">
        <div className="min-w-0">
          <p className="weakness-bucket-label">{title}</p>
          <h3 className="weakness-bucket-value">{multiplier}</h3>
        </div>
        <span className={`weakness-bucket-count weakness-bucket-count--${tone}`}>{types.length}</span>
      </div>
      {compactSummary ? (
        <p className="weakness-bucket-summary">{compactSummary}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {types.length > 0 ? (
            types.map((type) => <PokemonTypeBadge key={`${title}-${type}`} pokemonType={type} size="md" />)
          ) : (
            <span className="weakness-empty-chip">None</span>
          )}
        </div>
      )}
    </section>
  );
}

export default function WeaknessLookupClient({ pokemon }: WeaknessLookupClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [generationFilter, setGenerationFilter] = useState<number | "all">("all");
  const [selectedPokemonId, setSelectedPokemonId] = useState<number>(pokemon[0]?.id ?? 1);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [gridColumns, setGridColumns] = useState(1);
  const [windowRange, setWindowRange] = useState({ startRow: 0, endRow: 10 });
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const pokemonById = useMemo(
    () => new Map(pokemon.map((entry) => [entry.id, entry])),
    [pokemon]
  );

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(LAST_SELECTED_KEY);
      const parsed = storedValue ? Number.parseInt(storedValue, 10) : Number.NaN;
      if (Number.isInteger(parsed) && pokemonById.has(parsed)) {
        setSelectedPokemonId(parsed);
      }
    } catch {
      // Ignore client storage access failures.
    }
  }, [pokemonById]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LAST_SELECTED_KEY, String(selectedPokemonId));
    } catch {
      // Ignore client storage access failures.
    }
  }, [selectedPokemonId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 819px)");
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);

    syncViewport();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewport);
      return () => mediaQuery.removeEventListener("change", syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  useEffect(() => {
    if (!isMobileViewport) return;

    try {
      const alreadySeen = window.localStorage.getItem(MOBILE_SHEET_SEEN_KEY) === "true";
      if (!alreadySeen) {
        setIsMobileSheetOpen(true);
        window.localStorage.setItem(MOBILE_SHEET_SEEN_KEY, "true");
      }
    } catch {
      setIsMobileSheetOpen(true);
    }
  }, [isMobileViewport]);

  useEffect(() => {
    const node = gridRef.current;
    if (!node) return;

    const updateColumns = () => {
      const width = node.clientWidth;
      if (!width) return;

      const nextColumns = Math.max(1, Math.floor((width + SPRITE_GRID_GAP) / (SPRITE_CARD_MIN_WIDTH + SPRITE_GRID_GAP)));
      setGridColumns((current) => (current === nextColumns ? current : nextColumns));
    };

    updateColumns();

    const observer = new ResizeObserver(() => updateColumns());
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const filteredPokemon = useMemo(() => {
    const normalizedQuery = deferredSearchTerm.trim().toLowerCase();

    return pokemon.filter((entry) => {
      if (generationFilter !== "all" && entry.generation !== generationFilter) {
        return false;
      }

      if (!normalizedQuery) return true;

      const searchableTypes = entry.types.join(" ");
      return (
        entry.name.toLowerCase().includes(normalizedQuery) ||
        formatPokemonName(entry.name).toLowerCase().includes(normalizedQuery) ||
        searchableTypes.includes(normalizedQuery) ||
        String(entry.id) === normalizedQuery
      );
    });
  }, [deferredSearchTerm, generationFilter, pokemon]);

  useEffect(() => {
    if (filteredPokemon.length === 0) return;
    const selectedVisible = filteredPokemon.some((entry) => entry.id === selectedPokemonId);
    if (!selectedVisible) {
      setSelectedPokemonId(filteredPokemon[0]!.id);
    }
  }, [filteredPokemon, selectedPokemonId]);

  const selectedPokemon =
    pokemonById.get(selectedPokemonId) ??
    filteredPokemon[0] ??
    pokemon[0] ??
    null;

  const matchup = useMemo(
    () => (selectedPokemon ? getDefensiveMatchups(selectedPokemon.types) : null),
    [selectedPokemon]
  );

  const summaryStats = selectedPokemon && matchup
    ? [
        { label: "Weak matchups", value: matchup.buckets.quadWeak.length + matchup.buckets.weak.length },
        { label: "Safe matchups", value: matchup.buckets.strongResist.length + matchup.buckets.resist.length + matchup.buckets.immune.length },
        { label: "Neutral", value: matchup.buckets.neutral.length },
      ]
    : [];

  useEffect(() => {
    if (!isMobileViewport) return;
    document.body.style.overflow = isMobileSheetOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSheetOpen, isMobileViewport]);

  const rowHeight = isMobileViewport ? SPRITE_CARD_HEIGHT_MOBILE : SPRITE_CARD_HEIGHT_DESKTOP;
  const totalRows = Math.ceil(filteredPokemon.length / Math.max(1, gridColumns));

  useEffect(() => {
    const updateWindowRange = () => {
      const node = gridRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const overscan = rowHeight * GRID_OVERSCAN_ROWS;
      const totalHeight = totalRows * rowHeight;
      const visibleTop = Math.max(0, -rect.top - overscan);
      const visibleBottom = Math.max(0, Math.min(totalHeight, viewportHeight - rect.top + overscan));
      const nextStartRow = Math.max(0, Math.floor(visibleTop / rowHeight));
      const nextEndRow = Math.max(nextStartRow + 1, Math.min(totalRows, Math.ceil(visibleBottom / rowHeight)));

      setWindowRange((current) =>
        current.startRow === nextStartRow && current.endRow === nextEndRow
          ? current
          : { startRow: nextStartRow, endRow: nextEndRow }
      );
    };

    let ticking = false;
    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        updateWindowRange();
      });
    };

    updateWindowRange();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [filteredPokemon.length, gridColumns, rowHeight, totalRows]);

  useEffect(() => {
    setWindowRange((current) => {
      const nextEndRow = Math.min(totalRows, Math.max(1, current.endRow));
      return { startRow: 0, endRow: nextEndRow || 1 };
    });
  }, [deferredSearchTerm, generationFilter, totalRows]);

  const startIndex = windowRange.startRow * Math.max(1, gridColumns);
  const endIndex = Math.min(filteredPokemon.length, windowRange.endRow * Math.max(1, gridColumns));
  const visiblePokemon = filteredPokemon.slice(startIndex, endIndex);
  const topSpacerHeight = windowRange.startRow * rowHeight;
  const bottomSpacerHeight = Math.max(0, (totalRows - windowRange.endRow) * rowHeight);
  const eagerSpriteCount = Math.max(gridColumns * 2, 12);

  const detailContent = selectedPokemon && matchup ? (
    <>
      <div className="weakness-detail-header">
        <div className="weakness-detail-sprite">
          <PokemonSprite
            src={pokemonSpriteSrc(selectedPokemon.sprite, selectedPokemon.id)}
            alt={formatPokemonName(selectedPokemon.name)}
            size={120}
            eager
          />
        </div>
        <div className="min-w-0">
          <p className="weakness-kicker">Selected Pokemon</p>
          <h2 className="font-display weakness-detail-name">{formatPokemonName(selectedPokemon.name)}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedPokemon.types.map((type) => (
              <PokemonTypeBadge key={`${selectedPokemon.id}-${type}`} pokemonType={type} size="md" />
            ))}
          </div>
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            National Dex #{selectedPokemon.id} · Generation {selectedPokemon.generation}
          </p>
        </div>
      </div>

      <div className="weakness-summary-grid">
        {summaryStats.map((item) => (
          <div key={item.label} className="panel-soft weakness-summary-card">
            <span className="weakness-summary-label">{item.label}</span>
            <strong className="weakness-summary-value">{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="weakness-bucket-grid">
        <MatchupBucket title="Quad weaknesses" multiplier="4x" types={matchup.buckets.quadWeak} tone="danger" />
        <MatchupBucket title="Weaknesses" multiplier="2x" types={matchup.buckets.weak} tone="danger" />
        <MatchupBucket title="Resists" multiplier="0.5x" types={matchup.buckets.resist} tone="success" />
        <MatchupBucket title="Strong resists" multiplier="0.25x" types={matchup.buckets.strongResist} tone="success" />
        <MatchupBucket title="Immunities" multiplier="0x" types={matchup.buckets.immune} tone="neutral" />
        <MatchupBucket
          title="Neutral hits"
          multiplier="1x"
          types={matchup.buckets.neutral}
          tone="neutral"
          compactSummary={`${matchup.buckets.neutral.length} attacking types deal regular damage.`}
        />
      </div>
    </>
  ) : (
    <div className="panel weakness-empty-state">
      <p className="font-display text-lg" style={{ color: "var(--text-primary)" }}>Choose a Pokemon to inspect.</p>
    </div>
  );

  return (
    <div className="weakness-tool-shell">
      <section className="panel weakness-tool-intro">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="weakness-kicker">Fast type reference</p>
            <h1 className="font-display weakness-page-title">Tap a Pokemon. See every weakness immediately.</h1>
            <p className="weakness-page-copy">
              This view is built for quick checks on phones, iPads, and desktop: sprite-first browsing, instant search,
              and a pinned defensive chart with separate 4x, 2x, resist, and immunity buckets.
            </p>
          </div>
          <div className="weakness-summary-badges">
            <span className="weakness-summary-chip">{pokemon.length} Pokemon indexed</span>
            <span className="weakness-summary-chip">Built for fast phone + iPad checks</span>
          </div>
        </div>
      </section>

      <div className="weakness-tool-layout">
        <section className="panel weakness-browser-panel">
          <div className="weakness-browser-toolbar">
            <label className="weakness-search-shell">
              <FiSearch size={18} aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  startTransition(() => {
                    setSearchTerm(nextValue);
                  });
                }}
                placeholder="Search Pokemon, type, or dex number"
                className="weakness-search-input"
                aria-label="Search Pokemon by name, type, or dex number"
              />
            </label>

            <div className="weakness-generation-row" role="tablist" aria-label="Filter Pokemon by generation">
              <button
                type="button"
                className="weakness-filter-chip"
                data-active={generationFilter === "all"}
                onClick={() => {
                  startTransition(() => {
                    setGenerationFilter("all");
                  });
                }}
              >
                All
              </button>
              {GENERATIONS.map((generation) => (
                <button
                  key={generation}
                  type="button"
                  className="weakness-filter-chip"
                  data-active={generationFilter === generation}
                  onClick={() => {
                    startTransition(() => {
                      setGenerationFilter(generation);
                    });
                  }}
                >
                  Gen {generation}
                </button>
              ))}
            </div>

            <div className="weakness-toolbar-meta">
              <span>{filteredPokemon.length} results</span>
              <span>
                {selectedPokemon ? `Selected: ${formatPokemonName(selectedPokemon.name)}` : "Pick a Pokemon"}
              </span>
            </div>
          </div>

          {filteredPokemon.length > 0 ? (
            <>
              <div ref={gridRef} className="weakness-sprite-grid" role="list" aria-label="Pokemon sprite browser">
                {topSpacerHeight > 0 ? (
                  <div
                    className="weakness-sprite-spacer"
                    style={{ height: `${topSpacerHeight}px` }}
                    aria-hidden="true"
                  />
                ) : null}
                {visiblePokemon.map((entry, index) => {
                  const isActive = entry.id === selectedPokemon?.id;
                  const absoluteIndex = startIndex + index;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      className="weakness-sprite-button"
                      data-active={isActive}
                      onClick={() => {
                        setSelectedPokemonId(entry.id);
                        if (isMobileViewport) {
                          setIsMobileSheetOpen(true);
                        }
                      }}
                      aria-pressed={isActive}
                      aria-label={`Inspect ${formatPokemonName(entry.name)} weaknesses`}
                    >
                    <div className="weakness-sprite-frame">
                        <PokemonSprite
                          src={pokemonSpriteSrc(entry.sprite, entry.id)}
                          alt=""
                          size={72}
                          eager={absoluteIndex < eagerSpriteCount}
                        />
                      </div>
                      <span className="weakness-sprite-name">{formatPokemonName(entry.name)}</span>
                      <span className="weakness-sprite-meta">#{entry.id} · Gen {entry.generation}</span>
                    </button>
                  );
                })}
                {bottomSpacerHeight > 0 ? (
                  <div
                    className="weakness-sprite-spacer"
                    style={{ height: `${bottomSpacerHeight}px` }}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            </>
          ) : (
            <div className="weakness-empty-state">
              <p className="font-display text-lg" style={{ color: "var(--text-primary)" }}>No Pokemon match that filter.</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Try a shorter search or switch back to all generations.</p>
            </div>
          )}
        </section>

        <aside className="weakness-detail-column">
          <div className="panel weakness-detail-panel">{detailContent}</div>
        </aside>
      </div>

      {selectedPokemon && matchup ? (
        <>
          <div
            className="weakness-mobile-sheet-backdrop"
            data-open={isMobileSheetOpen}
            onClick={() => setIsMobileSheetOpen(false)}
            aria-hidden="true"
          />
          <div
            className="weakness-mobile-sheet"
            data-open={isMobileSheetOpen}
            role="dialog"
            aria-modal={isMobileViewport && isMobileSheetOpen}
            aria-hidden={!isMobileViewport}
            aria-label="Pokemon weakness details"
          >
            <button
              type="button"
              className="weakness-mobile-sheet-bar"
              onClick={() => setIsMobileSheetOpen((current) => !current)}
              aria-expanded={isMobileSheetOpen}
              aria-label={isMobileSheetOpen ? "Collapse weakness details" : "Expand weakness details"}
            >
              <span className="weakness-mobile-sheet-pill" aria-hidden="true" />
              <div className="weakness-mobile-sheet-preview">
                <div className="weakness-mobile-sheet-preview-media">
                  <PokemonSprite
                    src={pokemonSpriteSrc(selectedPokemon.sprite, selectedPokemon.id)}
                    alt=""
                    size={40}
                    eager
                  />
                </div>
                <div className="min-w-0 text-left">
                  <p className="weakness-mobile-sheet-label">Weakness details</p>
                  <p className="weakness-mobile-sheet-name">{formatPokemonName(selectedPokemon.name)}</p>
                </div>
              </div>
              <div className="weakness-mobile-sheet-meta">
                <span className="weakness-mobile-sheet-count">{matchup.buckets.quadWeak.length + matchup.buckets.weak.length} weak</span>
                <span className="weakness-mobile-sheet-chevron" data-open={isMobileSheetOpen} aria-hidden="true">
                  <FiChevronUp size={16} />
                </span>
              </div>
            </button>

            <div className="weakness-mobile-sheet-content custom-scrollbar">{detailContent}</div>
          </div>
        </>
      ) : null}
    </div>
  );
}
