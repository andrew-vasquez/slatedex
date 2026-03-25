/**
 * Pokemon Type Effectiveness Constants
 *
 * This file contains static data about Pokemon types and their relationships.
 * Used for calculating type effectiveness in battles and team analysis.
 */

// Type effectiveness chart - shows what each type is weak to
export const TYPE_EFFECTIVENESS: Record<string, string[]> = {
  normal: ['fighting'],
  fire: ['water', 'ground', 'rock'],
  water: ['electric', 'grass'],
  electric: ['ground'],
  grass: ['fire', 'ice', 'poison', 'flying', 'bug'],
  ice: ['fire', 'fighting', 'rock', 'steel'],
  fighting: ['flying', 'psychic', 'fairy'],
  poison: ['ground', 'psychic'],
  ground: ['water', 'grass', 'ice'],
  flying: ['electric', 'ice', 'rock'],
  psychic: ['bug', 'ghost', 'dark'],
  bug: ['fire', 'flying', 'rock'],
  rock: ['water', 'grass', 'fighting', 'ground', 'steel'],
  ghost: ['ghost', 'dark'],
  dragon: ['ice', 'dragon', 'fairy'],
  dark: ['fighting', 'bug', 'fairy'],
  steel: ['fire', 'fighting', 'ground'],
  fairy: ['poison', 'steel']
};

// Type resistances - what each type resists
export const TYPE_RESISTANCES: Record<string, string[]> = {
  normal: [],
  fire: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
  water: ['fire', 'water', 'ice', 'steel'],
  electric: ['electric', 'flying', 'steel'],
  grass: ['water', 'electric', 'grass', 'ground'],
  ice: ['ice'],
  fighting: ['bug', 'rock', 'dark'],
  poison: ['grass', 'fighting', 'poison', 'bug', 'fairy'],
  ground: ['poison', 'rock'],
  flying: ['grass', 'fighting', 'bug'],
  psychic: ['fighting', 'psychic'],
  bug: ['grass', 'fighting', 'ground'],
  rock: ['normal', 'fire', 'poison', 'flying'],
  ghost: ['poison', 'bug'],
  dragon: ['fire', 'water', 'electric', 'grass'],
  dark: ['ghost', 'dark'],
  steel: ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'],
  fairy: ['fighting', 'bug', 'dark']
};

// Type immunities - what each type is immune to
export const TYPE_IMMUNITIES: Record<string, string[]> = {
  normal: ['ghost'],
  fire: [],
  water: [],
  electric: [],
  grass: [],
  ice: [],
  fighting: [],
  poison: [],
  ground: ['electric'],
  flying: ['ground'],
  psychic: [],
  bug: [],
  rock: [],
  ghost: ['normal', 'fighting'],
  dragon: [],
  dark: ['psychic'],
  steel: ['poison'],
  fairy: ['dragon']
};

// All Pokemon types for iteration
export const ALL_TYPES: string[] = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

// Generation in which each type was introduced
export const TYPE_INTRO_GENERATION: Record<string, number> = {
  normal: 1, fire: 1, water: 1, electric: 1, grass: 1, ice: 1,
  fighting: 1, poison: 1, ground: 1, flying: 1, psychic: 1, bug: 1,
  rock: 1, ghost: 1, dragon: 1,
  dark: 2, steel: 2,
  fairy: 6,
};

export function getAvailableTypes(generation: number): string[] {
  return ALL_TYPES.filter(type => TYPE_INTRO_GENERATION[type] <= generation);
}

export function getLockedTypes(generation: number): string[] {
  return ALL_TYPES.filter(type => TYPE_INTRO_GENERATION[type] > generation);
}

// Type colors for UI components (Tailwind classes)
export const TYPE_COLORS: Record<string, string> = {
  normal: 'bg-stone-400',
  fire: 'bg-red-500',
  water: 'bg-blue-500',
  electric: 'bg-yellow-400',
  grass: 'bg-green-500',
  ice: 'bg-cyan-300 text-gray-800',
  fighting: 'bg-red-700',
  poison: 'bg-purple-500',
  ground: 'bg-yellow-600',
  flying: 'bg-sky-400',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-500',
  rock: 'bg-yellow-700',
  ghost: 'bg-indigo-600',
  dragon: 'bg-purple-600',
  dark: 'bg-gray-700',
  steel: 'bg-slate-500',
  fairy: 'bg-rose-400'
};

// ── Version-specific color theming ──────────────────────────────────────────

export interface VersionColorTheme {
  color: string;
  soft: string;
  border: string;
}

const FALLBACK_VERSION_COLOR: VersionColorTheme = {
  color: "#da2c43",
  soft: "rgba(218, 44, 67, 0.12)",
  border: "rgba(218, 44, 67, 0.34)",
};

function vc(hex: string): VersionColorTheme {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return {
    color: hex,
    soft: `rgba(${r}, ${g}, ${b}, 0.12)`,
    border: `rgba(${r}, ${g}, ${b}, 0.34)`,
  };
}

export const VERSION_COLORS: Record<string, VersionColorTheme> = {
  // Gen 1
  red: vc("#DC2626"),
  blue: vc("#2563EB"),
  yellow: vc("#EAB308"),
  // Gen 2
  gold: vc("#D4A017"),
  silver: vc("#94A3B8"),
  crystal: vc("#22D3EE"),
  // Gen 3
  ruby: vc("#DC2626"),
  sapphire: vc("#2563EB"),
  emerald: vc("#10B981"),
  firered: vc("#F97316"),
  leafgreen: vc("#22C55E"),
  // Gen 4
  diamond: vc("#7DD3FC"),
  pearl: vc("#F9A8D4"),
  platinum: vc("#94A3B8"),
  heartgold: vc("#D4A017"),
  soulsilver: vc("#94A3B8"),
  // Gen 5
  black: vc("#6B7280"),
  white: vc("#E5E7EB"),
  // Gen 6
  x: vc("#3B82F6"),
  y: vc("#EF4444"),
  "omega-ruby": vc("#DC2626"),
  "alpha-sapphire": vc("#2563EB"),
  // Gen 7
  sun: vc("#F59E0B"),
  moon: vc("#6366F1"),
  "ultra-sun": vc("#F97316"),
  "ultra-moon": vc("#7C3AED"),
  "lets-go-pikachu": vc("#EAB308"),
  "lets-go-eevee": vc("#92400E"),
  // Gen 8
  sword: vc("#3B82F6"),
  shield: vc("#DC2626"),
  // Gen 9
  scarlet: vc("#DC2626"),
  violet: vc("#7C3AED"),
};

export function getVersionColor(versionId: string): VersionColorTheme {
  return VERSION_COLORS[versionId] ?? FALLBACK_VERSION_COLOR;
}
