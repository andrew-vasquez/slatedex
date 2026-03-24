import { Hono } from "hono";
import {
  AiMessageKind as PrismaAiMessageKind,
  AiMessageRole as PrismaAiMessageRole,
  type AiMessageKind as PrismaAiMessageKindType,
  type AiMessageRole as PrismaAiMessageRoleType,
  type Team,
} from "../generated/prisma/client";
import { prisma } from "../db";
import { authMiddleware } from "../middleware/auth";
import { config } from "../lib/config";
import { buildTeamContext } from "../lib/ai/context";
import { getBossGuidanceForVersion } from "../lib/ai/bossData";
import { buildAnalyzePrompt, buildChatPrompt } from "../lib/ai/prompts";
import { AiRequestError, generateAiText } from "../lib/ai/openai";
import { capturePostHogEventImmediate } from "../lib/posthog";
import { readJsonBody } from "../lib/request";
import {
  getCurrentUsageSnapshot,
  releaseUsageReservation,
  reserveUsage,
  type CurrentAiUsageSnapshot,
} from "../lib/ai/quota";
import type {
  DexMode,
  PersistedAiMessage,
  TeamContextPayload,
  TeamPokemonContext,
} from "../lib/ai/types";

type AuthEnv = {
  Variables: {
    user: { id: string; name: string; email: string };
    session: { id: string; userId: string };
  };
};

const MAX_MESSAGE_LENGTH = 2_000;
const MAX_TEAM_NAME_LENGTH = 80;
const MAX_VERSION_ID_LENGTH = 64;
const MAX_CHAT_HISTORY_MESSAGES = 20;
const MAX_RETAINED_MESSAGES = 50;
const MAX_TEAM_PAYLOAD_BYTES = 64_000;
const MAX_POKEMON_NAME_LENGTH = 48;
const MAX_SPRITE_LENGTH = 500;
const MAX_ALLOWED_POKEMON_NAMES = 1_200;
const MAX_TYPE_FILTER_VALUES = 6;
const MAX_CHECKPOINT_BOSS_NAME_LENGTH = 80;
const MAX_CHECKPOINT_CATCHABLE_NAMES = 80;
const MAX_CHECKPOINT_BLOCKED_FINAL_NAMES = 240;
const MAX_CHECKPOINT_EVOLUTION_FALLBACKS = 260;
const MAX_EVOLUTION_LINE_LENGTH = 5;
const ALLOWED_EXCLUSIVE_STATUSES = new Set(["exclusive", "shared", "unknown"]);
const ALLOWED_DEX_MODES = new Set<DexMode>(["regional", "national"]);
const MAX_ANALYTICS_ERROR_MESSAGE_LENGTH = 500;
const MAX_AI_REQUEST_BODY_BYTES = 128_000;

const ai = new Hono<AuthEnv>();
ai.use("*", authMiddleware);

type TeamPokemonPersistenceSlot = Record<string, unknown> | null;
type TeamCreateData = Parameters<typeof prisma.team.create>[0]["data"];
type TeamUpdateData = Parameters<typeof prisma.team.update>[0]["data"];
type AiMessageCreateData = Parameters<typeof prisma.aiMessage.create>[0]["data"];
type AiMessageMetadata = AiMessageCreateData["metadata"];
type TeamBindingResult = { team: Team } | { error: string; status: 400 | 404 };

function isErrorWithCode(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

type AiHttpError = { status: 502 | 503; message: string };

function toAiHttpError(error: unknown): AiHttpError {
  if (error instanceof AiRequestError) {
    return { status: 502, message: error.message };
  }

  if (isErrorWithCode(error)) {
    if (error.code === "P1001") {
      return { status: 503, message: "Database is unreachable right now. Please try again shortly." };
    }
    if (error.code === "P2021") {
      return { status: 503, message: "AI storage tables are missing. Run Prisma migrations and retry." };
    }
  }

  if (error instanceof Error && error.message.includes("OPENAI_API_KEY")) {
    return { status: 503, message: "AI Coach is not configured." };
  }

  return { status: 502, message: "AI request failed." };
}

function toAnalyticsErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const trimmed = error.message.trim();
    if (trimmed.length > 0) {
      return trimmed.slice(0, MAX_ANALYTICS_ERROR_MESSAGE_LENGTH);
    }
    return error.name;
  }
  return "unknown-error";
}

function parsePositiveInt(raw: unknown): number | null {
  const value = typeof raw === "string" || typeof raw === "number" ? Number(raw) : NaN;
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

function parseStat(raw: unknown): number | null {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  if (raw < 0 || raw > 500) return null;
  return raw;
}

function parseVersionIds(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;

  const values: string[] = [];
  for (const value of raw) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || trimmed.length > MAX_VERSION_ID_LENGTH) return null;
    values.push(trimmed);
  }

  return values;
}

