import { Hono } from "hono";
import { prisma } from "../db";
import { authMiddleware } from "../middleware/auth";
import { getBossesForGame, isSupportedGame } from "../lib/battle/presetRosters";
import { analyzeBattle } from "../lib/battle/matchupEngine";
import {
  evaluateBattleRealism,
  type BattleCheckpoint,
  type BattleRealismMode,
  type BattleSlotInput,
} from "../lib/battle/progressionRules";

type AuthEnv = {
  Variables: {
    user: { id: string; name: string; email: string };
    session: { id: string; userId: string };
  };
};

const MAX_OPPONENT_TEAM_NAME_LENGTH = 80;
const MAX_OPPONENT_TEAM_NOTES_LENGTH = 500;
const MAX_OPPONENT_TEAM_PAYLOAD_BYTES = 64_000;
const MAX_POKEMON_NAME_LENGTH = 48;
const MAX_SPRITE_LENGTH = 500;
const MAX_VERSION_ID_LENGTH = 64;
const MAX_PRESET_BOSS_KEY_LENGTH = 120;
const ALLOWED_SOURCES = new Set(["MANUAL", "PRESET"]);
const REALISM_MODES = new Set<BattleRealismMode>(["strict", "sandbox"]);

type PokemonSlot = Record<string, unknown> | null;

const battle = new Hono<AuthEnv>();

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

function parseSelectedVersionId(raw: unknown): string | null | "invalid" {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") return "invalid";
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed.length > MAX_VERSION_ID_LENGTH) return "invalid";
  if (!/^[a-z0-9_-]+$/.test(trimmed)) return "invalid";
  return trimmed;
}

function parsePresetBossKey(raw: unknown): string | null | "invalid" {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") return "invalid";
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_PRESET_BOSS_KEY_LENGTH) return "invalid";
  return trimmed;
}

function parsePokemonSlot(raw: unknown): PokemonSlot | "invalid" {
  if (raw === null) return null;
  if (!raw || typeof raw !== "object") return "invalid";

  const candidate = raw as Record<string, unknown>;
  const id = parsePositiveInt(candidate.id);
  const generation = parsePositiveInt(candidate.generation);
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  const types = Array.isArray(candidate.types)
    ? candidate.types
        .map((t) => (typeof t === "string" ? t.trim().toLowerCase() : ""))
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

  if (hp === null || attack === null || defense === null ||
      specialAttack === null || specialDefense === null || speed === null) {
    return "invalid";
  }

  const slot: Record<string, unknown> = {
    id, name, types, generation,
    isFinalEvolution: candidate.isFinalEvolution === true,
    evolutionStage:
      typeof candidate.evolutionStage === "number" &&
      Number.isInteger(candidate.evolutionStage) &&
      candidate.evolutionStage >= 1 &&
      candidate.evolutionStage <= 5
        ? candidate.evolutionStage
        : null,
    hp, attack, defense, specialAttack, specialDefense, speed,
  };

  if (candidate.sprite !== undefined) {
    if (typeof candidate.sprite !== "string" || candidate.sprite.length > MAX_SPRITE_LENGTH) {
      return "invalid";
    }
    slot.sprite = candidate.sprite;
  }

  return slot;
}

function parseBattleCheckpoint(raw: unknown): BattleCheckpoint | null | "invalid" {
  if (raw === undefined || raw === null) return null;
  if (!raw || typeof raw !== "object") return "invalid";
  const candidate = raw as Record<string, unknown>;

  const bossName =
    typeof candidate.bossName === "string" && candidate.bossName.trim().length > 0
      ? candidate.bossName.trim().slice(0, 80)
      : null;

  const stageRaw = candidate.stage;
  const stage =
    stageRaw === "gym" || stageRaw === "elite4" || stageRaw === "champion"
      ? stageRaw
      : null;

  const gymOrder =
    typeof candidate.gymOrder === "number" && Number.isInteger(candidate.gymOrder)
      ? candidate.gymOrder
      : null;

  if (stage === "gym") {
    if (gymOrder === null || gymOrder < 1 || gymOrder > 8) return "invalid";
  } else if (gymOrder !== null && (gymOrder < 1 || gymOrder > 8)) {
    return "invalid";
  }

  return { bossName, stage, gymOrder };
}

