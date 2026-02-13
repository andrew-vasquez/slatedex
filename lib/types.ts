export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  generation: number;
  hp: number;
  attack: number;
  defense: number;
  sprite: string;
}

export interface PokemonWithEffectiveness extends Pokemon {
  effectiveness: number;
}

export interface Game {
  id: number;
  name: string;
  generation: number;
  region: string;
  starters: string[];
  legendaries: string[];
}

export interface TypeCoverage {
  weak: number;
  resist: number;
  weakPokemon: PokemonWithEffectiveness[];
  resistPokemon: PokemonWithEffectiveness[];
}

export type CoverageMap = Record<string, TypeCoverage>;
