export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  generation: number;
  baseSpeciesName?: string;
  formName?: string;
  formKind?: "base" | "regional" | "mega" | "primal" | "gigantamax" | "alternate";
  isDefaultForm?: boolean;
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

export type DexMode = "regional" | "national" | "all";
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
  allForms: Pokemon[];
  regionalResolved: boolean;
  regionalDexName: string | null;
  allFormsResolved: boolean;
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

// ── Battle Planner types ─────────────────────────────────────────────────────

export type MatchupPrediction = "win" | "lean-win" | "even" | "lean-loss" | "loss";
export type OpponentTeamSource = "manual" | "preset";
export type BattleCheckpointStage = "gym" | "elite4" | "champion";
export type BattleRealismMode = "strict" | "sandbox";

export interface BattleCheckpoint {
  bossName: string | null;
  stage: BattleCheckpointStage | null;
  gymOrder: number | null;
}

export interface OpponentTeam {
  id?: string;
  name: string;
  generation: number;
  gameId: number;
  selectedVersionId: string | null;
  source: OpponentTeamSource;
  presetBossKey?: string | null;
  slots: (Pokemon | null)[];
  notes?: string | null;
}

export interface MatchupMatrixCell {
  mySlotIndex: number;
  opponentSlotIndex: number;
  myPokemonId: number;
  opponentPokemonId: number;
  score: number;
  prediction: MatchupPrediction;
  reasons: string[];
}

export interface RecommendedAssignment {
  mySlotIndex: number;
  opponentSlotIndex: number;
  myPokemonId: number;
  opponentPokemonId: number;
  score: number;
  prediction: MatchupPrediction;
}

export interface BattlePlannerResult {
  matrix: MatchupMatrixCell[];
  assignments: RecommendedAssignment[];
  totalScore: number;
  effectiveTotalScore: number;
  realism: {
    mode: BattleRealismMode;
    checkpoint: BattleCheckpoint | null;
    rules: {
      label: string;
      levelMin: number;
      levelMax: number;
      maxEvolutionStage: number;
    } | null;
    warnings: Array<{
      team: "myTeam" | "opponentTeam";
      slotIndex: number;
      pokemonName: string;
      code: string;
      message: string;
      penalty: number;
      severity: "warning" | "violation";
    }>;
    violations: Array<{
      team: "myTeam" | "opponentTeam";
      slotIndex: number;
      pokemonName: string;
      code: string;
      message: string;
      penalty: number;
      severity: "warning" | "violation";
    }>;
    penaltyTotal: number;
    realismScore: number;
  };
}

export interface BossPreset {
  key: string;
  name: string;
  stage: "gym" | "elite4" | "champion";
  gymOrder?: number;
  versionIds: string[];
  rosterPokemonIds: number[];
  rosterLevels?: number[];
}
