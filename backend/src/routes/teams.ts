import { Hono } from "hono";
import { prisma } from "../db";
import { authMiddleware } from "../middleware/auth";

type AuthEnv = {
  Variables: {
    user: { id: string; name: string; email: string };
    session: { id: string; userId: string };
  };
};

const teams = new Hono<AuthEnv>();
teams.use("*", authMiddleware);

// GET /api/teams?generation=&gameId=
teams.get("/", async (c) => {
  const user = c.get("user");
  const generation = c.req.query("generation");
  const gameId = c.req.query("gameId");

  const where: Record<string, unknown> = { userId: user.id };
  if (generation) where.generation = parseInt(generation);
  if (gameId) where.gameId = parseInt(gameId);

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

  const team = await prisma.team.findUnique({ where: { id } });

  if (!team || team.userId !== user.id) {
    return c.json({ error: "Team not found" }, 404);
  }

  return c.json(team);
});

// POST /api/teams
teams.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { name, generation, gameId, pokemon, selectedVersionId } = body;

  if (!name || generation == null || gameId == null || !pokemon) {
    return c.json({ error: "name, generation, gameId, and pokemon are required" }, 400);
  }

  if (!Array.isArray(pokemon) || pokemon.length !== 6) {
    return c.json({ error: "pokemon must be an array of length 6" }, 400);
  }

  const hasAtLeastOnePokemon = pokemon.some((slot) => slot !== null);
  if (!hasAtLeastOnePokemon) {
    return c.json({ error: "Add at least one Pokemon before saving a team." }, 400);
  }

  const team = await prisma.team.create({
    data: {
      name,
      generation,
      gameId,
      pokemon,
      selectedVersionId: selectedVersionId ?? null,
      userId: user.id,
    },
  });

  return c.json(team, 201);
});

// PUT /api/teams/:id
teams.put("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();

  const existing = await prisma.team.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return c.json({ error: "Team not found" }, 404);
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.pokemon !== undefined) data.pokemon = body.pokemon;
  if (body.selectedVersionId !== undefined) data.selectedVersionId = body.selectedVersionId;

  const team = await prisma.team.update({ where: { id }, data });

  return c.json(team);
});

// DELETE /api/teams/:id
teams.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const existing = await prisma.team.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return c.json({ error: "Team not found" }, 404);
  }

  await prisma.team.delete({ where: { id } });

  return c.json({ success: true });
});

export default teams;
