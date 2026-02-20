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
const ALLOWED_EXCLUSIVE_STATUSES = new Set(["exclusive", "shared", "unknown"]);
const ALLOWED_DEX_MODES = new Set<DexMode>(["regional", "national"]);

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

ai.post("/chat", async (c) => {
  if (!config.ai.enabled) {
    return c.json({ error: "AI Coach is disabled." }, 503);
  }
  if (!config.ai.apiKey) {
    return c.json({ error: "AI Coach is not configured." }, 503);
  }

  const user = c.get("user");
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const payload = body as Record<string, unknown>;
  const providedTeamId = parseTeamId(payload.teamId);
  const generation = parsePositiveInt(payload.generation);
  const gameId = parsePositiveInt(payload.gameId);
  const selectedVersionId = parseSelectedVersionId(payload.selectedVersionId);
  const dexMode = parseDexMode(payload.dexMode);
  const versionFilterEnabled = parseBoolean(payload.versionFilterEnabled);
  const typeFilter = parseTypeFilter(payload.typeFilter);
  const allowedPokemonNames = parseAllowedPokemonNames(payload.allowedPokemonNames);
  const regionalDexName = parseRegionalDexName(payload.regionalDexName);
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
  };
  const bossGuidance = getBossGuidanceForVersion(team.selectedVersionId);
  const context = buildTeamContext(contextPayload, bossGuidance);

  try {
    const conversation = await getOrCreateConversation(user.id, team.id);
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
      analytics: {
        distinctId: user.id,
        traceId: conversation.id,
        properties: { teamId: team.id, kind: "chat" },
      },
    });
    const normalizedReply = enforceLegacyTypeLanguage(aiResult.text, team.generation);

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

    return c.json({
      teamId: team.id,
      reply: normalizedReply,
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
    const mapped = toAiHttpError(error);
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
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const payload = body as Record<string, unknown>;
  const providedTeamId = parseTeamId(payload.teamId);
  const generation = parsePositiveInt(payload.generation);
  const gameId = parsePositiveInt(payload.gameId);
  const selectedVersionId = parseSelectedVersionId(payload.selectedVersionId);
  const dexMode = parseDexMode(payload.dexMode);
  const versionFilterEnabled = parseBoolean(payload.versionFilterEnabled);
  const typeFilter = parseTypeFilter(payload.typeFilter);
  const allowedPokemonNames = parseAllowedPokemonNames(payload.allowedPokemonNames);
  const regionalDexName = parseRegionalDexName(payload.regionalDexName);
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
  };
  const bossGuidance = getBossGuidanceForVersion(team.selectedVersionId);
  const context = buildTeamContext(contextPayload, bossGuidance);
  const prompt = buildAnalyzePrompt({ context });

  try {
    const conversation = await getOrCreateConversation(user.id, team.id);
    const aiResult = await generateAiText(prompt, {
      model: config.ai.models.analyze,
      maxOutputTokens: config.ai.maxOutputTokensByTask.analyze,
      temperature: 0.4,
      analytics: {
        distinctId: user.id,
        traceId: conversation.id,
        properties: { teamId: team.id, kind: "analysis" },
      },
    });
    const normalizedAnalysis = enforceLegacyTypeLanguage(aiResult.text, team.generation);
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

    return c.json({
      teamId: team.id,
      analysisText: normalizedAnalysis,
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
    const mapped = toAiHttpError(error);
    if (!(error instanceof AiRequestError)) {
      console.error("[ai/analyze] unexpected error", error);
    }
    return c.json({ error: mapped.message }, mapped.status);
  }
});

export default ai;
