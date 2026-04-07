import { useEffect, useState } from "react";

function getPokeProxyBaseUrl() {
  const raw = import.meta.env.VITE_POKEPROXY_URL?.trim();
  if (!raw) return "";
  return raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
}

type ResolvedPokemon = {
  name: string;
  sprite: string | null;
};

const spriteCache = new Map<string, ResolvedPokemon | null>();

async function resolvePokemon(name: string): Promise<ResolvedPokemon | null> {
  const key = name.toLowerCase().replace(/\s+/g, "-");
  if (spriteCache.has(key)) return spriteCache.get(key) ?? null;

  try {
    const res = await fetch(`${getPokeProxyBaseUrl()}/pokemon/${encodeURIComponent(key)}`);
    if (!res.ok) {
      spriteCache.set(key, null);
      return null;
    }
    const data = (await res.json()) as {
      name: string;
      sprites: { front_default: string | null };
    };
    const resolved: ResolvedPokemon = {
      name: data.name,
      sprite: data.sprites?.front_default ?? null,
    };
    spriteCache.set(key, resolved);
    return resolved;
  } catch {
    spriteCache.set(key, null);
    return null;
  }
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function FavoritePokemonDisplay({ names }: { names: string[] }) {
  const [resolved, setResolved] = useState<Map<string, ResolvedPokemon | null>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (names.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(names.map((name) => resolvePokemon(name))).then((results) => {
      if (cancelled) return;
      const map = new Map<string, ResolvedPokemon | null>();
      names.forEach((name, i) => map.set(name, results[i]));
      setResolved(map);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [names]);

  if (names.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        No favorite Pokémon listed.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {names.map((name) => {
        const data = resolved.get(name);
        const sprite = data?.sprite ?? null;

        return (
          <div
            key={name}
            className="flex items-center gap-1.5 rounded-2xl border pl-1.5 pr-3 py-1"
            style={{
              borderColor: "var(--border)",
              background: "color-mix(in srgb, var(--surface-3) 72%, var(--surface-2))",
            }}
          >
            {loading || !resolved.has(name) ? (
              <div
                className="h-8 w-8 animate-pulse rounded-full shrink-0"
                style={{ background: "var(--surface-3)" }}
              />
            ) : sprite ? (
              <img
                src={sprite}
                alt={name}
                className="h-8 w-8 object-contain shrink-0"
                style={{ imageRendering: "pixelated" }}
              />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[0.6rem] font-bold uppercase shrink-0"
                style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
              >
                {name.slice(0, 2)}
              </div>
            )}
            <span
              className="text-xs font-semibold capitalize"
              style={{ color: "var(--text-primary)" }}
            >
              {capitalize(name)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