function parsePokemonSlot(raw: unknown): TeamPokemonPersistenceSlot | "invalid" {
  if (raw === null) return null;
  if (!raw || typeof raw !== "object") return "invalid";

  const candidate = raw as Record<string, unknown>;
  const id = parsePositiveInt(candidate.id);
  const generation = parsePositiveInt(candidate.generation);
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  const types = Array.isArray(candidate.types)
    ? candidate.types
        .map((type) => (typeof type === "string" ? type.trim().toLowerCase() : ""))
        .filter(Boolean)
    : [];

  if (!id || !generation) return "invalid";
  if (!name || name.length > MAX_POKEMON_NAME_LENGTH) return "invalid";
  if (types.length === 0 || types.length > 2) return "invalid";

  const hp = parseStat(candidate.hp);
  const attack = parseStat(candidate.attack);
  const defense = parseStat(candidate.defense);
  const specialAttack = parseStat(candidate.specialAttack);
  const specialDefense = parseStat(candidate.specialDefense);
  const speed = parseStat(candidate.speed);

  if (
    hp === null ||
    attack === null ||
    defense === null ||
    specialAttack === null ||
    specialDefense === null ||
    speed === null
  ) {
    return "invalid";
  }

  const slot: Record<string, unknown> = {
    id,
    name,
    types,
    generation,
    isFinalEvolution: candidate.isFinalEvolution === true,
    hp,
    attack,
    defense,
    specialAttack,
    specialDefense,
    speed,
  };

  if (candidate.sprite !== undefined) {
    if (typeof candidate.sprite !== "string") return "invalid";
    if (candidate.sprite.length > MAX_SPRITE_LENGTH) return "invalid";
    slot.sprite = candidate.sprite;
  }

  if (candidate.isLegendary !== undefined) {
    if (typeof candidate.isLegendary !== "boolean") return "invalid";
    slot.isLegendary = candidate.isLegendary;
  }
  if (candidate.isMythical !== undefined) {
    if (typeof candidate.isMythical !== "boolean") return "invalid";
    slot.isMythical = candidate.isMythical;
  }
  if (candidate.isStarterLine !== undefined) {
    if (typeof candidate.isStarterLine !== "boolean") return "invalid";
    slot.isStarterLine = candidate.isStarterLine;
  }

  if (candidate.evolutionStage !== undefined) {
    if (
      typeof candidate.evolutionStage !== "number" ||
      !Number.isInteger(candidate.evolutionStage) ||
      candidate.evolutionStage < 1 ||
      candidate.evolutionStage > MAX_EVOLUTION_LINE_LENGTH
    ) {
      return "invalid";
    }
    slot.evolutionStage = candidate.evolutionStage;
  }

  if (candidate.evolutionLine !== undefined) {
    if (!Array.isArray(candidate.evolutionLine)) return "invalid";
    if (candidate.evolutionLine.length === 0 || candidate.evolutionLine.length > MAX_EVOLUTION_LINE_LENGTH) {
      return "invalid";
    }
    const evolutionLine = candidate.evolutionLine
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);
    if (evolutionLine.length !== candidate.evolutionLine.length) return "invalid";
    slot.evolutionLine = evolutionLine;
  }

  if (candidate.gameIndexVersionIds !== undefined) {
    const versionIds = parseVersionIds(candidate.gameIndexVersionIds);
    if (!versionIds) return "invalid";
    slot.gameIndexVersionIds = versionIds;
  }

  if (candidate.exclusiveStatus !== undefined) {
    if (
      typeof candidate.exclusiveStatus !== "string" ||
      !ALLOWED_EXCLUSIVE_STATUSES.has(candidate.exclusiveStatus)
    ) {
      return "invalid";
    }
    slot.exclusiveStatus = candidate.exclusiveStatus;
  }

  if (candidate.exclusiveToVersionIds !== undefined) {
    if (candidate.exclusiveToVersionIds === null) {
      slot.exclusiveToVersionIds = null;
    } else {
      const versionIds = parseVersionIds(candidate.exclusiveToVersionIds);
      if (!versionIds) return "invalid";
      slot.exclusiveToVersionIds = versionIds;
    }
  }

  return slot;
}

function toTeamContextPokemon(slot: Record<string, unknown>): TeamPokemonContext {
  return {
    id: slot.id as number,
    name: slot.name as string,
    types: slot.types as string[],
    generation: slot.generation as number,
    hp: slot.hp as number,
    attack: slot.attack as number,
    defense: slot.defense as number,
    specialAttack: slot.specialAttack as number,
    specialDefense: slot.specialDefense as number,
    speed: slot.speed as number,
    evolutionStage:
      typeof slot.evolutionStage === "number" && Number.isInteger(slot.evolutionStage)
        ? (slot.evolutionStage as number)
        : undefined,
    evolutionLine: Array.isArray(slot.evolutionLine)
      ? (slot.evolutionLine as string[])
      : undefined,
  };
}

function parsePokemonTeam(
  raw: unknown
): { value?: TeamPokemonContext[]; slots?: TeamPokemonPersistenceSlot[]; error?: string } {
  if (!Array.isArray(raw) || raw.length !== 6) {
    return { error: "team must be an array of length 6" };
  }

  const parsedSlots: TeamPokemonPersistenceSlot[] = [];
  const filled: TeamPokemonContext[] = [];
  for (const slot of raw) {
    const normalized = parsePokemonSlot(slot);
    if (normalized === "invalid") {
      return { error: "team contains an invalid slot payload" };
    }
    parsedSlots.push(normalized);
    if (normalized) {
      filled.push(toTeamContextPokemon(normalized));
    }
  }

  if (filled.length === 0) {
    return { error: "Add at least one Pokemon before using AI Coach." };
  }

  const payloadBytes = new TextEncoder().encode(JSON.stringify(parsedSlots)).length;
  if (payloadBytes > MAX_TEAM_PAYLOAD_BYTES) {
    return { error: "team payload is too large" };
  }

  return { value: filled, slots: parsedSlots };
}

function normalizeTeamFromDb(raw: unknown): TeamPokemonContext[] {
  const parsed = parsePokemonTeam(raw);
  return parsed.value ?? [];
}

function parseSelectedVersionId(raw: unknown): string | null | "invalid" {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") return "invalid";

  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed.length > MAX_VERSION_ID_LENGTH) return "invalid";
  if (!/^[a-z0-9_-]+$/.test(trimmed)) return "invalid";

  return trimmed;
}

function parseTeamId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseMessage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return null;
  return trimmed;
}

function parseDexMode(raw: unknown): DexMode | null | "invalid" {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") return "invalid";
  const normalized = raw.trim().toLowerCase() as DexMode;
  if (!ALLOWED_DEX_MODES.has(normalized)) return "invalid";
  return normalized;
}

function parseBoolean(raw: unknown): boolean | null | "invalid" {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "boolean") return "invalid";
  return raw;
}

function parseTypeFilter(raw: unknown): string[] | null | "invalid" {
  if (raw === undefined || raw === null) return null;
  if (!Array.isArray(raw)) return "invalid";
  if (raw.length > MAX_TYPE_FILTER_VALUES) return "invalid";

  const values: string[] = [];
  for (const value of raw) {
    if (typeof value !== "string") return "invalid";
    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized.length > 20) return "invalid";
    values.push(normalized);
  }

  return Array.from(new Set(values));
}

function parseAllowedPokemonNames(raw: unknown): string[] | null | "invalid" {
  if (raw === undefined || raw === null) return null;
  if (!Array.isArray(raw)) return "invalid";
  if (raw.length > MAX_ALLOWED_POKEMON_NAMES) return "invalid";

  const values: string[] = [];
  for (const value of raw) {
    if (typeof value !== "string") return "invalid";
    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized.length > MAX_POKEMON_NAME_LENGTH) return "invalid";
    if (!/^[a-z0-9-]+$/.test(normalized)) return "invalid";
    values.push(normalized);
  }

  return Array.from(new Set(values));
}

function parseRegionalDexName(raw: unknown): string | null | "invalid" {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") return "invalid";
  const normalized = raw.trim();
  if (!normalized || normalized.length > 80) return "invalid";
  return normalized;
}

function parseCheckpointBossName(raw: unknown): string | null | "invalid" {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") return "invalid";
  const normalized = raw.trim();
  if (!normalized || normalized.length > MAX_CHECKPOINT_BOSS_NAME_LENGTH) return "invalid";
  return normalized;
}

