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
  gameIndexVersionIds?: string[];
  exclusiveStatus?: "exclusive" | "shared" | "unknown";
  exclusiveToVersionIds?: string[] | null;
  isLegendary?: boolean;
  isMythical?: boolean;
  isStarterLine?: boolean;
  isPostgame?: boolean;
  evolutionStage?: number;
  evolutionLine?: string[];
}

export interface PokemonPools {
  national: Pokemon[];
  regional: Pokemon[];
  regionalResolved: boolean;
  regionalDexName: string | null;
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

export interface GenerationMeta {
  generation: number;
  region: string;
  primaryName: string;
  games: Game[];
  starters: string[];
  legendaries: string[];
}
