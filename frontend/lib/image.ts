export const FALLBACK_POKEMON_SPRITE = "/pokeball.svg";
const POKEMON_SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export function safeImageSrc(src: unknown): string | null {
  if (typeof src !== "string") return null;
  const trimmed = src.trim();
  if (!trimmed) return null;
  return trimmed;
}

function isFallbackSpritePath(src: string): boolean {
  const normalized = src.trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized === FALLBACK_POKEMON_SPRITE ||
    normalized.endsWith("/pokeball.svg")
  );
}

function normalizePokemonId(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) return null;
  return value;
}

export function pokemonSpriteFromId(id: unknown): string | null {
  const normalized = normalizePokemonId(id);
  if (!normalized) return null;
  return `${POKEMON_SPRITE_BASE}/${normalized}.png`;
}

export function pokemonSpriteSrc(src: unknown, pokemonId?: unknown): string {
  const normalizedSrc = safeImageSrc(src);
  if (normalizedSrc && !isFallbackSpritePath(normalizedSrc)) {
    return normalizedSrc;
  }

  return pokemonSpriteFromId(pokemonId) ?? FALLBACK_POKEMON_SPRITE;
}
