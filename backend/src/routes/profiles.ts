import { Hono } from "hono";
import { UserPlan, UserRole } from "../generated/prisma/client";
import { prisma } from "../db";
import { readJsonBody } from "../lib/request";
import { authMiddleware } from "../middleware/auth";
import { getCurrentUsageSnapshot } from "../lib/ai/quota";
import { isProduction } from "../lib/runtime";

type AuthEnv = {
  Variables: {
    user: { id: string; name: string; email: string };
    session: { id: string; userId: string };
  };
};

const MAX_BIO_LENGTH = 240;
const MAX_AVATAR_URL_LENGTH = 500;
const MAX_FAVORITE_GAMES = 3;
const MAX_FAVORITE_POKEMON = 6;
const USERNAME_CHANGE_LIMIT = 2;
const USERNAME_WINDOW_DAYS = 30;
const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$/;
const MAX_ME_SAVED_TEAMS = 24;
const MAX_PUBLIC_SAVED_TEAMS = 12;
const MAX_PROFILE_REQUEST_BODY_BYTES = 16_000;
const AVATAR_FRAMES = new Set([
  "classic",
  "fire",
  "water",
  "electric",
  "grass",
  "psychic",
  "dragon",
]);
const TRUSTED_AVATAR_HOSTS = new Set([
  "lh3.googleusercontent.com",
  "avatars.githubusercontent.com",
  "cdn.discordapp.com",
]);

function toBadge(role: UserRole, plan: UserPlan): "Owner" | "Admin" | "Pro" | null {
  if (role === UserRole.OWNER) return "Owner";
  if (role === UserRole.ADMIN) return "Admin";
  if (plan === UserPlan.PRO) return "Pro";
  return null;
}

type TeamSummary = {
  generation: number;
  gameId: number;
  teamCount: number;
  lastUpdatedAt: string;
  latestTeamName: string;
};

type TeamPokemonPreview = {
  id: number | null;
  name: string;
  sprite: string | null;
};

type TeamCard = {
  id: string;
  name: string;
  generation: number;
  gameId: number;
  selectedVersionId: string | null;
  updatedAt: string;
  pokemonPreview: TeamPokemonPreview[];
};

type TeamQueryRow = {
  id: string;
  name: string;
  generation: number;
  gameId: number;
  selectedVersionId: string | null;
  updatedAt: Date;
  pokemon: unknown;
};

type TeamSummaryRow = {
  generation: number;
  gameId: number;
  updatedAt: Date;
  name: string;
};

const profiles = new Hono<AuthEnv>();

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeNameForUsername(value: string): string {
  const compact = value.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  if (!compact) return "trainer";
  if (compact.length >= 3) return compact.slice(0, 24);
  return `${compact}trainer`.slice(0, 24);
}

function parseFavoriteGameIds(raw: unknown): { value?: number[]; error?: string } {
  if (raw === undefined) return {};
  if (!Array.isArray(raw)) return { error: "favoriteGameIds must be an array of numbers" };

  const values = Array.from(
    new Set(
      raw
        .map((entry) => Number(entry))
        .filter((entry) => Number.isInteger(entry) && entry > 0)
    )
  );

  if (values.length !== raw.length) {
    return { error: "favoriteGameIds must contain positive integer game IDs" };
  }

  if (values.length > MAX_FAVORITE_GAMES) {
    return { error: `favoriteGameIds can include at most ${MAX_FAVORITE_GAMES} games` };
  }

  return { value: values };
}

function parseFavoritePokemonNames(raw: unknown): { value?: string[]; error?: string } {
  if (raw === undefined) return {};
  if (!Array.isArray(raw)) return { error: "favoritePokemonNames must be an array of strings" };

  const normalized = raw.map((entry) => (typeof entry === "string" ? entry.trim() : ""));
  if (normalized.some((entry) => !entry || entry.length > 24)) {
    return { error: "favoritePokemonNames entries must be non-empty strings up to 24 chars" };
  }

  const deduped = Array.from(new Set(normalized.map((entry) => entry.toLowerCase()))).map((key) => {
    const original = normalized.find((entry) => entry.toLowerCase() === key);
    return original ?? key;
  });

  if (deduped.length !== normalized.length) {
    return { error: "favoritePokemonNames cannot contain duplicate names" };
  }

  if (deduped.length > MAX_FAVORITE_POKEMON) {
    return { error: `favoritePokemonNames can include at most ${MAX_FAVORITE_POKEMON} Pokemon` };
  }

  return { value: deduped };
}

