import type { DexMode, Pokemon } from "./types";
import { authClient } from "./auth-client";

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

  const unquoted = rawUrl.replace(/^['"]+|['"]+$/g, "");
  const withProtocol =
    !unquoted.startsWith("http://") && !unquoted.startsWith("https://")
      ? `https://${unquoted}`
      : unquoted;

  let normalized = withProtocol.replace(/\/+$/, "");
  if (/(\/api)+$/i.test(normalized)) {
    normalized = normalized.replace(/(\/api)+$/i, "");
  }
  return normalized;
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
  selectedVersionId: string | null;
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

export type AiMessageRole = "user" | "assistant" | "system_event";
export type AiMessageKind = "chat" | "analysis";

export interface AiMessage {
  id: string;
  role: AiMessageRole;
  kind: AiMessageKind;
  content: string;
  createdAt: string;
}

export interface AiTeamContextPayload {
  teamId?: string;
  generation: number;
  gameId: number;
  selectedVersionId?: string | null;
  team: (Pokemon | null)[];
  dexMode?: DexMode;
  versionFilterEnabled?: boolean;
  typeFilter?: string[];
  allowedPokemonNames?: string[];
  regionalDexName?: string | null;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const requestUrl = `${API_URL}${path}`;
  const res = await fetch(requestUrl, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 404 && path.startsWith("/api/ai/")) {
      throw new Error(
        `AI endpoint returned 404 at ${requestUrl}. Check NEXT_PUBLIC_API_URL points to backend base URL (no /api suffix/path) and backend is deployed with /api/ai routes.`
      );
    }
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
  selectedVersionId?: string | null;
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
    selectedVersionId?: string | null;
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
  username: string,
  signal?: AbortSignal
): Promise<{ available: boolean; reason?: string }> {
  const normalized = username.trim().toLowerCase();
  if (!normalized) return { available: false, reason: "invalid" };

  const result = await authClient
    .isUsernameAvailable({ username: normalized }, { signal })
    .catch(() => null);

  if (!result) return { available: false };
  if (result.error) {
    return {
      available: false,
      reason: result.error.message ?? "invalid",
    };
  }

  return { available: Boolean(result.data?.available) };
}

export async function loginWithIdentifier(
  identifier: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const normalizedIdentifier = identifier.trim();
  if (!normalizedIdentifier || !password) {
    return { ok: false, error: "Email/username and password are required." };
  }

  const result = normalizedIdentifier.includes("@")
    ? await authClient.signIn.email({ email: normalizedIdentifier, password })
    : await authClient.signIn.username({
        username: normalizedIdentifier.toLowerCase(),
        password,
      });

  if (result.error) {
    return { ok: false, error: result.error.message ?? "Invalid credentials" };
  }

  const session = await authClient.getSession().catch(() => null);
  if (!session?.data?.user) {
    return { ok: false, error: "Sign in did not complete. Please try again." };
  }

  return { ok: true };
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
  username?: string
): Promise<{ ok: boolean; error?: string }> {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim();
  const normalizedUsername = username?.trim().toLowerCase();

  if (!normalizedName || !normalizedEmail || !password) {
    return { ok: false, error: "Name, email, and password are required." };
  }

  const result = await authClient.signUp.email({
    name: normalizedName,
    email: normalizedEmail,
    password,
    ...(normalizedUsername ? { username: normalizedUsername } : {}),
  });

  if (result.error) {
    return { ok: false, error: result.error.message ?? "Sign up failed" };
  }

  const session = await authClient.getSession().catch(() => null);
  if (!session?.data?.user) {
    return { ok: false, error: "Sign up did not complete. Please try again." };
  }

  return { ok: true };
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

export function fetchAiMessages(teamId: string): Promise<{ teamId: string; messages: AiMessage[] }> {
  const qs = new URLSearchParams({ teamId }).toString();
  return apiFetch(`/api/ai/messages?${qs}`);
}

export function sendAiChat(
  payload: AiTeamContextPayload & { message: string },
  options?: { signal?: AbortSignal }
): Promise<{
  teamId: string;
  reply: string;
  userMessage: AiMessage;
  assistantMessage: AiMessage;
}> {
  return apiFetch("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify(payload),
    signal: options?.signal,
  });
}

export function analyzeAiTeam(
  payload: AiTeamContextPayload,
  options?: { signal?: AbortSignal }
): Promise<{
  teamId: string;
  analysisText: string;
  userMessage: AiMessage;
  assistantMessage: AiMessage;
}> {
  return apiFetch("/api/ai/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
    signal: options?.signal,
  });
}
