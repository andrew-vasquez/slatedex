import { ALL_GAMES } from "@/lib/pokemon";

export const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$/;
export const MAX_BIO_LENGTH = 240;
export const MAX_FAVORITE_GAMES = 3;
export const MAX_FAVORITE_POKEMON = 6;

export const GAME_OPTIONS = ALL_GAMES.map((game) => ({
  id: game.id,
  label: `Gen ${game.generation}: ${game.name}`,
}));

export const GAME_NAME_BY_ID = new Map<number, string>(
  ALL_GAMES.map((game) => [game.id, `Gen ${game.generation}: ${game.name}`])
);

export function formatPokemonList(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  ).slice(0, MAX_FAVORITE_POKEMON);
}