function parseAvatarUrl(raw: unknown): { value?: string | null; error?: string } {
  if (raw === undefined) return {};
  if (raw === null) return { value: null };
  if (typeof raw !== "string") return { error: "avatarUrl must be a string or null" };

  const trimmed = raw.trim();
  if (!trimmed) return { value: null };
  if (trimmed.length > MAX_AVATAR_URL_LENGTH) {
    return { error: `avatarUrl must be at most ${MAX_AVATAR_URL_LENGTH} characters` };
  }

  if (trimmed.startsWith("/")) {
    return { value: trimmed };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { error: "avatarUrl must be a valid URL" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { error: "avatarUrl must use http or https" };
  }

  const host = parsed.hostname.toLowerCase();
  const isLocalhost = host === "localhost" || host === "127.0.0.1";
  const isTrustedHost = TRUSTED_AVATAR_HOSTS.has(host);
  const allowHost = isTrustedHost || (!isProduction() && isLocalhost);
  if (!allowHost) {
    return { error: "avatarUrl host is not allowed" };
  }

  return { value: trimmed };
}

function parseAvatarFrame(raw: unknown): { value?: string; error?: string } {
  if (raw === undefined) return {};
  if (typeof raw !== "string") return { error: "avatarFrame must be a string" };

  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return { value: "classic" };
  if (!AVATAR_FRAMES.has(trimmed)) {
    return { error: "avatarFrame is invalid" };
  }

  return { value: trimmed };
}

function parseFavoriteTeamId(raw: unknown): { value?: string | null; error?: string } {
  if (raw === undefined) return {};
  if (raw === null) return { value: null };
  if (typeof raw !== "string") return { error: "favoriteTeamId must be a string or null" };
  const trimmed = raw.trim();
  return { value: trimmed ? trimmed : null };
}

function getTeamSummaries(teams: TeamSummaryRow[]): TeamSummary[] {
  const summaryMap = new Map<string, TeamSummary>();

  for (const team of teams) {
    const key = `${team.generation}:${team.gameId}`;
    const existing = summaryMap.get(key);
    if (!existing) {
      summaryMap.set(key, {
        generation: team.generation,
        gameId: team.gameId,
        teamCount: 1,
        lastUpdatedAt: team.updatedAt.toISOString(),
        latestTeamName: team.name,
      });
      continue;
    }

    existing.teamCount += 1;
    const iso = team.updatedAt.toISOString();
    if (iso > existing.lastUpdatedAt) {
      existing.lastUpdatedAt = iso;
      existing.latestTeamName = team.name;
    }
  }

  return Array.from(summaryMap.values()).sort(
    (a, b) => b.lastUpdatedAt.localeCompare(a.lastUpdatedAt)
  );
}

function extractPokemonPreview(rawPokemon: unknown): TeamPokemonPreview[] {
  if (!Array.isArray(rawPokemon)) return [];

  const preview: TeamPokemonPreview[] = [];
  for (const entry of rawPokemon) {
    if (!entry || typeof entry !== "object") continue;

    const data = entry as Record<string, unknown>;
    const name = typeof data.name === "string" ? data.name : "";
    if (!name) continue;

    preview.push({
      id: typeof data.id === "number" && Number.isFinite(data.id) ? data.id : null,
      name,
      sprite: typeof data.sprite === "string" && data.sprite ? data.sprite : null,
    });

    if (preview.length >= 6) break;
  }

  return preview;
}

function toTeamCards(teams: TeamQueryRow[]): TeamCard[] {
  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    generation: team.generation,
    gameId: team.gameId,
    selectedVersionId: team.selectedVersionId,
    updatedAt: team.updatedAt.toISOString(),
    pokemonPreview: extractPokemonPreview(team.pokemon),
  }));
}

function clampTeamCards(cards: TeamCard[], favoriteTeam: TeamCard | null, max: number): TeamCard[] {
  if (cards.length <= max) return cards;
  const top = cards.slice(0, max);
  if (!favoriteTeam) return top;
  if (top.some((team) => team.id === favoriteTeam.id)) return top;
  return [favoriteTeam, ...top.slice(0, max - 1)];
}