function parseRealismMode(raw: unknown): BattleRealismMode | "invalid" {
  if (raw === undefined || raw === null) return "sandbox";
  if (typeof raw !== "string") return "invalid";
  const normalized = raw.trim().toLowerCase() as BattleRealismMode;
  if (!REALISM_MODES.has(normalized)) return "invalid";
  return normalized;
}

function toRealismInput(slot: PokemonSlot): BattleSlotInput | null {
  if (!slot) return null;
  const s = slot as Record<string, unknown>;
  return {
    name: s.name as string,
    isFinalEvolution: s.isFinalEvolution === true,
    evolutionStage: typeof s.evolutionStage === "number" ? s.evolutionStage : null,
  };
}

function parsePokemonTeam(raw: unknown): { value?: PokemonSlot[]; error?: string } {
  if (!Array.isArray(raw) || raw.length !== 6) {
    return { error: "pokemon must be an array of length 6" };
  }

  const parsed: PokemonSlot[] = [];
  for (const slot of raw) {
    const normalized = parsePokemonSlot(slot);
    if (normalized === "invalid") {
      return { error: "pokemon contains an invalid slot payload" };
    }
    parsed.push(normalized);
  }

  const payloadBytes = new TextEncoder().encode(JSON.stringify(parsed)).length;
  if (payloadBytes > MAX_OPPONENT_TEAM_PAYLOAD_BYTES) {
    return { error: "pokemon payload is too large" };
  }

  return { value: parsed };
}

// ── GET /api/battle-presets ──────────────────────────────────────────────────
// Public endpoint — no auth required
battle.get("/presets", async (c) => {
  const gameIdRaw = c.req.query("gameId");
  const selectedVersionId = c.req.query("selectedVersionId") ?? null;

  const gameId = parsePositiveInt(gameIdRaw);
  if (!gameId) {
    return c.json({ error: "gameId must be a positive integer." }, 400);
  }

  const supported = isSupportedGame(gameId);
  if (!supported) {
    return c.json({ supported: false, presets: [] });
  }

  const bosses = getBossesForGame(gameId, selectedVersionId);
  return c.json({ supported: true, presets: bosses });
});

// ── POST /api/battle-matchups/analyze ───────────────────────────────────────
// Public — no auth required (analysis is stateless)
battle.post("/matchups/analyze", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const payload = body as Record<string, unknown>;
  const realismMode = parseRealismMode(payload.realismMode);
  if (realismMode === "invalid") {
    return c.json({ error: "realismMode must be 'strict' or 'sandbox'." }, 400);
  }

  const checkpoint = parseBattleCheckpoint(payload.checkpoint);
  if (checkpoint === "invalid") {
    return c.json({ error: "checkpoint payload is invalid." }, 400);
  }
  const presetBossKey = parsePresetBossKey(payload.presetBossKey);
  if (presetBossKey === "invalid") {
    return c.json({ error: "presetBossKey is invalid." }, 400);
  }
  const selectedVersionId = parseSelectedVersionId(payload.selectedVersionId);
  if (selectedVersionId === "invalid") {
    return c.json({ error: "selectedVersionId is invalid." }, 400);
  }
  const requestGameId =
    payload.gameId === undefined || payload.gameId === null
      ? null
      : parsePositiveInt(payload.gameId);
  if (payload.gameId !== undefined && payload.gameId !== null && !requestGameId) {
    return c.json({ error: "gameId must be a positive integer." }, 400);
  }
  if (realismMode === "strict" && !checkpoint?.stage) {
    return c.json({ error: "Strict mode requires a checkpoint stage." }, 400);
  }

  const myTeamRaw = parsePokemonTeam(payload.myTeam);
  if (!myTeamRaw.value) {
    return c.json({ error: `myTeam: ${myTeamRaw.error ?? "invalid"}` }, 400);
  }

  const oppTeamRaw = parsePokemonTeam(payload.opponentTeam);
  if (!oppTeamRaw.value) {
    return c.json({ error: `opponentTeam: ${oppTeamRaw.error ?? "invalid"}` }, 400);
  }

  // At least one non-null slot on each side
  const hasMyPokemon = myTeamRaw.value.some((s) => s !== null);
  const hasOppPokemon = oppTeamRaw.value.some((s) => s !== null);

  if (!hasMyPokemon || !hasOppPokemon) {
    return c.json({ error: "Both teams must have at least one Pokemon." }, 400);
  }

  // Convert validated slots to PokemonInput shape for engine
  const toInput = (slot: PokemonSlot) => {
    if (!slot) return null;
    const s = slot as Record<string, unknown>;
    return {
      id: s.id as number,
      types: s.types as string[],
      hp: s.hp as number,
      attack: s.attack as number,
      defense: s.defense as number,
      specialAttack: s.specialAttack as number,
      specialDefense: s.specialDefense as number,
      speed: s.speed as number,
    };
  };

  const myTeamInput = myTeamRaw.value.map(toInput);
  const oppTeamInput = oppTeamRaw.value.map(toInput);

  const realism = evaluateBattleRealism({
    mode: realismMode,
    checkpoint,
    myTeam: myTeamRaw.value.map(toRealismInput),
    // Opponent teams can be canonical outliers (e.g. leader aces).
    // Strict mode should gate player realism, not reject known boss rosters.
    opponentTeam: realismMode === "strict" ? [] : oppTeamRaw.value.map(toRealismInput),
    presetContext: {
      gameId: requestGameId,
      selectedVersionId,
      presetBossKey,
    },
  });

  if (realismMode === "strict" && realism.violations.length > 0) {
    return c.json(
      {
        error: "Team is not checkpoint-legal in strict mode.",
        realism,
      },
      400
    );
  }

  const result = analyzeBattle(myTeamInput, oppTeamInput, realism);
  return c.json(result);
});

