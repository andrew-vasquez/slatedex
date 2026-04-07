import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { getClientSafeApiBaseUrl } from "@/lib/backend-url";

const MAX_SLOTS = 6;
const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

function getPokeProxyBaseUrl() {
  return `${getClientSafeApiBaseUrl()}/api`;
}

type PokemonEntry = { name: string; id: number };

let allPokemonCache: PokemonEntry[] | null = null;
let fetchInFlight: Promise<PokemonEntry[]> | null = null;

async function fetchAllPokemon(): Promise<PokemonEntry[]> {
  if (allPokemonCache) return allPokemonCache;
  if (fetchInFlight) return fetchInFlight;

  fetchInFlight = fetch(`${getPokeProxyBaseUrl()}/pokemon?limit=1302&offset=0`)
    .then((r) => r.json())
    .then((data: { results: Array<{ name: string; url: string }> }) => {
      const list: PokemonEntry[] = data.results
        .map(({ name, url }) => {
          const parts = url.split("/").filter(Boolean);
          const id = parseInt(parts[parts.length - 1], 10);
          return { name, id };
        })
        .filter(({ id }) => !isNaN(id) && id > 0);
      allPokemonCache = list;
      return list;
    })
    .catch(() => {
      fetchInFlight = null;
      return [];
    });

  return fetchInFlight;
}

function spriteUrl(id: number) {
  return `${SPRITE_BASE}/${id}.png`;
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function filterPokemon(list: PokemonEntry[], query: string): PokemonEntry[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, "-");
  if (!q) return [];
  return list
    .filter((p) => p.name.includes(q))
    .sort((a, b) => {
      const aStarts = a.name.startsWith(q);
      const bStarts = b.name.startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.id - b.id;
    })
    .slice(0, 10);
}