async function ensureUsernameForUser(user: { id: string; name: string; username: string | null }) {
  if (user.username) return user.username;

  const base = normalizeNameForUsername(user.name);
  const userSuffix = user.id.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "user";

  for (let index = 0; index < 40; index += 1) {
    const suffix = index === 0 ? userSuffix : `${userSuffix}${index}`;
    const maxBaseLength = Math.max(3, 30 - suffix.length - 1);
    const candidateBase = base.slice(0, maxBaseLength);
    const candidate = `${candidateBase}_${suffix}`;

    const existing = await prisma.user.findUnique({ where: { username: candidate } });
    if (!existing || existing.id === user.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { username: candidate },
      });
      return candidate;
    }
  }

  throw new Error("Failed to generate a unique username");
}

// Authentication flows use native Better Auth endpoints under `/api/auth/*`.

profiles.get("/me", authMiddleware, async (c) => {
  const authUser = c.get("user");

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      name: true,
      image: true,
      role: true,
      plan: true,
      createdAt: true,
      username: true,
      profile: {
        select: {
          bio: true,
          avatarUrl: true,
          avatarFrame: true,
          favoriteTeamId: true,
          favoriteGameIds: true,
          favoritePokemonNames: true,
        },
      },
    },
  });

  if (!user) return c.json({ error: "User not found" }, 404);

  const username = await ensureUsernameForUser({
    id: user.id,
    name: user.name,
    username: user.username,
  });

  const profile = user.profile
    ? user.profile
    : await prisma.profile.create({
        data: {
          userId: user.id,
        },
        select: {
          bio: true,
          avatarUrl: true,
          avatarFrame: true,
          favoriteTeamId: true,
          favoriteGameIds: true,
          favoritePokemonNames: true,
        },
      });

  const since = new Date();
  since.setDate(since.getDate() - USERNAME_WINDOW_DAYS);

  const usedChanges = await prisma.profileUsernameChange.count({
    where: {
      userId: user.id,
      createdAt: { gte: since },
    },
  });
  const [summaryRows, totalTeams, topTeamRows, favoriteTeamRow, aiUsageSummary] = await Promise.all([
    prisma.team.findMany({
      where: { userId: user.id },
      select: {
        generation: true,
        gameId: true,
        updatedAt: true,
        name: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.team.count({
      where: { userId: user.id },
    }),
    prisma.team.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        generation: true,
        gameId: true,
        selectedVersionId: true,
        updatedAt: true,
        name: true,
        pokemon: true,
      },
      orderBy: { updatedAt: "desc" },
      take: MAX_ME_SAVED_TEAMS,
    }),
    profile.favoriteTeamId
      ? prisma.team.findFirst({
          where: { id: profile.favoriteTeamId, userId: user.id },
          select: {
            id: true,
            generation: true,
            gameId: true,
            selectedVersionId: true,
            updatedAt: true,
            name: true,
            pokemon: true,
          },
        })
      : Promise.resolve(null),
    getCurrentUsageSnapshot(user.id).catch(() => null),
  ]);

  const allSavedTeams = toTeamCards(topTeamRows);
  const favoriteTeamFromTop = favoriteTeamRow
    ? allSavedTeams.find((team) => team.id === favoriteTeamRow.id) ?? null
    : null;
  const favoriteTeam =
    favoriteTeamFromTop ??
    (favoriteTeamRow ? (toTeamCards([favoriteTeamRow])[0] ?? null) : null);
  const savedTeams = clampTeamCards(allSavedTeams, favoriteTeam, MAX_ME_SAVED_TEAMS);

  return c.json({
    username,
    name: user.name,
    image: user.image,
    role: user.role,
    plan: user.plan,
    badge: toBadge(user.role, user.plan),
    aiUsageSummary,
    memberSince: user.createdAt.toISOString(),
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    avatarFrame: profile.avatarFrame,
    favoriteTeamId: favoriteTeam?.id ?? null,
    favoriteGameIds: profile.favoriteGameIds,
    favoritePokemonNames: profile.favoritePokemonNames,
    savedTeams,
    favoriteTeam,
    teamStats: {
      totalTeams,
      summaries: getTeamSummaries(summaryRows),
    },
    usernameChangeWindow: {
      max: USERNAME_CHANGE_LIMIT,
      used: usedChanges,
      remaining: Math.max(0, USERNAME_CHANGE_LIMIT - usedChanges),
      days: USERNAME_WINDOW_DAYS,
    },
  });
});

