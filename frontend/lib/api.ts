import type { Pokemon } from "./types";

function getApiUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!rawUrl) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "NEXT_PUBLIC_API_URL is not set in production. API requests will fall back to localhost."
      );
    }
    return "http://localhost:3001";
  }

  const withProtocol =
    !rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")
      ? `https://${rawUrl}`
      : rawUrl;

  return withProtocol.replace(/\/+$/, "");
}

const API_URL = getApiUrl();

export interface SavedTeam {
  id: string;
  name: string;
  generation: number;
  gameId: number;
  selectedVersionId: string | null;
  pokemon: (Pokemon | null)[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileTeamSummary {
  generation: number;
  gameId: number;
  teamCount: number;
  lastUpdatedAt: string;
  latestTeamName: string;
}

export interface ProfilePokemonPreview {
  id: number | null;
  name: string;
  sprite: string | null;
}

export interface ProfileSavedTeam {
  id: string;
  name: string;
  generation: number;
  gameId: number;
  updatedAt: string;
  pokemonPreview: ProfilePokemonPreview[];
}

export interface PublicProfile {
  username: string;
  name: string;
  image: string | null;
  memberSince: string;
  bio: string;
  avatarUrl: string | null;
  avatarFrame: string;
  favoriteTeamId: string | null;
  favoriteGameIds: number[];
  favoritePokemonNames: string[];
  savedTeams: ProfileSavedTeam[];
  favoriteTeam: ProfileSavedTeam | null;
  teamStats: {
    totalTeams: number;
    summaries: ProfileTeamSummary[];
  };
}

export interface MyProfile extends PublicProfile {
  usernameChangeWindow: {
    max: number;
    used: number;
    remaining: number;
    days: number;
  };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

export function fetchTeams(generation?: number, gameId?: number): Promise<SavedTeam[]> {
  const params = new URLSearchParams();
  if (generation != null) params.set("generation", String(generation));
  if (gameId != null) params.set("gameId", String(gameId));
  const qs = params.toString();
  return apiFetch(`/api/teams${qs ? `?${qs}` : ""}`);
}

export function createTeam(data: {
  name: string;
  generation: number;
  gameId: number;
  pokemon: (Pokemon | null)[];
  selectedVersionId?: string;
}): Promise<SavedTeam> {
  return apiFetch("/api/teams", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTeam(
  id: string,
  data: {
    name?: string;
    pokemon?: (Pokemon | null)[];
    selectedVersionId?: string;
  }
): Promise<SavedTeam> {
  return apiFetch(`/api/teams/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteTeam(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/api/teams/${id}`, {
    method: "DELETE",
  });
}

export async function checkUsernameAvailable(
  username: string
): Promise<{ available: boolean; reason?: string }> {
  const res = await fetch(
    `${API_URL}/api/profiles/check-username?q=${encodeURIComponent(username)}`,
    { credentials: "include" }
  );
  if (!res.ok) return { available: false };
  return res.json();
}

export async function loginWithIdentifier(
  identifier: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${API_URL}/api/profiles/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  if (res.ok) return { ok: true };

  const body = await res.json().catch(() => ({}));
  return { ok: false, error: body.error ?? "Invalid credentials" };
}

export function fetchPublicProfile(username: string): Promise<PublicProfile> {
  return apiFetch(`/api/profiles/${encodeURIComponent(username)}`);
}

export function fetchMyProfile(): Promise<MyProfile> {
  return apiFetch("/api/profiles/me");
}

export function updateMyProfile(data: {
  username?: string;
  bio?: string;
  avatarUrl?: string | null;
  avatarFrame?: string;
  favoriteTeamId?: string | null;
  favoriteGameIds?: number[];
  favoritePokemonNames?: string[];
}): Promise<{ success: boolean }> {
  return apiFetch("/api/profiles/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
