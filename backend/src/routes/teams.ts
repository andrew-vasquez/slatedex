import { Hono } from "hono";
import { prisma } from "../db";
import { authMiddleware } from "../middleware/auth";

type AuthEnv = {
  Variables: {
    user: { id: string; name: string; email: string };
    session: { id: string; userId: string };
  };
};

const MAX_TEAM_NAME_LENGTH = 80;
const MAX_POKEMON_NAME_LENGTH = 48;
const MAX_SPRITE_LENGTH = 500;
const MAX_VERSION_ID_LENGTH = 64;
const MAX_TEAM_PAYLOAD_BYTES = 64_000;
const ALLOWED_EXCLUSIVE_STATUSES = new Set(["exclusive", "shared", "unknown"]);

type TeamPokemonSlot = Record<string, unknown> | null;

const teams = new Hono<AuthEnv>();
teams.use("*", authMiddleware);

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

function parsePokemonSlot(raw: unknown): TeamPokemonSlot | "invalid" {
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

function parsePokemonTeam(raw: unknown): { value?: TeamPokemonSlot[]; error?: string } {
  if (!Array.isArray(raw) || raw.length !== 6) {
    return { error: "pokemon must be an array of length 6" };
  }

  const parsed: TeamPokemonSlot[] = [];
  for (const slot of raw) {
    const normalized = parsePokemonSlot(slot);
    if (normalized === "invalid") {
      return { error: "pokemon contains an invalid slot payload" };
    }
    parsed.push(normalized);
  }

  if (!parsed.some((slot) => slot !== null)) {
    return { error: "Add at least one Pokemon before saving a team." };
  }

  const payloadBytes = new TextEncoder().encode(JSON.stringify(parsed)).length;
  if (payloadBytes > MAX_TEAM_PAYLOAD_BYTES) {
    return { error: "pokemon payload is too large" };
  }

  return { value: parsed };
}

function parseTeamName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_TEAM_NAME_LENGTH) return null;
  return trimmed;
}

function parseSelectedVersionId(raw: unknown): string | null | "invalid" {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") return "invalid";

  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed.length > MAX_VERSION_ID_LENGTH) return "invalid";
  if (!/^[a-z0-9_-]+$/.test(trimmed)) return "invalid";

  return trimmed;
}

// GET /api/teams?generation=&gameId=
teams.get("/", async (c) => {
  const user = c.get("user");
  const generationRaw = c.req.query("generation");
  const gameIdRaw = c.req.query("gameId");

  const where: Record<string, unknown> = { userId: user.id };
  if (generationRaw !== undefined) {
    const generation = parsePositiveInt(generationRaw);
    if (!generation) {
      return c.json({ error: "generation must be a positive integer." }, 400);
    }
    where.generation = generation;
  }

  if (gameIdRaw !== undefined) {
    const gameId = parsePositiveInt(gameIdRaw);
    if (!gameId) {
      return c.json({ error: "gameId must be a positive integer." }, 400);
    }
    where.gameId = gameId;
  }

  const userTeams = await prisma.team.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return c.json(userTeams);
});

// GET /api/teams/:id
teams.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const team = await prisma.team.findFirst({
    where: { id, userId: user.id },
  });

  if (!team) {
    return c.json({ error: "Team not found" }, 404);
  }

  return c.json(team);
});

// POST /api/teams
teams.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const payload = body as Record<string, unknown>;
  const name = parseTeamName(payload.name);
  const generation = parsePositiveInt(payload.generation);
  const gameId = parsePositiveInt(payload.gameId);
  const parsedTeam = parsePokemonTeam(payload.pokemon);
  const selectedVersionId = parseSelectedVersionId(payload.selectedVersionId);

  if (!name || !generation || !gameId) {
    return c.json({ error: "name, generation, and gameId are required." }, 400);
  }

  if (!parsedTeam.value) {
    return c.json({ error: parsedTeam.error ?? "pokemon is invalid" }, 400);
  }

  if (selectedVersionId === "invalid") {
    return c.json({ error: "selectedVersionId is invalid" }, 400);
  }

  const team = await prisma.team.create({
    data: {
      name,
      generation,
      gameId,
      pokemon: parsedTeam.value,
      selectedVersionId,
      userId: user.id,
    },
  });

  return c.json(team, 201);
});

// PUT /api/teams/:id
teams.put("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const existing = await prisma.team.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!existing) {
    return c.json({ error: "Team not found" }, 404);
  }

  const payload = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (payload.name !== undefined) {
    const name = parseTeamName(payload.name);
    if (!name) return c.json({ error: "name must be a non-empty string up to 80 chars" }, 400);
    data.name = name;
  }

  if (payload.pokemon !== undefined) {
    const parsedTeam = parsePokemonTeam(payload.pokemon);
    if (!parsedTeam.value) return c.json({ error: parsedTeam.error ?? "pokemon is invalid" }, 400);
    data.pokemon = parsedTeam.value;
  }

  if (payload.selectedVersionId !== undefined) {
    const selectedVersionId = parseSelectedVersionId(payload.selectedVersionId);
    if (selectedVersionId === "invalid") {
      return c.json({ error: "selectedVersionId is invalid" }, 400);
    }
    data.selectedVersionId = selectedVersionId;
  }

  if (Object.keys(data).length === 0) {
    return c.json({ error: "No valid fields were provided to update." }, 400);
  }

  const team = await prisma.team.update({ where: { id }, data });

  return c.json(team);
});

// DELETE /api/teams/:id
teams.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const existing = await prisma.team.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!existing) {
    return c.json({ error: "Team not found" }, 404);
  }

  await prisma.team.delete({ where: { id } });

  return c.json({ success: true });
});

export default teams;