function parseCheckpointStage(raw: unknown): "gym" | "elite4" | "champion" | null | "invalid" {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") return "invalid";
  const normalized = raw.trim().toLowerCase();
  if (normalized === "gym" || normalized === "elite4" || normalized === "champion") {
    return normalized;
  }
  return "invalid";
}

function coerceCheckpointStage(raw: unknown): "gym" | "elite4" | "champion" | null {
  const parsed = parseCheckpointStage(raw);
  if (parsed === "invalid") return null;
  return parsed;
}

function parseCheckpointGymOrder(raw: unknown): number | null | "invalid" {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "number" || !Number.isInteger(raw)) return "invalid";
  if (raw < 1 || raw > 12) return "invalid";
  return raw;
}

function parseCheckpointCatchableNames(raw: unknown): string[] | null | "invalid" {
  if (raw === undefined || raw === null) return null;
  if (!Array.isArray(raw)) return "invalid";
  if (raw.length > MAX_CHECKPOINT_CATCHABLE_NAMES) return "invalid";

  const values: string[] = [];
  for (const value of raw) {
    if (typeof value !== "string") return "invalid";
    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized.length > MAX_POKEMON_NAME_LENGTH) return "invalid";
    if (!/^[a-z0-9-]+$/.test(normalized)) return "invalid";
    values.push(normalized);
  }

  return Array.from(new Set(values));
}

function parseCheckpointBlockedFinalNames(raw: unknown): string[] | null | "invalid" {
  if (raw === undefined || raw === null) return null;
  if (!Array.isArray(raw)) return "invalid";
  if (raw.length > MAX_CHECKPOINT_BLOCKED_FINAL_NAMES) return "invalid";

  const values: string[] = [];
  for (const value of raw) {
    if (typeof value !== "string") return "invalid";
    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized.length > MAX_POKEMON_NAME_LENGTH) return "invalid";
    if (!/^[a-z0-9-]+$/.test(normalized)) return "invalid";
    values.push(normalized);
  }

  return Array.from(new Set(values));
}

function parseCheckpointEvolutionFallbacks(
  raw: unknown
): Array<{ fromName: string; toName: string }> | null | "invalid" {
  if (raw === undefined || raw === null) return null;
  if (!Array.isArray(raw)) return "invalid";
  if (raw.length > MAX_CHECKPOINT_EVOLUTION_FALLBACKS) return "invalid";

  const deduped = new Map<string, { fromName: string; toName: string }>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return "invalid";
    const candidate = entry as { fromName?: unknown; toName?: unknown };
    if (typeof candidate.fromName !== "string" || typeof candidate.toName !== "string") return "invalid";
    const fromName = candidate.fromName.trim().toLowerCase();
    const toName = candidate.toName.trim().toLowerCase();
    if (!fromName || !toName || fromName.length > MAX_POKEMON_NAME_LENGTH || toName.length > MAX_POKEMON_NAME_LENGTH) {
      return "invalid";
    }
    if (!/^[a-z0-9-]+$/.test(fromName) || !/^[a-z0-9-]+$/.test(toName)) return "invalid";
    if (fromName === toName) continue;
    deduped.set(fromName, { fromName, toName });
  }

  return Array.from(deduped.values());
}

function parseCheckpointCatchablePoolSize(raw: unknown): number | null | "invalid" {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "number" || !Number.isInteger(raw)) return "invalid";
  if (raw < 1 || raw > MAX_ALLOWED_POKEMON_NAMES) return "invalid";
  return raw;
}

function normalizeLookupToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function inferGymOrderFromText(text: string): number | null {
  const patterns: Array<{ pattern: RegExp; value: number }> = [
    { pattern: /\b(first|1st|gym\s*1|gym\s*one)\b/i, value: 1 },
    { pattern: /\b(second|2nd|gym\s*2|gym\s*two)\b/i, value: 2 },
    { pattern: /\b(third|3rd|gym\s*3|gym\s*three)\b/i, value: 3 },
    { pattern: /\b(fourth|4th|gym\s*4|gym\s*four)\b/i, value: 4 },
    { pattern: /\b(fifth|5th|gym\s*5|gym\s*five)\b/i, value: 5 },
    { pattern: /\b(sixth|6th|gym\s*6|gym\s*six)\b/i, value: 6 },
    { pattern: /\b(seventh|7th|gym\s*7|gym\s*seven)\b/i, value: 7 },
    { pattern: /\b(eighth|8th|gym\s*8|gym\s*eight)\b/i, value: 8 },
  ];

  for (const entry of patterns) {
    if (entry.pattern.test(text)) return entry.value;
  }
  return null;
}

function inferCheckpointFromMessage(
  message: string,
  bossGuidance: ReturnType<typeof getBossGuidanceForVersion>
): {
  name: string;
  stage: "gym" | "elite4" | "champion";
  gymOrder?: number;
} | null {
  if (!message || bossGuidance.length === 0) return null;
  const lowered = message.toLowerCase();

  if (/\bchampion\b/.test(lowered)) {
    const champion = bossGuidance.find((entry) => entry.stage === "champion");
    if (champion) {
      return { name: champion.name, stage: champion.stage, gymOrder: champion.gymOrder };
    }
  }

  if (/\belite\s*four\b|\belite4\b|\be4\b/.test(lowered)) {
    const elite = bossGuidance.find((entry) => entry.stage === "elite4");
    if (elite) {
      return { name: elite.name, stage: elite.stage, gymOrder: elite.gymOrder };
    }
  }

  const gymOrderHint = inferGymOrderFromText(lowered);
  if (gymOrderHint !== null) {
    const gym = bossGuidance.find((entry) => entry.stage === "gym" && entry.gymOrder === gymOrderHint);
    if (gym) {
      return { name: gym.name, stage: gym.stage, gymOrder: gym.gymOrder };
    }
  }

  for (const entry of bossGuidance) {
    const normalizedEntry = normalizeLookupToken(entry.name);
    if (normalizedEntry && normalizeLookupToken(lowered).includes(normalizedEntry)) {
      return { name: entry.name, stage: entry.stage, gymOrder: entry.gymOrder };
    }

    const aliases = entry.name
      .split(/[\/,&]/g)
      .map((part) => part.trim().toLowerCase())
      .filter((token) => token.length >= 3);

    if (aliases.some((alias) => lowered.includes(alias))) {
      return { name: entry.name, stage: entry.stage, gymOrder: entry.gymOrder };
    }
  }

  return null;
}

