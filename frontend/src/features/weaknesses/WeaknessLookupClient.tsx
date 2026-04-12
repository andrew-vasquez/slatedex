import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { FiChevronUp, FiSearch, FiX } from "react-icons/fi";
import MatchupBucketCard from "@/components/ui/MatchupBucketCard";
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
const CARD_DENSITY_KEY = "slatedex:weaknesses:compact-cards";
const GENERATIONS = Array.from({ length: 9 }, (_, index) => index + 1);
const SPRITE_GRID_GAP = 12;
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

export default function WeaknessLookupClient({ pokemon }: WeaknessLookupClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [generationFilter, setGenerationFilter] = useState<number | "all">("all");
  const [compactCards, setCompactCards] = useState(false);
  const [selectedPokemonId, setSelectedPokemonId] = useState<number>(pokemon[0]?.id ?? 1);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [gridColumns, setGridColumns] = useState(1);
  const [windowRange, setWindowRange] = useState({ startRow: 0, endRow: 10 });
  const [isGridWindowPending, setIsGridWindowPending] = useState(true);
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
      setCompactCards(window.localStorage.getItem(CARD_DENSITY_KEY) === "true");
    } catch {
      setCompactCards(false);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(LAST_SELECTED_KEY, String(selectedPokemonId));
    } catch {
      // Ignore client storage access failures.
    }
  }, [selectedPokemonId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CARD_DENSITY_KEY, compactCards ? "true" : "false");
    } catch {
      // Ignore client storage access failures.
    }
  }, [compactCards]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mobileQuery = window.matchMedia("(max-width: 819px)");
    const syncViewport = () => setIsMobileViewport(mobileQuery.matches);

    syncViewport();
    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", syncViewport);
      return () => mobileQuery.removeEventListener("change", syncViewport);
    }

    mobileQuery.addListener(syncViewport);
    return () => mobileQuery.removeListener(syncViewport);
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

      const minWidth = compactCards ? 84 : 102;
      const nextColumns = Math.max(1, Math.floor((width + SPRITE_GRID_GAP) / (minWidth + SPRITE_GRID_GAP)));
      setGridColumns((current) => (current === nextColumns ? current : nextColumns));
    };

    updateColumns();

    const observer = new ResizeObserver(() => updateColumns());
    observer.observe(node);
    return () => observer.disconnect();
  }, [compactCards]);

  const searchablePokemon = useMemo(
    () =>
      pokemon.map((entry) => {
        const formattedName = formatPokemonName(entry.name);
        return {
          entry,
          formattedName,
          nameLower: entry.name.toLowerCase(),
          formattedNameLower: formattedName.toLowerCase(),
          typeSearch: entry.types.join(" ").toLowerCase(),
          dexSearch: String(entry.id),
        };
      }),
    [pokemon]
  );

  const filteredPokemon = useMemo(() => {
    const normalizedQuery = deferredSearchTerm.trim().toLowerCase();

    const filteredEntries = searchablePokemon.filter(({ entry }) =>
      generationFilter === "all" || entry.generation === generationFilter
    );

    if (!normalizedQuery) {
      return filteredEntries.map(({ entry }) => entry);
    }

    return filteredEntries
      .map((item) => {
        let score = Number.POSITIVE_INFINITY;
        if (item.dexSearch === normalizedQuery) score = 0;
        else if (item.nameLower === normalizedQuery || item.formattedNameLower === normalizedQuery) score = 1;
        else if (item.nameLower.startsWith(normalizedQuery) || item.formattedNameLower.startsWith(normalizedQuery)) score = 2;
        else if (item.typeSearch.includes(normalizedQuery)) score = 3;
        else if (item.nameLower.includes(normalizedQuery) || item.formattedNameLower.includes(normalizedQuery)) score = 4;

        return { item, score };
      })
      .filter((candidate) => Number.isFinite(candidate.score))
      .sort((a, b) => a.score - b.score || a.item.entry.id - b.item.entry.id)
      .map(({ item }) => item.entry);
  }, [deferredSearchTerm, generationFilter, searchablePokemon]);

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

  const rowHeight = isMobileViewport
    ? compactCards ? 126 : 148
    : compactCards ? 132 : 164;
  const totalRows = Math.ceil(filteredPokemon.length / Math.max(1, gridColumns));

  useEffect(() => {
    const updateWindowRange = () => {
      const node = gridRef.current;
      if (!node) return;

      const overscan = rowHeight * GRID_OVERSCAN_ROWS;
      const totalHeight = totalRows * rowHeight;
      const usesInternalScroll = node.scrollHeight > node.clientHeight + 1;
      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const visibleTop = usesInternalScroll
        ? Math.max(0, node.scrollTop - overscan)
        : Math.max(0, -rect.top - overscan);
      const visibleBottom = usesInternalScroll
        ? Math.max(0, Math.min(totalHeight, node.scrollTop + node.clientHeight + overscan))
        : Math.max(0, Math.min(totalHeight, viewportHeight - rect.top + overscan));
      const nextStartRow = Math.max(0, Math.floor(visibleTop / rowHeight));
      const nextEndRow = Math.max(nextStartRow + 1, Math.min(totalRows, Math.ceil(visibleBottom / rowHeight)));

      setWindowRange((current) =>
        current.startRow === nextStartRow && current.endRow === nextEndRow
          ? current
          : { startRow: nextStartRow, endRow: nextEndRow }
      );
      setIsGridWindowPending(false);
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
    const node = gridRef.current;
    node?.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    return () => {
      node?.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [filteredPokemon.length, gridColumns, rowHeight, totalRows]);

  useEffect(() => {
    setIsGridWindowPending(true);
    setWindowRange((current) => {
      const nextEndRow = Math.min(totalRows, Math.max(1, current.endRow));
      return { startRow: 0, endRow: nextEndRow || 1 };
    });
  }, [compactCards, deferredSearchTerm, generationFilter, totalRows]);

  const startIndex = windowRange.startRow * Math.max(1, gridColumns);
  const endIndex = Math.min(filteredPokemon.length, windowRange.endRow * Math.max(1, gridColumns));
  const visiblePokemon = filteredPokemon.slice(startIndex, endIndex);
  const topSpacerHeight = windowRange.startRow * rowHeight;
  const bottomSpacerHeight = Math.max(0, (totalRows - windowRange.endRow) * rowHeight);
  const eagerSpriteCount = Math.max(gridColumns * 2, 12);
  const skeletonTileCount = Math.max(gridColumns * 3, 12);

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
        <MatchupBucketCard title="Quad weaknesses" multiplier="4x" items={matchup.buckets.quadWeak} tone="danger" />
        <MatchupBucketCard title="Weaknesses" multiplier="2x" items={matchup.buckets.weak} tone="danger" />
        <MatchupBucketCard title="Resists" multiplier="0.5x" items={matchup.buckets.resist} tone="success" />
        <MatchupBucketCard title="Strong resists" multiplier="0.25x" items={matchup.buckets.strongResist} tone="success" />
        <MatchupBucketCard title="Immunities" multiplier="0x" items={matchup.buckets.immune} tone="neutral" />
        <MatchupBucketCard
          title="Neutral hits"
          multiplier="1x"
          items={matchup.buckets.neutral}
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
              Sprite-first browsing, instant search, and a pinned defensive chart make it easy to check 4x weaknesses,
              2x weaknesses, resists, and immunities at a glance.
            </p>
          </div>
          <div className="weakness-summary-badges">
            <span className="weakness-summary-chip">{pokemon.length} Pokemon indexed</span>
            <span className="weakness-summary-chip">4x, 2x, resist, and immunity breakdowns</span>
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
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="search"
                inputMode="search"
              />
              {searchTerm ? (
                <button
                  type="button"
                  className="weakness-search-clear"
                  onClick={() => {
                    startTransition(() => {
                      setSearchTerm("");
                    });
                  }}
                  aria-label="Clear search"
                >
                  <FiX size={15} aria-hidden="true" />
                </button>
              ) : null}
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

            <div className="weakness-toolbar-actions">
              <span className="weakness-display-label">Card size</span>
              <div className="weakness-display-toggle" role="tablist" aria-label="Choose weakness browser card size">
                <button
                  type="button"
                  className="weakness-filter-chip"
                  data-active={!compactCards}
                  onClick={() => setCompactCards(false)}
                  aria-pressed={!compactCards}
                >
                  Comfortable
                </button>
                <button
                  type="button"
                  className="weakness-filter-chip"
                  data-active={compactCards}
                  onClick={() => setCompactCards(true)}
                  aria-pressed={compactCards}
                >
                  Compact
                </button>
              </div>
            </div>

          </div>

          {filteredPokemon.length > 0 ? (
            <>
              <div
                ref={gridRef}
                className="weakness-sprite-grid"
                data-compact={compactCards}
                role="list"
                aria-label="Pokemon sprite browser"
              >
                {isGridWindowPending ? (
                  Array.from({ length: skeletonTileCount }, (_, index) => (
                    <div key={`weakness-skeleton-${index}`} className="weakness-skeleton-tile" aria-hidden="true">
                      <div className="weakness-skeleton-sprite" />
                      <div className="weakness-skeleton-line weakness-skeleton-line--tile" />
                      <div className="weakness-skeleton-line weakness-skeleton-line--tiny" />
                    </div>
                  ))
                ) : (
                  <>
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
                          data-compact={compactCards}
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
                              size={compactCards ? 56 : 72}
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
                  </>
                )}
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