// ── Auth-required routes for opponent team CRUD ──────────────────────────────
const opponentTeams = new Hono<AuthEnv>();
opponentTeams.use("*", authMiddleware);

// GET /api/battle/opponent-teams
opponentTeams.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const gameIdRaw = c.req.query("gameId");
  const generationRaw = c.req.query("generation");

  const where: Record<string, unknown> = { userId: user.id };

  if (gameIdRaw !== undefined) {
    const gameId = parsePositiveInt(gameIdRaw);
    if (!gameId) return c.json({ error: "gameId must be a positive integer." }, 400);
    where.gameId = gameId;
  }

  if (generationRaw !== undefined) {
    const generation = parsePositiveInt(generationRaw);
    if (!generation) return c.json({ error: "generation must be a positive integer." }, 400);
    where.generation = generation;
  }

  const teams = await prisma.opponentTeam.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return c.json(teams);
});

// POST /api/battle/opponent-teams
opponentTeams.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const payload = body as Record<string, unknown>;

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  if (!name || name.length > MAX_OPPONENT_TEAM_NAME_LENGTH) {
    return c.json({ error: "name is required and must be ≤80 chars." }, 400);
  }

  const generation = parsePositiveInt(payload.generation);
  const gameId = parsePositiveInt(payload.gameId);
  if (!generation || !gameId) {
    return c.json({ error: "generation and gameId are required." }, 400);
  }

  const selectedVersionId = parseSelectedVersionId(payload.selectedVersionId);
  if (selectedVersionId === "invalid") {
    return c.json({ error: "selectedVersionId is invalid." }, 400);
  }

  const sourceRaw = payload.source;
  const source = typeof sourceRaw === "string" && ALLOWED_SOURCES.has(sourceRaw.toUpperCase())
    ? sourceRaw.toUpperCase() as "MANUAL" | "PRESET"
    : "MANUAL";

  const presetBossKey = typeof payload.presetBossKey === "string"
    ? payload.presetBossKey.trim().slice(0, 120)
    : null;

  const notes = typeof payload.notes === "string"
    ? payload.notes.trim().slice(0, MAX_OPPONENT_TEAM_NOTES_LENGTH)
    : null;

  const parsedTeam = parsePokemonTeam(payload.pokemon);
  if (!parsedTeam.value) {
    return c.json({ error: parsedTeam.error ?? "pokemon is invalid" }, 400);
  }

  const realismMode = parseRealismMode(payload.realismMode);
  if (realismMode === "invalid") {
    return c.json({ error: "realismMode must be 'strict' or 'sandbox'." }, 400);
  }
  const checkpoint = parseBattleCheckpoint(payload.checkpoint);
  if (checkpoint === "invalid") {
    return c.json({ error: "checkpoint payload is invalid." }, 400);
  }
  if (realismMode === "strict" && !checkpoint?.stage) {
    return c.json({ error: "Strict mode requires a checkpoint stage." }, 400);
  }
  if (realismMode === "strict") {
    const realism = evaluateBattleRealism({
      mode: realismMode,
      checkpoint,
      myTeam: [],
      opponentTeam: parsedTeam.value.map(toRealismInput),
    });
    if (realism.violations.length > 0) {
      return c.json(
        {
          error: "Opponent team is not checkpoint-legal in strict mode.",
          realism,
        },
        400
      );
    }
  }

  const team = await prisma.opponentTeam.create({
    data: {
      name,
      generation,
      gameId,
      selectedVersionId,
      source,
      presetBossKey,
      notes,
      pokemon: parsedTeam.value as unknown as Parameters<typeof prisma.opponentTeam.create>[0]["data"]["pokemon"],
      userId: user.id,
    },
  });

  return c.json(team, 201);
});