function enforceLegacyTypeLanguage(text: string, generation: number): string {
  let next = text;

  if (generation < 6) {
    next = next.replace(/\bfairy(?:-type)?\b/gi, "a type not available in this game");
  }

  if (generation === 1) {
    next = next.replace(/\bdark(?:-type)?\b/gi, "a type not available in Gen 1");
    next = next.replace(/\bsteel(?:-type)?\b/gi, "a type not available in Gen 1");
  }

  return next;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceSpeciesName(text: string, fromName: string, toName: string): string {
  const escaped = escapeRegExp(fromName);
  const pattern = new RegExp(`(^|[^a-z0-9-])(${escaped})(?=[^a-z0-9-]|$)`, "gim");
  return text.replace(pattern, (match, prefix: string) => {
    const sourceName = match.slice(prefix.length);
    const replacement =
      sourceName.length > 0 && sourceName[0] === sourceName[0].toUpperCase()
        ? toName.charAt(0).toUpperCase() + toName.slice(1)
        : toName;
    return `${prefix}${replacement}`;
  });
}

type ProgressionValidationContext = {
  progression?: {
    checkpoint?: { stage?: "gym" | "elite4" | "champion" } | null;
    assumedTeamForms?: Array<{ sourceSpeciesName: string; assumedSpeciesName: string }>;
    checkpointEvolutionFallbacks?: Array<{ fromName: string; toName: string }>;
  };
};

function enforceCheckpointEvolutionGuardrails(
  text: string,
  context: ProgressionValidationContext | null | undefined
): string {
  if (!text.trim()) return text;
  const checkpointStage = context?.progression?.checkpoint?.stage ?? null;
  if (checkpointStage !== "gym") return text;

  const fallbackMap = new Map<string, string>();
  for (const fallback of context?.progression?.checkpointEvolutionFallbacks ?? []) {
    const from = fallback.fromName.trim().toLowerCase();
    const to = fallback.toName.trim().toLowerCase();
    if (!from || !to || from === to) continue;
    fallbackMap.set(from, to);
  }
  for (const assumed of context?.progression?.assumedTeamForms ?? []) {
    const from = assumed.sourceSpeciesName.trim().toLowerCase();
    const to = assumed.assumedSpeciesName.trim().toLowerCase();
    if (!from || !to || from === to) continue;
    fallbackMap.set(from, to);
  }

  let next = text;
  for (const [fromName, toName] of fallbackMap.entries()) {
    next = replaceSpeciesName(next, fromName, toName);
  }
  return next;
}

type AnalysisContextShape = {
  teamSize: number;
  summary: {
    typeDistribution: Array<{ type: string; count: number }>;
    shape: {
      fastCount: number;
      bulkyCount: number;
      physicalCount: number;
      specialCount: number;
    };
  };
};

function hasSection(text: string, header: string): boolean {
  const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^\\s{0,3}(?:#{1,6}\\s*)?${escaped}\\s*:`, "im").test(text);
}

function inferSpeedCurveLabel(shape: AnalysisContextShape["summary"]["shape"], teamSize: number): string {
  const threshold = Math.max(2, Math.ceil(teamSize / 3));
  if (shape.fastCount >= threshold) return "Aggressive";
  if (shape.bulkyCount >= threshold) return "Bulky";
  return "Balanced";
}

function inferTypeOverlapSummary(typeDistribution: Array<{ type: string; count: number }>): string {
  const overlaps = typeDistribution.filter((entry) => entry.count > 1);
  if (overlaps.length === 0) return "Low overlap";
  if (overlaps.length === 1) return `Focused overlap on ${overlaps[0]?.type ?? "one type"}`;
  return `Moderate overlap (${overlaps.slice(0, 2).map((entry) => entry.type).join(", ")})`;
}

function inferHazardPosture(typeDistribution: Array<{ type: string; count: number }>): string {
  const types = new Set(typeDistribution.map((entry) => entry.type.toLowerCase()));
  const hasSetterProfile = ["rock", "ground", "steel"].some((type) => types.has(type));
  const hasControlProfile = ["flying", "poison", "fire", "steel", "ground"].some((type) =>
    types.has(type)
  );
  if (hasSetterProfile && hasControlProfile) return "Set + pressure profile";
  if (hasSetterProfile) return "Set pressure likely";
  if (hasControlProfile) return "Removal pressure likely";
  return "Needs explicit hazard plan";
}

function inferTeamGrade(context: AnalysisContextShape): { grade: string; confidence: string; rationale: string } {
  const { teamSize, summary } = context;
  const { shape, typeDistribution } = summary;

  let score = 52 + Math.min(teamSize, 6) * 7;
  const overlapPenalty = typeDistribution
    .filter((entry) => entry.count > 1)
    .reduce((sum, entry) => sum + (entry.count - 1) * 2.5, 0);
  score -= overlapPenalty;
  if (shape.fastCount === 0) score -= 5;
  if (shape.bulkyCount === 0) score -= 3;
  if (shape.physicalCount === 0 || shape.specialCount === 0) score -= 4;
  if (teamSize < 4) score -= 6;

  const bounded = Math.max(35, Math.min(97, score));
  const grade =
    bounded >= 92
      ? "A"
      : bounded >= 86
        ? "A-"
        : bounded >= 80
          ? "B+"
          : bounded >= 74
            ? "B"
            : bounded >= 68
              ? "B-"
              : bounded >= 62
                ? "C+"
                : bounded >= 56
                  ? "C"
                  : bounded >= 50
                    ? "C-"
                    : "D";

  const confidence = teamSize >= 5 ? "High" : teamSize >= 3 ? "Medium" : "Low";
  const rationale =
    teamSize >= 6
      ? "Full party gives stable matchup coverage."
      : "Partial party means matchup coverage is still volatile.";

  return { grade, confidence, rationale };
}

function ensureAnalysisScaffold(text: string, context: AnalysisContextShape): string {
  const normalized = text.trim();
  if (!normalized) return normalized;

  const missingTeamGrade = !hasSection(normalized, "Team Grade");
  const missingQuickRead = !hasSection(normalized, "Quick Read");
  if (!missingTeamGrade && !missingQuickRead) return normalized;

  const sections: string[] = [];
  if (missingTeamGrade) {
    const grade = inferTeamGrade(context);
    sections.push(`Team Grade:\n- ${grade.grade} (Confidence: ${grade.confidence}) — ${grade.rationale}`);
  }
  if (missingQuickRead) {
    const speedCurve = inferSpeedCurveLabel(context.summary.shape, context.teamSize);
    const overlap = inferTypeOverlapSummary(context.summary.typeDistribution);
    const hazardPosture = inferHazardPosture(context.summary.typeDistribution);
    sections.push(
      [
        "Quick Read:",
        `- Speed curve: ${speedCurve}`,
        `- Type overlap: ${overlap}`,
        `- Hazard posture: ${hazardPosture}`,
      ].join("\n")
    );
  }

  return `${sections.join("\n\n")}\n\n${normalized}`;
}

function shouldUseAnalysisScaffoldForChat(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized.includes("analyze my team") ||
    normalized.includes("analyse my team") ||
    normalized.includes("full analysis") ||
    normalized.includes("team grade") ||
    normalized.includes("grade my team") ||
    normalized.includes("rate my team") ||
    normalized.includes("team report")
  );
}

function toApiRole(role: PrismaAiMessageRoleType): PersistedAiMessage["role"] {
  if (role === "ASSISTANT") return "assistant";
  if (role === "SYSTEM_EVENT") return "system_event";
  return "user";
}

function toApiKind(kind: PrismaAiMessageKindType): PersistedAiMessage["kind"] {
  if (kind === "ANALYSIS") return "analysis";
  return "chat";
}

function fromApiRole(role: PersistedAiMessage["role"]): PrismaAiMessageRoleType {
  if (role === "assistant") return PrismaAiMessageRole.ASSISTANT;
  if (role === "system_event") return PrismaAiMessageRole.SYSTEM_EVENT;
  return PrismaAiMessageRole.USER;
}

function fromApiKind(kind: PersistedAiMessage["kind"]): PrismaAiMessageKindType {
  if (kind === "analysis") return PrismaAiMessageKind.ANALYSIS;
  return PrismaAiMessageKind.CHAT;
}

async function getOrCreateConversation(userId: string, teamId: string) {
  return prisma.aiConversation.upsert({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
    create: {
      userId,
      teamId,
    },
    update: {},
  });
}

async function trimConversationMessages(conversationId: string) {
  const total = await prisma.aiMessage.count({ where: { conversationId } });
  if (total <= MAX_RETAINED_MESSAGES) return;

  const overflow = total - MAX_RETAINED_MESSAGES;
  const stale = await prisma.aiMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: overflow,
    select: { id: true },
  });

  if (stale.length === 0) return;
  await prisma.aiMessage.deleteMany({
    where: {
      id: { in: stale.map((entry) => entry.id) },
    },
  });
}