profiles.put("/me", authMiddleware, async (c) => {
  const authUser = c.get("user");
  const body = await readJsonBody(c.req.raw, MAX_PROFILE_REQUEST_BODY_BYTES);
  if (!body.ok) {
    return c.json({ error: body.error }, body.status);
  }
  const payload = body.value && typeof body.value === "object" ? (body.value as Record<string, unknown>) : null;

  if (!payload) {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      name: true,
      username: true,
    },
  });

  if (!user) return c.json({ error: "User not found" }, 404);

  const currentUsername = await ensureUsernameForUser({
    id: user.id,
    name: user.name,
    username: user.username,
  });

  let nextUsername = currentUsername;
  if (payload.username !== undefined) {
    if (typeof payload.username !== "string") {
      return c.json({ error: "username must be a string" }, 400);
    }

    const normalized = normalizeUsername(payload.username);
    if (!USERNAME_REGEX.test(normalized)) {
      return c.json(
        {
          error:
            "username must be 3-30 characters with lowercase letters, numbers, and underscores",
        },
        400
      );
    }

    if (normalized !== currentUsername) {
      // First-ever intentional username change is free — counts as initial claim,
      // not against the rolling window (auto-generated usernames leave no record).
      const totalEverChanged = await prisma.profileUsernameChange.count({
        where: { userId: user.id },
      });

      if (totalEverChanged > 0) {
        const since = new Date();
        since.setDate(since.getDate() - USERNAME_WINDOW_DAYS);

        const usedChanges = await prisma.profileUsernameChange.count({
          where: {
            userId: user.id,
            createdAt: { gte: since },
          },
        });

        if (usedChanges >= USERNAME_CHANGE_LIMIT) {
          return c.json(
            {
              error: `username can only be changed ${USERNAME_CHANGE_LIMIT} times every ${USERNAME_WINDOW_DAYS} days`,
            },
            429
          );
        }
      }

      const taken = await prisma.user.findUnique({
        where: { username: normalized },
        select: { id: true },
      });

      if (taken && taken.id !== user.id) {
        return c.json({ error: "username is already taken" }, 409);
      }

      nextUsername = normalized;
    }
  }

  let bioToSave: string | undefined;
  if (payload.bio !== undefined) {
    if (typeof payload.bio !== "string") return c.json({ error: "bio must be a string" }, 400);
    const normalizedBio = payload.bio.trim();
    if (normalizedBio.length > MAX_BIO_LENGTH) {
      return c.json({ error: `bio must be at most ${MAX_BIO_LENGTH} characters` }, 400);
    }
    bioToSave = normalizedBio;
  }

  const avatarUrl = parseAvatarUrl(payload.avatarUrl);
  if (avatarUrl.error) return c.json({ error: avatarUrl.error }, 400);

  const avatarFrame = parseAvatarFrame(payload.avatarFrame);
  if (avatarFrame.error) return c.json({ error: avatarFrame.error }, 400);

  const favoriteTeamId = parseFavoriteTeamId(payload.favoriteTeamId);
  if (favoriteTeamId.error) return c.json({ error: favoriteTeamId.error }, 400);

  if (favoriteTeamId.value) {
    const ownedTeam = await prisma.team.findFirst({
      where: { id: favoriteTeamId.value, userId: user.id },
      select: { id: true },
    });
    if (!ownedTeam) return c.json({ error: "favoriteTeamId must reference one of your teams" }, 400);
  }

  const parsedGames = parseFavoriteGameIds(payload.favoriteGameIds);
  if (parsedGames.error) return c.json({ error: parsedGames.error }, 400);

  const parsedPokemon = parseFavoritePokemonNames(payload.favoritePokemonNames);
  if (parsedPokemon.error) return c.json({ error: parsedPokemon.error }, 400);

  const hasProfileUpdates =
    bioToSave !== undefined ||
    avatarUrl.value !== undefined ||
    avatarFrame.value !== undefined ||
    favoriteTeamId.value !== undefined ||
    parsedGames.value !== undefined ||
    parsedPokemon.value !== undefined;

  if (nextUsername === currentUsername && !hasProfileUpdates) {
    return c.json({ success: true });
  }

  await prisma.$transaction(async (tx) => {
    if (nextUsername !== currentUsername) {
      await tx.user.update({
        where: { id: user.id },
        data: { username: nextUsername },
      });

      await tx.profileUsernameChange.create({
        data: {
          userId: user.id,
          fromUsername: currentUsername,
          toUsername: nextUsername,
        },
      });
    }

    if (hasProfileUpdates) {
      await tx.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          bio: bioToSave ?? "",
          avatarUrl: avatarUrl.value ?? null,
          avatarFrame: avatarFrame.value ?? "classic",
          favoriteTeamId: favoriteTeamId.value ?? null,
          favoriteGameIds: parsedGames.value ?? [],
          favoritePokemonNames: parsedPokemon.value ?? [],
        },
        update: {
          ...(bioToSave !== undefined ? { bio: bioToSave } : {}),
          ...(avatarUrl.value !== undefined ? { avatarUrl: avatarUrl.value } : {}),
          ...(avatarFrame.value !== undefined ? { avatarFrame: avatarFrame.value } : {}),
          ...(favoriteTeamId.value !== undefined ? { favoriteTeamId: favoriteTeamId.value } : {}),
          ...(parsedGames.value !== undefined ? { favoriteGameIds: parsedGames.value } : {}),
          ...(parsedPokemon.value !== undefined
            ? { favoritePokemonNames: parsedPokemon.value }
            : {}),
        },
      });
    }
  });

  return c.json({ success: true });
});

