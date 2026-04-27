export interface TeamPokemonContext {
  id: number;
  name: string;
  types: string[];
  generation: number;
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  evolutionStage?: number;
  evolutionLine?: string[];
}

export type DexMode = "regional" | "national" | "all";
export type BossStage = "gym" | "elite4" | "champion";

export interface TeamContextPayload {
  generation: number;
  gameId: number;
  selectedVersionId: string | null;
  team: TeamPokemonContext[];
  filters?: {
    dexMode?: DexMode;
    versionFilterEnabled?: boolean;
    typeFilter?: string[];
    regionalDexName?: string | null;
  };
  allowedPokemonNames?: string[];
  progression?: {
    checkpointBossName?: string | null;
    checkpointStage?: BossStage | null;
    checkpointGymOrder?: number | null;
    checkpointCatchableNames?: string[];
    checkpointCatchablePoolSize?: number | null;
    checkpointBlockedFinalNames?: string[];
    checkpointEvolutionFallbacks?: Array<{ fromName: string; toName: string }>;
  };
}

export interface BossGuideEntry {
  name: string;
  stage: BossStage;
  primaryTypes: string[];
  notes?: string;
  gymOrder?: number;
  recommendedPlayerLevelRange?: string;
  expectedEvolutionBand?: string;
}

export type AiMessageRole = "user" | "assistant" | "system_event";
export type AiMessageKind = "chat" | "analysis";

export interface PersistedAiMessage {
  role: AiMessageRole;
  kind: AiMessageKind;
  content: string;
}