async function getRecentHistory(conversationId: string): Promise<PersistedAiMessage[]> {
  const history = await prisma.aiMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: MAX_CHAT_HISTORY_MESSAGES,
  });

  return history
    .reverse()
    .map((entry) => ({
      role: toApiRole(entry.role),
      kind: toApiKind(entry.kind),
      content: entry.content,
    }));
}

async function saveMessage(params: {
  conversationId: string;
  role: PersistedAiMessage["role"];
  kind: PersistedAiMessage["kind"];
  content: string;
  metadata?: AiMessageMetadata;
}) {
  return prisma.aiMessage.create({
    data: {
      conversationId: params.conversationId,
      role: fromApiRole(params.role),
      kind: fromApiKind(params.kind),
      content: params.content,
      metadata: params.metadata,
    },
  });
}

function draftTeamName(): string {
  const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  return `Draft AI Team ${timestamp}`.slice(0, MAX_TEAM_NAME_LENGTH);
}

async function resolveTeamBinding(params: {
  userId: string;
  providedTeamId: string | null;
  generation: number | null;
  gameId: number | null;
  selectedVersionId: string | null;
  parsedTeamSlots: TeamPokemonPersistenceSlot[] | null;
}): Promise<TeamBindingResult> {
  const { userId, providedTeamId, generation, gameId, selectedVersionId, parsedTeamSlots } = params;

  if (providedTeamId) {
    const existing = await prisma.team.findFirst({
      where: { id: providedTeamId, userId },
    });
    if (!existing) {
      return { error: "Team not found", status: 404 as const };
    }

    if (parsedTeamSlots && generation && gameId) {
      const updated = await prisma.team.update({
        where: { id: existing.id },
        data: {
          generation,
          gameId,
          selectedVersionId: selectedVersionId ?? existing.selectedVersionId,
          pokemon: parsedTeamSlots as unknown as TeamUpdateData["pokemon"],
        },
      });
      return { team: updated };
    }

    return { team: existing };
  }

  if (!parsedTeamSlots || !generation || !gameId) {
    return {
      error: "generation, gameId, and a valid team payload are required when no teamId is provided.",
      status: 400 as const,
    };
  }

  const created = await prisma.team.create({
    data: {
      name: draftTeamName(),
      generation,
      gameId,
      selectedVersionId,
      pokemon: parsedTeamSlots as unknown as TeamCreateData["pokemon"],
      userId,
    },
  });

  return { team: created };
}

ai.get("/messages", async (c) => {
  const user = c.get("user");
  const teamId = parseTeamId(c.req.query("teamId"));
  if (!teamId) {
    return c.json({ error: "teamId is required." }, 400);
  }

  const team = await prisma.team.findFirst({
    where: { id: teamId, userId: user.id },
    select: { id: true },
  });
  if (!team) {
    return c.json({ error: "Team not found." }, 404);
  }

  const conversation = await prisma.aiConversation.findUnique({
    where: {
      userId_teamId: {
        userId: user.id,
        teamId,
      },
    },
  });

  if (!conversation) {
    return c.json({ teamId, messages: [] });
  }

  const messages = await prisma.aiMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: MAX_RETAINED_MESSAGES,
  });

  return c.json({
    teamId,
    messages: messages.map((message) => ({
      id: message.id,
      role: toApiRole(message.role),
      kind: toApiKind(message.kind),
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    })),
  });
});

ai.get("/boss-guidance", async (c) => {
  const versionId = parseSelectedVersionId(c.req.query("versionId"));
  if (versionId === "invalid") {
    return c.json({ error: "versionId is invalid." }, 400);
  }

  if (!versionId) {
    return c.json({ versionId: null, bossGuidance: [] });
  }

  const bossGuidance = getBossGuidanceForVersion(versionId);
  return c.json({
    versionId,
    bossGuidance,
  });
});

ai.get("/usage", async (c) => {
  const user = c.get("user");
  const usage = await getCurrentUsageSnapshot(user.id);
  if (!usage) {
    return c.json({ error: "User not found." }, 404);
  }
  return c.json(usage);
});

