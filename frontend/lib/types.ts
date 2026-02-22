export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  generation: number;
  isFinalEvolution: boolean;
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  sprite: string;
  // Internal metadata for version/exclusivity features.
  gameIndexVersionIds?: string[];
  exclusiveStatus?: "exclusive" | "shared" | "unknown";
  exclusiveToVersionIds?: string[] | null;
  // Internal metadata for recommendation filtering.
  isLegendary?: boolean;
  isMythical?: boolean;
  isStarterLine?: boolean;
  isPostgame?: boolean;
  evolutionStage?: number;
  evolutionLine?: string[];
}

export type DexMode = "regional" | "national";
export type CardDensity = "compact" | "comfortable";
export type DragBehavior = "auto" | "on" | "off";

export interface BuilderSettings {
  defaultDexMode: DexMode;
  defaultVersionFilter: boolean;
  cardDensity: CardDensity;
  reduceMotion: boolean;
  dragBehavior: DragBehavior;
  versionTheming: boolean;
  mobileHaptics: boolean;
}

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
  preMainStoryDexCandidates?: string[];
  postgameDexCandidates?: string[];
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

export interface OffensiveCoverageEntry {
  /** How many team members can hit this type super-effectively (via STAB) */
  hitCount: number;
  /** The team members that can hit this type, with their best multiplier */
  hitters: PokemonWithEffectiveness[];
  /** Type is not available in this generation */
  locked?: boolean;
}

export type OffensiveCoverageMap = Record<string, OffensiveCoverageEntry>;

export interface GenerationMeta {
  generation: number;
  region: string;
  primaryName: string;
  games: Game[];
  starters: string[];
  legendaries: string[];
}
