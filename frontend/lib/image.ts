export const FALLBACK_POKEMON_SPRITE = "/pokeball.svg";
const POKEMON_SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const POKEMON_HOME_SPRITE_BASE = `${POKEMON_SPRITE_BASE}/other/home`;
const POKEMON_OFFICIAL_ARTWORK_BASE = `${POKEMON_SPRITE_BASE}/other/official-artwork`;

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

export function pokemonOfficialArtworkFromId(id: unknown): string | null {
  const normalized = normalizePokemonId(id);
  if (!normalized) return null;
  return `${POKEMON_OFFICIAL_ARTWORK_BASE}/${normalized}.png`;
}

export function pokemonHomeSpriteFromId(id: unknown): string | null {
  const normalized = normalizePokemonId(id);
  if (!normalized) return null;
  return `${POKEMON_HOME_SPRITE_BASE}/${normalized}.png`;
}

export function pokemonSpriteSrc(src: unknown, pokemonId?: unknown): string {
  const normalizedId = normalizePokemonId(pokemonId);
  const normalizedSrc = safeImageSrc(src);
  if (normalizedSrc && !isFallbackSpritePath(normalizedSrc)) {
    return normalizedSrc;
  }

  if (normalizedId && normalizedId < 10000) {
    return pokemonSpriteFromId(normalizedId) ?? FALLBACK_POKEMON_SPRITE;
  }

  if (normalizedId) {
    return pokemonHomeSpriteFromId(normalizedId) ?? pokemonOfficialArtworkFromId(normalizedId) ?? FALLBACK_POKEMON_SPRITE;
  }

  return FALLBACK_POKEMON_SPRITE;
}