profiles.get("/:username", async (c) => {
  const username = normalizeUsername(c.req.param("username"));
  if (!USERNAME_REGEX.test(username)) {
    return c.json({ error: "Profile not found" }, 404);
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      role: true,
      plan: true,
      createdAt: true,
      profile: {
        select: {
          bio: true,
          avatarUrl: true,
          avatarFrame: true,
          favoriteTeamId: true,
          favoriteGameIds: true,
          favoritePokemonNames: true,
        },
      },
    },
  });

  if (!user || !user.username) {
    return c.json({ error: "Profile not found" }, 404);
  }

  const [summaryRows, totalTeams, topTeamRows, favoriteTeamRow] = await Promise.all([
    prisma.team.findMany({
      where: { userId: user.id },
      select: {
        generation: true,
        gameId: true,
        updatedAt: true,
        name: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.team.count({
      where: { userId: user.id },
    }),
    prisma.team.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        generation: true,
        gameId: true,
        selectedVersionId: true,
        updatedAt: true,
        name: true,
        pokemon: true,
      },
      orderBy: { updatedAt: "desc" },
      take: MAX_PUBLIC_SAVED_TEAMS,
    }),
    user.profile?.favoriteTeamId
      ? prisma.team.findFirst({
          where: { id: user.profile.favoriteTeamId, userId: user.id },
          select: {
            id: true,
            generation: true,
            gameId: true,
            selectedVersionId: true,
            updatedAt: true,
            name: true,
            pokemon: true,
          },
        })
      : Promise.resolve(null),
  ]);

  const allSavedTeams = toTeamCards(topTeamRows);
  const favoriteTeamFromTop = favoriteTeamRow
    ? allSavedTeams.find((team) => team.id === favoriteTeamRow.id) ?? null
    : null;
  const favoriteTeam =
    favoriteTeamFromTop ??
    (favoriteTeamRow ? (toTeamCards([favoriteTeamRow])[0] ?? null) : null);
  const savedTeams = clampTeamCards(allSavedTeams, favoriteTeam, MAX_PUBLIC_SAVED_TEAMS);

  return c.json({
    username: user.username,
    name: user.name,
    image: user.image,
    badge: toBadge(user.role, user.plan),
    memberSince: user.createdAt.toISOString(),
    bio: user.profile?.bio ?? "",
    avatarUrl: user.profile?.avatarUrl ?? null,
    avatarFrame: user.profile?.avatarFrame ?? "classic",
    favoriteTeamId: favoriteTeam?.id ?? null,
    favoriteGameIds: user.profile?.favoriteGameIds ?? [],
    favoritePokemonNames: user.profile?.favoritePokemonNames ?? [],
    savedTeams,
    favoriteTeam,
    teamStats: {
      totalTeams,
      summaries: getTeamSummaries(summaryRows),
    },
  });
});

export default profiles;
