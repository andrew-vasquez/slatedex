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

// All Pokemon types for iteration
export const ALL_TYPES: string[] = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

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