function SearchPanel({
  allPokemon,
  disabledNames,
  onSelect,
  onClose,
}: {
  allPokemon: PokemonEntry[];
  disabledNames: Set<string>;
  onSelect: (p: PokemonEntry) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => filterPokemon(allPokemon, query), [allPokemon, query]);

  return (
    <div
      className="rounded-2xl border p-3"
      style={{ borderColor: "var(--accent)", background: "rgba(218, 44, 67, 0.05)" }}
    >
      {/* Search input */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <FiSearch
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Pokémon…"
            className="w-full rounded-xl border py-1.5 pl-8 pr-3 text-sm outline-none"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-2)",
              color: "var(--text-primary)",
            }}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            onKeyDown={(e) => e.key === "Escape" && onClose()}
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1"
          style={{ color: "var(--text-muted)" }}
          aria-label="Close search"
        >
          <FiX size={14} />
        </button>
      </div>

      {/* Results */}
      {query.trim() && (
        <div className="mt-2 space-y-0.5">
          {results.length === 0 ? (
            <p className="py-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
              No Pokémon found for &ldquo;{query.trim()}&rdquo;
            </p>
          ) : (
            results.map((p) => {
              const disabled = disabledNames.has(p.name);
              return (
                <button
                  key={p.name}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && onSelect(p)}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1 text-left transition-colors"
                  style={{
                    background: disabled ? "transparent" : undefined,
                    opacity: disabled ? 0.4 : 1,
                    cursor: disabled ? "default" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled) (e.currentTarget as HTMLElement).style.background = "var(--surface-3)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <img
                    src={spriteUrl(p.id)}
                    alt={p.name}
                    className="h-9 w-9 shrink-0 object-contain"
                    style={{ imageRendering: "pixelated" }}
                    loading="lazy"
                  />
                  <span
                    className="text-sm font-medium capitalize"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {capitalize(p.name)}
                  </span>
                  {disabled && (
                    <span className="ml-auto text-[0.6rem] uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
                      Added
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      {!query.trim() && (
        <p className="mt-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Start typing to search all Pokémon
        </p>
      )}
    </div>
  );
}

export default function FavoritePokemonPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (names: string[]) => void;
}) {
  const [allPokemon, setAllPokemon] = useState<PokemonEntry[]>(allPokemonCache ?? []);
  const [searchingIndex, setSearchingIndex] = useState<number | null>(null);

  // Load full Pokémon list once
  useEffect(() => {
    if (allPokemonCache) {
      setAllPokemon(allPokemonCache);
      return;
    }
    fetchAllPokemon().then((list) => setAllPokemon(list));
  }, []);

  const resolvedMap = useMemo(() => {
    const map = new Map<string, PokemonEntry>();
    for (const entry of allPokemon) {
      map.set(entry.name, entry);
    }
    return map;
  }, [allPokemon]);

  const disabledNames = useMemo(() => new Set(value), [value]);

  const handleSelect = useCallback(
    (pokemon: PokemonEntry) => {
      const next = [...value];
      if (searchingIndex !== null && searchingIndex < value.length) {
        next.splice(searchingIndex, 1, pokemon.name);
      } else {
        if (!next.includes(pokemon.name)) next.push(pokemon.name);
      }
      onChange(next);
      setSearchingIndex(null);
    },
    [value, searchingIndex, onChange]
  );

  const handleRemove = useCallback(
    (name: string) => {
      onChange(value.filter((n) => n !== name));
      setSearchingIndex(null);
    },
    [value, onChange]
  );

  const openSearch = useCallback((index: number) => {
    setSearchingIndex(index);
  }, []);

  const slots = Array.from({ length: MAX_SLOTS }, (_, i) => value[i] ?? null);

  return (
    <div className="space-y-2">
      {/* Slot grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {slots.map((name, i) => {
          const resolved = name ? resolvedMap.get(name) : null;

          if (name) {
            return (
              <div
                key={i}
                className="group relative flex flex-col items-center justify-center rounded-2xl border py-2 transition-colors"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-2)",
                  minHeight: "82px",
                }}
              >
                {resolved ? (
                  <img
                    src={spriteUrl(resolved.id)}
                    alt={resolved.name}
                    className="h-12 w-12 object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                ) : (
                  /* Skeleton while list loads */
                  <div
                    className="h-12 w-12 animate-pulse rounded-full"
                    style={{ background: "var(--surface-3)" }}
                  />
                )}
                <p
                  className="mt-0.5 max-w-full truncate px-1 text-center text-[0.62rem] font-semibold capitalize"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {capitalize(name)}
                </p>

                {/* Swap / remove controls */}
                <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" style={{ background: "rgba(5,10,24,0.7)" }}>
                  <button
                    type="button"
                    onClick={() => openSearch(i)}
                    className="rounded-lg px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.08em] transition-colors"
                    style={{ background: "var(--surface-3)", color: "var(--text-primary)" }}
                    aria-label={`Change ${name}`}
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(name)}
                    className="rounded-lg p-1 transition-colors"
                    style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}
                    aria-label={`Remove ${name}`}
                  >
                    <FiX size={11} />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => openSearch(i)}
              className="flex flex-col items-center justify-center rounded-2xl border transition-colors"
              style={{
                borderColor: "var(--border)",
                borderStyle: "dashed",
                background: "transparent",
                color: "var(--text-muted)",
                minHeight: "82px",
                opacity: searchingIndex !== null && searchingIndex !== i ? 0.45 : 1,
              }}
              aria-label={`Add favorite Pokémon slot ${i + 1}`}
            >
              <span className="text-2xl" style={{ opacity: 0.28 }}>+</span>
              <span className="mt-0.5 text-[0.6rem] uppercase tracking-[0.1em]">Add</span>
            </button>
          );
        })}
      </div>

      {/* Inline search panel */}
      {searchingIndex !== null && (
        <SearchPanel
          allPokemon={allPokemon}
          disabledNames={disabledNames}
          onSelect={handleSelect}
          onClose={() => setSearchingIndex(null)}
        />
      )}

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {value.length}/{MAX_SLOTS} — hover a slot to change or remove it
      </p>
    </div>
  );
}
