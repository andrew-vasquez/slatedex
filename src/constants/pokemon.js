/**
 * Pokemon Type Effectiveness Constants
 * 
 * This file contains static data about Pokemon types and their relationships.
 * Used for calculating type effectiveness in battles and team analysis.
 */

// Type effectiveness chart - shows what each type is weak to
export const TYPE_EFFECTIVENESS = {
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

// Type effectiveness for offensive coverage - what each type is strong against
export const OFFENSIVE_TYPE_EFFECTIVENESS = {
  normal: [],
  fire: ['grass', 'ice', 'bug', 'steel'],
  water: ['fire', 'ground', 'rock'],
  electric: ['water', 'flying'],
  grass: ['water', 'ground', 'rock'],
  ice: ['grass', 'ground', 'flying', 'dragon'],
  fighting: ['normal', 'ice', 'rock', 'dark', 'steel'],
  poison: ['grass', 'fairy'],
  ground: ['fire', 'electric', 'poison', 'rock', 'steel'],
  flying: ['grass', 'fighting', 'bug'],
  psychic: ['fighting', 'poison'],
  bug: ['grass', 'psychic', 'dark'],
  rock: ['fire', 'ice', 'flying', 'bug'],
  ghost: ['psychic', 'ghost'],
  dragon: ['dragon'],
  dark: ['psychic', 'ghost'],
  steel: ['ice', 'rock', 'fairy'],
  fairy: ['fighting', 'dragon', 'dark']
};

// Type resistances - what each type resists
export const TYPE_RESISTANCES = {
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
export const ALL_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

// Type colors for UI components (Tailwind classes)
export const TYPE_COLORS = {
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

// Type colors for Pokemon cards (gradient classes)
export const POKEMON_TYPE_COLORS = {
  normal: 'from-stone-400 to-stone-500',
  fire: 'from-red-500 to-orange-500',
  water: 'from-blue-500 to-cyan-500',
  electric: 'from-yellow-400 to-yellow-500',
  grass: 'from-green-500 to-emerald-500',
  ice: 'from-cyan-300 to-blue-300',
  fighting: 'from-red-600 to-red-700',
  poison: 'from-purple-500 to-violet-500',
  ground: 'from-yellow-600 to-amber-600',
  flying: 'from-blue-400 to-sky-400',
  psychic: 'from-pink-500 to-purple-500',
  bug: 'from-green-400 to-lime-500',
  rock: 'from-yellow-700 to-amber-700',
  ghost: 'from-purple-600 to-indigo-600',
  dragon: 'from-purple-600 to-blue-600',
  dark: 'from-gray-700 to-gray-800',
  steel: 'from-gray-400 to-slate-500',
  fairy: 'from-pink-300 to-rose-400'
}; 