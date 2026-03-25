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

export type AvatarFrameKey =
  | "classic"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "psychic"
  | "dragon";

export const AVATAR_PRESETS = [
  { id: "trainer-red", label: "Red", url: "/avatars/trainer-red.svg" },
  { id: "trainer-blue", label: "Blue", url: "/avatars/trainer-blue.svg" },
  { id: "trainer-green", label: "Green", url: "/avatars/trainer-green.svg" },
  { id: "trainer-gold", label: "Gold", url: "/avatars/trainer-gold.svg" },
  { id: "trainer-dawn", label: "Dawn", url: "/avatars/trainer-dawn.svg" },
  { id: "trainer-ace", label: "Ace", url: "/avatars/trainer-ace.svg" },
] as const;

export const AVATAR_FRAME_OPTIONS: Array<{ key: AvatarFrameKey; label: string }> = [
  { key: "classic", label: "Classic" },
  { key: "fire", label: "Fire" },
  { key: "water", label: "Water" },
  { key: "electric", label: "Electric" },
  { key: "grass", label: "Grass" },
  { key: "psychic", label: "Psychic" },
  { key: "dragon", label: "Dragon" },
];

const REGION_DECOR: Record<
  string,
  {
    emblem: string;
    accent: string;
    soft: string;
  }
> = {
  Kanto: { emblem: "◈", accent: "#dc2626", soft: "rgba(220, 38, 38, 0.14)" },
  Johto: { emblem: "◉", accent: "#b45309", soft: "rgba(180, 83, 9, 0.14)" },
  Hoenn: { emblem: "△", accent: "#0f766e", soft: "rgba(15, 118, 110, 0.14)" },
  Sinnoh: { emblem: "◆", accent: "#2563eb", soft: "rgba(37, 99, 235, 0.14)" },
  Unova: { emblem: "⬢", accent: "#7c3aed", soft: "rgba(124, 58, 237, 0.14)" },
  Kalos: { emblem: "✦", accent: "#be185d", soft: "rgba(190, 24, 93, 0.14)" },
  Alola: { emblem: "☼", accent: "#c2410c", soft: "rgba(194, 65, 12, 0.14)" },
  Galar: { emblem: "✶", accent: "#0369a1", soft: "rgba(3, 105, 161, 0.14)" },
  Paldea: { emblem: "✹", accent: "#be185d", soft: "rgba(190, 24, 93, 0.14)" },
};

const GAME_BY_ID = new Map(ALL_GAMES.map((game) => [game.id, game]));

export function getGameDecoration(gameId: number): {
  label: string;
  region: string;
  emblem: string;
  accent: string;
  soft: string;
} {
  const game = GAME_BY_ID.get(gameId);
  if (!game) {
    return {
      label: `Game ${gameId}`,
      region: "Unknown",
      emblem: "◌",
      accent: "#94a3b8",
      soft: "rgba(148, 163, 184, 0.16)",
    };
  }

  const decor = REGION_DECOR[game.region] ?? REGION_DECOR.Kanto;
  return {
    label: `Gen ${game.generation}: ${game.name}`,
    region: game.region,
    emblem: decor.emblem,
    accent: decor.accent,
    soft: decor.soft,
  };
}

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

export function toPublicProfilePath(username: string): string {
  return `/u/${username.trim().toLowerCase()}`;
}

export function getAvatarFrameStyles(frame: AvatarFrameKey): {
  border: string;
  glow: string;
  chipBg: string;
} {
  switch (frame) {
    case "fire":
      return {
        border: "#fb7185",
        glow: "0 0 0 2px rgba(244, 63, 94, 0.25), 0 0 26px rgba(251, 113, 133, 0.35)",
        chipBg: "rgba(251, 113, 133, 0.14)",
      };
    case "water":
      return {
        border: "#38bdf8",
        glow: "0 0 0 2px rgba(14, 165, 233, 0.24), 0 0 26px rgba(56, 189, 248, 0.34)",
        chipBg: "rgba(56, 189, 248, 0.14)",
      };
    case "electric":
      return {
        border: "#facc15",
        glow: "0 0 0 2px rgba(234, 179, 8, 0.25), 0 0 26px rgba(250, 204, 21, 0.34)",
        chipBg: "rgba(250, 204, 21, 0.16)",
      };
    case "grass":
      return {
        border: "#4ade80",
        glow: "0 0 0 2px rgba(34, 197, 94, 0.23), 0 0 26px rgba(74, 222, 128, 0.34)",
        chipBg: "rgba(74, 222, 128, 0.15)",
      };
    case "psychic":
      return {
        border: "#c084fc",
        glow: "0 0 0 2px rgba(168, 85, 247, 0.23), 0 0 26px rgba(192, 132, 252, 0.34)",
        chipBg: "rgba(192, 132, 252, 0.15)",
      };
    case "dragon":
      return {
        border: "#818cf8",
        glow: "0 0 0 2px rgba(99, 102, 241, 0.25), 0 0 26px rgba(129, 140, 248, 0.35)",
        chipBg: "rgba(129, 140, 248, 0.15)",
      };
    case "classic":
    default:
      return {
        border: "var(--border)",
        glow: "0 0 0 2px rgba(148, 163, 184, 0.16)",
        chipBg: "rgba(148, 163, 184, 0.12)",
      };
  }
}