// PUT /api/battle/opponent-teams/:id
opponentTeams.put("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const existing = await prisma.opponentTeam.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return c.json({ error: "Opponent team not found." }, 404);

  const payload = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (payload.name !== undefined) {
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    if (!name || name.length > MAX_OPPONENT_TEAM_NAME_LENGTH) {
      return c.json({ error: "name must be a non-empty string up to 80 chars." }, 400);
    }
    data.name = name;
  }

  if (payload.notes !== undefined) {
    data.notes = typeof payload.notes === "string"
      ? payload.notes.trim().slice(0, MAX_OPPONENT_TEAM_NOTES_LENGTH)
      : null;
  }

  if (payload.pokemon !== undefined) {
    const parsedTeam = parsePokemonTeam(payload.pokemon);
    if (!parsedTeam.value) return c.json({ error: parsedTeam.error ?? "pokemon is invalid" }, 400);
    const realismMode = parseRealismMode(payload.realismMode);
    if (realismMode === "invalid") {
      return c.json({ error: "realismMode must be 'strict' or 'sandbox'." }, 400);
    }
    const checkpoint = parseBattleCheckpoint(payload.checkpoint);
    if (checkpoint === "invalid") {
      return c.json({ error: "checkpoint payload is invalid." }, 400);
    }
    if (realismMode === "strict" && !checkpoint?.stage) {
      return c.json({ error: "Strict mode requires a checkpoint stage." }, 400);
    }
    if (realismMode === "strict") {
      const realism = evaluateBattleRealism({
        mode: realismMode,
        checkpoint,
        myTeam: [],
        opponentTeam: parsedTeam.value.map(toRealismInput),
      });
      if (realism.violations.length > 0) {
        return c.json(
          {
            error: "Opponent team is not checkpoint-legal in strict mode.",
            realism,
          },
          400
        );
      }
    }
    data.pokemon = parsedTeam.value as unknown as Parameters<typeof prisma.opponentTeam.update>[0]["data"]["pokemon"];
  }

  if (payload.selectedVersionId !== undefined) {
    const selectedVersionId = parseSelectedVersionId(payload.selectedVersionId);
    if (selectedVersionId === "invalid") return c.json({ error: "selectedVersionId is invalid." }, 400);
    data.selectedVersionId = selectedVersionId;
  }

  if (Object.keys(data).length === 0) {
    return c.json({ error: "No valid fields provided to update." }, 400);
  }

  const updated = await prisma.opponentTeam.update({ where: { id }, data });
  return c.json(updated);
});

// DELETE /api/battle/opponent-teams/:id
opponentTeams.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");

  const existing = await prisma.opponentTeam.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return c.json({ error: "Opponent team not found." }, 404);

  await prisma.opponentTeam.delete({ where: { id } });
  return c.json({ success: true });
});

battle.route("/opponent-teams", opponentTeams);

export default battle;