ai.post("/chat", async (c) => {
  if (!config.ai.enabled) {
    return c.json({ error: "AI Coach is disabled." }, 503);
  }
  if (!config.ai.apiKey) {
    return c.json({ error: "AI Coach is not configured." }, 503);
  }

  const user = c.get("user");
  const body = await readJsonBody(c.req.raw, MAX_AI_REQUEST_BODY_BYTES);
  if (!body.ok) {
    return c.json({ error: body.error }, body.status);
  }
  if (!body.value || typeof body.value !== "object") {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const payload = body.value as Record<string, unknown>;
  const providedTeamId = parseTeamId(payload.teamId);
  const generation = parsePositiveInt(payload.generation);
  const gameId = parsePositiveInt(payload.gameId);
  const selectedVersionId = parseSelectedVersionId(payload.selectedVersionId);
  const dexMode = parseDexMode(payload.dexMode);
  const versionFilterEnabled = parseBoolean(payload.versionFilterEnabled);
  const typeFilter = parseTypeFilter(payload.typeFilter);
  const allowedPokemonNames = parseAllowedPokemonNames(payload.allowedPokemonNames);
  const regionalDexName = parseRegionalDexName(payload.regionalDexName);
  const checkpointBossName = parseCheckpointBossName(payload.checkpointBossName);
  const checkpointStage = parseCheckpointStage(payload.checkpointStage);
  const checkpointGymOrder = parseCheckpointGymOrder(payload.checkpointGymOrder);
  const checkpointCatchableNames = parseCheckpointCatchableNames(payload.checkpointCatchableNames);
  const checkpointCatchablePoolSize = parseCheckpointCatchablePoolSize(
    payload.checkpointCatchablePoolSize
  );
  const checkpointBlockedFinalNames = parseCheckpointBlockedFinalNames(
    payload.checkpointBlockedFinalNames
  );
  const checkpointEvolutionFallbacks = parseCheckpointEvolutionFallbacks(
    payload.checkpointEvolutionFallbacks
  );
  const message = parseMessage(payload.message);
  const parsedTeam = payload.team !== undefined ? parsePokemonTeam(payload.team) : {};

  if (selectedVersionId === "invalid") {
    return c.json({ error: "selectedVersionId is invalid." }, 400);
  }
  if (dexMode === "invalid") {
    return c.json({ error: "dexMode is invalid." }, 400);
  }
  if (versionFilterEnabled === "invalid") {
    return c.json({ error: "versionFilterEnabled is invalid." }, 400);
  }
  if (typeFilter === "invalid") {
    return c.json({ error: "typeFilter is invalid." }, 400);
  }
  if (allowedPokemonNames === "invalid") {
    return c.json({ error: "allowedPokemonNames is invalid." }, 400);
  }
  if (regionalDexName === "invalid") {
    return c.json({ error: "regionalDexName is invalid." }, 400);
  }
  if (checkpointBossName === "invalid") {
    return c.json({ error: "checkpointBossName is invalid." }, 400);
  }
  if (checkpointStage === "invalid") {
    return c.json({ error: "checkpointStage is invalid." }, 400);
  }
  if (checkpointGymOrder === "invalid") {
    return c.json({ error: "checkpointGymOrder is invalid." }, 400);
  }
  if (checkpointCatchableNames === "invalid") {
    return c.json({ error: "checkpointCatchableNames is invalid." }, 400);
  }
  if (checkpointCatchablePoolSize === "invalid") {
    return c.json({ error: "checkpointCatchablePoolSize is invalid." }, 400);
  }
  if (checkpointBlockedFinalNames === "invalid") {
    return c.json({ error: "checkpointBlockedFinalNames is invalid." }, 400);
  }
  if (checkpointEvolutionFallbacks === "invalid") {
    return c.json({ error: "checkpointEvolutionFallbacks is invalid." }, 400);
  }
  if (!message) {
    return c.json({ error: "message is required and must be under 2000 characters." }, 400);
  }
  if (!parsedTeam.value && parsedTeam.error) {
    return c.json({ error: parsedTeam.error }, 400);
  }

  const binding = await resolveTeamBinding({
    userId: user.id,
    providedTeamId,
    generation,
    gameId,
    selectedVersionId,
    parsedTeamSlots: parsedTeam.slots ?? null,
  });
  if ("error" in binding) {
    return c.json({ error: binding.error }, binding.status);
  }
  const team = binding.team;

  const teamMembers = normalizeTeamFromDb(team.pokemon);
  if (teamMembers.length === 0) {
    return c.json({ error: "Team is empty. Add at least one Pokemon first." }, 400);
  }

  const bossGuidance = getBossGuidanceForVersion(team.selectedVersionId);
  const inferredCheckpoint = inferCheckpointFromMessage(message, bossGuidance);
  const contextPayload: TeamContextPayload = {
    generation: team.generation,
    gameId: team.gameId,
    selectedVersionId: team.selectedVersionId,
    team: teamMembers,
    filters: {
      dexMode: dexMode ?? "national",
      versionFilterEnabled: versionFilterEnabled ?? false,
      typeFilter: typeFilter ?? [],
      regionalDexName: regionalDexName ?? null,
    },
    allowedPokemonNames: allowedPokemonNames ?? [],
    progression: {
      checkpointBossName:
        checkpointBossName ?? team.checkpointBossName ?? inferredCheckpoint?.name ?? null,
      checkpointStage:
        checkpointStage ??
        coerceCheckpointStage(team.checkpointStage) ??
        inferredCheckpoint?.stage ??
        null,
      checkpointGymOrder:
        checkpointGymOrder ??
        (typeof team.checkpointGymOrder === "number" ? team.checkpointGymOrder : null) ??
        inferredCheckpoint?.gymOrder ??
        null,
      checkpointCatchableNames: checkpointCatchableNames ?? [],
      checkpointCatchablePoolSize: checkpointCatchablePoolSize ?? null,
      checkpointBlockedFinalNames: checkpointBlockedFinalNames ?? [],
      checkpointEvolutionFallbacks: checkpointEvolutionFallbacks ?? [],
    },
  };
  const context = buildTeamContext(contextPayload, bossGuidance);

  let reservedPeriodStart: Date | null = null;
  let reservedUsageSnapshot: CurrentAiUsageSnapshot | null = null;
  try {
    const usageReservation = await reserveUsage({ userId: user.id, action: "chat" });
    if (!usageReservation.allowed) {
      return c.json(
        { error: "Monthly AI chat limit reached. Update your plan or wait for reset.", usage: usageReservation.snapshot },
        429
      );
    }
    reservedPeriodStart = usageReservation.periodStart;
    reservedUsageSnapshot = usageReservation.snapshot;
  } catch (error) {
    console.error("[ai/chat] failed to reserve usage", error);
    return c.json({ error: "Could not validate AI usage limits. Please try again." }, 503);
  }

  let conversationId: string | null = null;

  try {
    const conversation = await getOrCreateConversation(user.id, team.id);
    conversationId = conversation.id;
    const history = await getRecentHistory(conversation.id);
    const prompt = buildChatPrompt({
      context,
      history,
      userMessage: message,
    });

    const aiResult = await generateAiText(prompt, {
      model: config.ai.models.chat,
      maxOutputTokens: config.ai.maxOutputTokensByTask.chat,
      temperature: 0.45,
      abortSignal: c.req.raw.signal,
      analytics: {
        distinctId: user.id,
        traceId: conversation.id,
        properties: { teamId: team.id, kind: "chat" },
      },
    });
    const chatBaseText = shouldUseAnalysisScaffoldForChat(message)
      ? ensureAnalysisScaffold(aiResult.text, context)
      : aiResult.text;
    const normalizedReply = enforceCheckpointEvolutionGuardrails(
      enforceLegacyTypeLanguage(chatBaseText, team.generation),
      context
    );

    const userMessageRow = await saveMessage({
      conversationId: conversation.id,
      role: "user",
      kind: "chat",
      content: message,
    });

    const assistantMessageRow = await saveMessage({
      conversationId: conversation.id,
      role: "assistant",
      kind: "chat",
      content: normalizedReply,
      metadata: {
        model: aiResult.model,
        usage: aiResult.usage,
      } as AiMessageMetadata,
    });

    await trimConversationMessages(conversation.id);

    await capturePostHogEventImmediate({
      distinctId: user.id,
      event: "ai_chat_completed",
      properties: {
        teamId: team.id,
        conversationId: conversation.id,
        generation: team.generation,
        gameId: team.gameId,
        selectedVersionId: team.selectedVersionId ?? null,
        model: aiResult.model,
        promptTokens: aiResult.usage?.promptTokens ?? null,
        completionTokens: aiResult.usage?.completionTokens ?? null,
        totalTokens: aiResult.usage?.totalTokens ?? null,
        replyCharacters: normalizedReply.length,
      },
    });

    return c.json({
      teamId: team.id,
      reply: normalizedReply,
      usage: reservedUsageSnapshot,
      userMessage: {
        id: userMessageRow.id,
        role: "user",
        kind: "chat",
        content: userMessageRow.content,
        createdAt: userMessageRow.createdAt.toISOString(),
      },
      assistantMessage: {
        id: assistantMessageRow.id,
        role: "assistant",
        kind: "chat",
        content: assistantMessageRow.content,
        createdAt: assistantMessageRow.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (reservedPeriodStart) {
      void releaseUsageReservation({
        userId: user.id,
        action: "chat",
        periodStart: reservedPeriodStart,
      }).catch((releaseError) => {
        console.error("[ai/chat] failed to release usage reservation", releaseError);
      });
    }
    const mapped = toAiHttpError(error);
    await capturePostHogEventImmediate({
      distinctId: user.id,
      event: "ai_chat_failed",
      properties: {
        teamId: team.id,
        conversationId,
        generation: team.generation,
        gameId: team.gameId,
        selectedVersionId: team.selectedVersionId ?? null,
        status: mapped.status,
        errorMessage: toAnalyticsErrorMessage(error),
      },
    });
    if (!(error instanceof AiRequestError)) {
      console.error("[ai/chat] unexpected error", error);
    }
    return c.json({ error: mapped.message }, mapped.status);
  }
});

ai.post("/analyze", async (c) => {
  if (!config.ai.enabled) {
    return c.json({ error: "AI Coach is disabled." }, 503);
  }
  if (!config.ai.apiKey) {
    return c.json({ error: "AI Coach is not configured." }, 503);
  }

  const user = c.get("user");
  const body = await readJsonBody(c.req.raw, MAX_AI_REQUEST_BODY_BYTES);
  if (!body.ok) {
    return c.json({ error: body.error }, body.status);
  }
  if (!body.value || typeof body.value !== "object") {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const payload = body.value as Record<string, unknown>;
  const providedTeamId = parseTeamId(payload.teamId);
  const generation = parsePositiveInt(payload.generation);
  const gameId = parsePositiveInt(payload.gameId);
  const selectedVersionId = parseSelectedVersionId(payload.selectedVersionId);
  const dexMode = parseDexMode(payload.dexMode);
  const versionFilterEnabled = parseBoolean(payload.versionFilterEnabled);
  const typeFilter = parseTypeFilter(payload.typeFilter);
  const allowedPokemonNames = parseAllowedPokemonNames(payload.allowedPokemonNames);
  const regionalDexName = parseRegionalDexName(payload.regionalDexName);
  const checkpointBossName = parseCheckpointBossName(payload.checkpointBossName);
  const checkpointStage = parseCheckpointStage(payload.checkpointStage);
  const checkpointGymOrder = parseCheckpointGymOrder(payload.checkpointGymOrder);
  const checkpointCatchableNames = parseCheckpointCatchableNames(payload.checkpointCatchableNames);
  const checkpointCatchablePoolSize = parseCheckpointCatchablePoolSize(
    payload.checkpointCatchablePoolSize
  );
  const checkpointBlockedFinalNames = parseCheckpointBlockedFinalNames(
    payload.checkpointBlockedFinalNames
  );
  const checkpointEvolutionFallbacks = parseCheckpointEvolutionFallbacks(
    payload.checkpointEvolutionFallbacks
  );
  const parsedTeam = payload.team !== undefined ? parsePokemonTeam(payload.team) : {};

  if (selectedVersionId === "invalid") {
    return c.json({ error: "selectedVersionId is invalid." }, 400);
  }
  if (dexMode === "invalid") {
    return c.json({ error: "dexMode is invalid." }, 400);
  }
  if (versionFilterEnabled === "invalid") {
    return c.json({ error: "versionFilterEnabled is invalid." }, 400);
  }
  if (typeFilter === "invalid") {
    return c.json({ error: "typeFilter is invalid." }, 400);
  }
  if (allowedPokemonNames === "invalid") {
    return c.json({ error: "allowedPokemonNames is invalid." }, 400);
  }
  if (regionalDexName === "invalid") {
    return c.json({ error: "regionalDexName is invalid." }, 400);
  }
  if (checkpointBossName === "invalid") {
    return c.json({ error: "checkpointBossName is invalid." }, 400);
  }
  if (checkpointStage === "invalid") {
    return c.json({ error: "checkpointStage is invalid." }, 400);
  }
  if (checkpointGymOrder === "invalid") {
    return c.json({ error: "checkpointGymOrder is invalid." }, 400);
  }
  if (checkpointCatchableNames === "invalid") {
    return c.json({ error: "checkpointCatchableNames is invalid." }, 400);
  }
  if (checkpointCatchablePoolSize === "invalid") {
    return c.json({ error: "checkpointCatchablePoolSize is invalid." }, 400);
  }
  if (checkpointBlockedFinalNames === "invalid") {
    return c.json({ error: "checkpointBlockedFinalNames is invalid." }, 400);
  }
  if (checkpointEvolutionFallbacks === "invalid") {
    return c.json({ error: "checkpointEvolutionFallbacks is invalid." }, 400);
  }
  if (!parsedTeam.value && parsedTeam.error) {
    return c.json({ error: parsedTeam.error }, 400);
  }

  const binding = await resolveTeamBinding({
    userId: user.id,
    providedTeamId,
    generation,
    gameId,
    selectedVersionId,
    parsedTeamSlots: parsedTeam.slots ?? null,
  });
  if ("error" in binding) {
    return c.json({ error: binding.error }, binding.status);
  }
  const team = binding.team;

  const teamMembers = normalizeTeamFromDb(team.pokemon);
  if (teamMembers.length === 0) {
    return c.json({ error: "Team is empty. Add at least one Pokemon first." }, 400);
  }

  const contextPayload: TeamContextPayload = {
    generation: team.generation,
    gameId: team.gameId,
    selectedVersionId: team.selectedVersionId,
    team: teamMembers,
    filters: {
      dexMode: dexMode ?? "national",
      versionFilterEnabled: versionFilterEnabled ?? false,
      typeFilter: typeFilter ?? [],
      regionalDexName: regionalDexName ?? null,
    },
    allowedPokemonNames: allowedPokemonNames ?? [],
    progression: {
      checkpointBossName: checkpointBossName ?? team.checkpointBossName ?? null,
      checkpointStage: checkpointStage ?? coerceCheckpointStage(team.checkpointStage) ?? null,
      checkpointGymOrder:
        checkpointGymOrder ??
        (typeof team.checkpointGymOrder === "number" ? team.checkpointGymOrder : null) ??
        null,
      checkpointCatchableNames: checkpointCatchableNames ?? [],
      checkpointCatchablePoolSize: checkpointCatchablePoolSize ?? null,
      checkpointBlockedFinalNames: checkpointBlockedFinalNames ?? [],
      checkpointEvolutionFallbacks: checkpointEvolutionFallbacks ?? [],
    },
  };
  const bossGuidance = getBossGuidanceForVersion(team.selectedVersionId);
  const context = buildTeamContext(contextPayload, bossGuidance);
  const prompt = buildAnalyzePrompt({ context });

  let reservedPeriodStart: Date | null = null;
  let reservedUsageSnapshot: CurrentAiUsageSnapshot | null = null;
  try {
    const usageReservation = await reserveUsage({ userId: user.id, action: "analyze" });
    if (!usageReservation.allowed) {
      return c.json(
        { error: "Monthly AI analyze limit reached. Update your plan or wait for reset.", usage: usageReservation.snapshot },
        429
      );
    }
    reservedPeriodStart = usageReservation.periodStart;
    reservedUsageSnapshot = usageReservation.snapshot;
  } catch (error) {
    console.error("[ai/analyze] failed to reserve usage", error);
    return c.json({ error: "Could not validate AI usage limits. Please try again." }, 503);
  }

  let conversationId: string | null = null;

  try {
    const conversation = await getOrCreateConversation(user.id, team.id);
    conversationId = conversation.id;
    const aiResult = await generateAiText(prompt, {
      model: config.ai.models.analyze,
      maxOutputTokens: config.ai.maxOutputTokensByTask.analyze,
      temperature: 0.4,
      abortSignal: c.req.raw.signal,
      analytics: {
        distinctId: user.id,
        traceId: conversation.id,
        properties: { teamId: team.id, kind: "analysis" },
      },
    });
    const scaffoldedAnalysis = ensureAnalysisScaffold(aiResult.text, context);
    const normalizedAnalysis = enforceCheckpointEvolutionGuardrails(
      enforceLegacyTypeLanguage(scaffoldedAnalysis, team.generation),
      context
    );
    const userMessage = "Analyze my current team.";

    const userMessageRow = await saveMessage({
      conversationId: conversation.id,
      role: "user",
      kind: "analysis",
      content: userMessage,
    });
    const assistantMessageRow = await saveMessage({
      conversationId: conversation.id,
      role: "assistant",
      kind: "analysis",
      content: normalizedAnalysis,
      metadata: {
        model: aiResult.model,
        usage: aiResult.usage,
      } as AiMessageMetadata,
    });

    await trimConversationMessages(conversation.id);

    await capturePostHogEventImmediate({
      distinctId: user.id,
      event: "ai_analyze_completed",
      properties: {
        teamId: team.id,
        conversationId: conversation.id,
        generation: team.generation,
        gameId: team.gameId,
        selectedVersionId: team.selectedVersionId ?? null,
        model: aiResult.model,
        promptTokens: aiResult.usage?.promptTokens ?? null,
        completionTokens: aiResult.usage?.completionTokens ?? null,
        totalTokens: aiResult.usage?.totalTokens ?? null,
        analysisCharacters: normalizedAnalysis.length,
      },
    });

    return c.json({
      teamId: team.id,
      analysisText: normalizedAnalysis,
      usage: reservedUsageSnapshot,
      userMessage: {
        id: userMessageRow.id,
        role: "user",
        kind: "analysis",
        content: userMessageRow.content,
        createdAt: userMessageRow.createdAt.toISOString(),
      },
      assistantMessage: {
        id: assistantMessageRow.id,
        role: "assistant",
        kind: "analysis",
        content: assistantMessageRow.content,
        createdAt: assistantMessageRow.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (reservedPeriodStart) {
      void releaseUsageReservation({
        userId: user.id,
        action: "analyze",
        periodStart: reservedPeriodStart,
      }).catch((releaseError) => {
        console.error("[ai/analyze] failed to release usage reservation", releaseError);
      });
    }
    const mapped = toAiHttpError(error);
    await capturePostHogEventImmediate({
      distinctId: user.id,
      event: "ai_analyze_failed",
      properties: {
        teamId: team.id,
        conversationId,
        generation: team.generation,
        gameId: team.gameId,
        selectedVersionId: team.selectedVersionId ?? null,
        status: mapped.status,
        errorMessage: toAnalyticsErrorMessage(error),
      },
    });
    if (!(error instanceof AiRequestError)) {
      console.error("[ai/analyze] unexpected error", error);
    }
    return c.json({ error: mapped.message }, mapped.status);
  }
});

export default ai;
