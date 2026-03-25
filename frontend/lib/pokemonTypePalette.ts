export const TYPE_HEX: Record<string, string> = {
  normal: "#a8a878",
  fire: "#f08030",
  water: "#6890f0",
  electric: "#f8d030",
  grass: "#78c850",
  ice: "#98d8d8",
  fighting: "#c03028",
  poison: "#a040a0",
  ground: "#e0c068",
  flying: "#a890f0",
  psychic: "#f85888",
  bug: "#a8b820",
  rock: "#b8a038",
  ghost: "#705898",
  dragon: "#7038f8",
  dark: "#705848",
  steel: "#b8b8d0",
  fairy: "#ee99ac",
};

export const TYPE_LIGHT_HEX: Record<string, string> = {
  bug: "#a8b820",
  dark: "#705848",
  dragon: "#6f58f6",
  electric: "#f8c320",
  fairy: "#ee99f4",
  fighting: "#c03028",
  fire: "#f05018",
  flying: "#8096f8",
  ghost: "#6060b0",
  grass: "#68c830",
  ground: "#d8b858",
  ice: "#98e8ff",
  normal: "#d8d8d8",
  poison: "#a040a0",
  psychic: "#f85888",
  rock: "#c8a048",
  steel: "#b8b8c8",
  water: "#3898f8",
};

export function formatPokemonType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function getPokemonTypePalette(type: string) {
  const darkTint = TYPE_HEX[type] ?? "var(--surface-3)";
  const lightTint = TYPE_LIGHT_HEX[type] ?? darkTint;

  return {
    darkTint,
    lightTint,
    label: formatPokemonType(type),
  };
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;

  const value = Number.parseInt(expanded, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixHex(baseHex: string, targetHex: string, baseWeight: number) {
  const base = hexToRgb(baseHex);
  const target = hexToRgb(targetHex);
  const targetWeight = 1 - baseWeight;

  const toHex = (value: number) => Math.round(value).toString(16).padStart(2, "0");

  const r = base.r * baseWeight + target.r * targetWeight;
  const g = base.g * baseWeight + target.g * targetWeight;
  const b = base.b * baseWeight + target.b * targetWeight;

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getPokemonTypeBadgeFallbacks(type: string) {
  const { darkTint, lightTint } = getPokemonTypePalette(type);

  return {
    darkBackground: rgba(darkTint, 0.2),
    darkBorder: rgba(darkTint, 0.42),
    darkText: mixHex(darkTint, "#f5efe6", 0.84),
    lightBackground: rgba(lightTint, 0.16),
    lightBorder: rgba(lightTint, 0.46),
    lightText: mixHex(lightTint, "#241b13", 0.46),
  };
}
