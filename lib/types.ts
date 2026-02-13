export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  generation: number;
  isFinalEvolution: boolean;
  hp: number;
  attack: number;
  defense: number;
  sprite: string;
  // Internal metadata for version/exclusivity features.
  gameIndexVersionIds?: string[];
  exclusiveStatus?: "exclusive" | "shared" | "unknown";
  exclusiveToVersionIds?: string[] | null;
}

export type DexMode = "regional" | "national";

export interface PokemonPools {
  national: Pokemon[];
  regional: Pokemon[];
  regionalResolved: boolean;
  regionalDexName: string | null;
}

export interface PokemonWithEffectiveness extends Pokemon {
  effectiveness: number;
}

export interface Game {
  id: number;
  name: string;
  generation: number;
  region: string;
  versions: { id: string; label: string }[];
  versionGroupCandidates: string[];
  regionalDexCandidates: string[];
  starters: string[];
  legendaries: string[];
}

export interface TypeCoverage {
  weak: number;
  resist: number;
  weakPokemon: PokemonWithEffectiveness[];
  resistPokemon: PokemonWithEffectiveness[];
  locked?: boolean;
}

export type CoverageMap = Record<string, TypeCoverage>;

export interface GenerationMeta {
  generation: number;
  region: string;
  primaryName: string;
  games: Game[];
  starters: string[];
  legendaries: string[];
}
